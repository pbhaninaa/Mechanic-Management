import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Job,
  LoginCredentials,
  RegisterData,
  CreateJobData,
  UpdateJobData,
  ApiResponse,
} from '../types';
import { CONFIG } from '../config';

/**
 * Maps backend MechanicRequest to frontend Job type.
 */
function mapMechanicRequestToJob(mr: any): Job {
  return {
    id: String(mr.id),
    customerId: mr.username,
    mechanicId: mr.mechanicId != null ? String(mr.mechanicId) : undefined,
    title: mr.title || mr.description || 'Service Request',
    description: mr.description,
    category: mr.category || 'Other',
    priority: (mr.priority || 'medium') as Job['priority'],
    status: mapStatus(mr.status),
    location: {
      latitude: mr.latitude ?? 0,
      longitude: mr.longitude ?? 0,
      address: mr.location || '',
    },
    createdAt: mr.date ? new Date(mr.date) : new Date(),
    updatedAt: mr.date ? new Date(mr.date) : new Date(),
    scheduledDate: mr.date ? new Date(mr.date) : undefined,
  };
}

function mapStatus(status: string): Job['status'] {
  const map: Record<string, Job['status']> = {
    pending: 'pending',
    assigned: 'assigned',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    'In progress': 'in_progress',
  };
  return map[status] || 'pending';
}

/**
 * Maps backend user/profile to frontend User type.
 */
function mapToUser(data: any): User {
  if (!data) return {} as User;
  const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.username || '';
  return {
    id: String(data.id ?? data.idNumber ?? ''),
    email: data.email || '',
    name,
    phone: data.phone || data.phoneNumber || '',
    userType: (data.userType === 'mechanic' ? 'mechanic' : 'customer') as User['userType'],
    isAvailable: data.enabled ?? true,
  };
}

/**
 * Extracts error message from API error response.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message || axiosError.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * API Service - connects Mobile app to backend.
 * Base URL should point to your backend (e.g. http://YOUR_IP:8080/api for local dev).
 */
class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use CONFIG.API_BASE_URL - set to your computer's IP (e.g. 172.20.10.11) for physical device on same WiFi
    const baseURL = CONFIG.API_BASE_URL || 'http://172.20.10.11:8080/api';
    this.api = axios.create({
      baseURL,
      timeout: CONFIG.API_TIMEOUT || 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // ================= AUTH =================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const payload = (credentials.email && !credentials.username)
        ? { email: credentials.email, password: credentials.password }
        : { username: credentials.username || credentials.email, password: credentials.password };
      const { data } = await this.api.post<ApiResponse<{ accessToken: string; user?: any }>>(
        '/users/login',
        payload
      );
      const responseData = data as any;
      const token = responseData.data?.accessToken || responseData.data?.token || responseData.data?.accessToken;
      const userData = responseData.data?.user;
      const user = userData ? mapToUser({ ...userData, userType: userData.userType }) : null;

      if (!token) {
        throw new Error(responseData.message || 'Login failed - no token received');
      }

      return {
        success: responseData.success !== false && responseData.statusCode >= 200 && responseData.statusCode < 300,
        data: { user: user || ({} as User), token },
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const username = userData.email?.split('@')[0]?.replace(/[^a-z0-9]/gi, '') || 
        userData.name?.replace(/\s/g, '').toLowerCase() || 'user' + Date.now();
      await this.api.post('/users', { username, password: userData.password });

      const loginRes = await this.login({
        username,
        password: userData.password,
      });
      const token = loginRes.data?.token;
      if (!token) throw new Error('Registration succeeded but could not obtain token');

      const profilePayload = {
        username,
        email: userData.email,
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        phoneNumber: userData.phone,
        roles: [userData.userType === 'mechanic' ? 'MECHANIC' : 'CLIENT'],
      };
      await this.api.post('/user-profile', profilePayload);

      const profileRes = await this.getProfile();
      const user = profileRes.data ? mapToUser({ ...profileRes.data, userType: userData.userType }) : mapToUser({
        username,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        userType: userData.userType,
      });

      return {
        success: true,
        data: { user, token },
        message: 'Registration successful',
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Registration failed'));
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const { data } = await this.api.get<ApiResponse<any>>('/user-profile');
      const responseData = data as any;
      const profile = responseData.data;
      const user = profile ? mapToUser(profile) : null;
      return {
        success: responseData.success !== false,
        data: user || ({} as User),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to get profile'));
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const payload = {
        username: userData.id ? undefined : undefined,
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        phoneNumber: userData.phone,
      };
      const { data } = await this.api.put<ApiResponse<any>>('/user-profile', payload);
      const responseData = data as any;
      const profile = responseData.data;
      const user = profile ? mapToUser(profile) : null;
      return {
        success: responseData.success !== false,
        data: user || ({} as User),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update profile'));
    }
  }

  // ================= JOBS (Mechanic Requests) =================

  async getJobs(filters?: { status?: string; category?: string; priority?: string }): Promise<ApiResponse<Job[]>> {
    try {
      const { data } = await this.api.get<ApiResponse<any[]>>('/request-mechanic/all', {
        params: filters,
      });
      const responseData = data as any;
      const items = Array.isArray(responseData.data) ? responseData.data : [];
      const jobs = items.map(mapMechanicRequestToJob);
      return {
        success: responseData.success !== false,
        data: jobs,
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch jobs'));
    }
  }

  async getJobById(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const { data } = await this.api.get<ApiResponse<any>>(`/request-mechanic/${jobId}`);
      const responseData = data as any;
      const mr = responseData.data;
      const job = mr ? mapMechanicRequestToJob(mr) : null;
      return {
        success: responseData.success !== false,
        data: job || ({} as Job),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch job'));
    }
  }

  async createJob(jobData: CreateJobData): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const username = user?.username || user?.email?.split('@')[0] || 'customer';

      const payload = {
        username,
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        priority: jobData.priority,
        servicePrice: jobData.servicePrice ?? 0,
        location: jobData.location?.address || 'Unknown',
        latitude: jobData.location?.latitude,
        longitude: jobData.location?.longitude,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      };

      const { data } = await this.api.post<ApiResponse<any>>('/request-mechanic', payload);
      const responseData = data as any;
      const mr = responseData.data;
      const job = mr ? mapMechanicRequestToJob(mr) : null;
      return {
        success: responseData.success !== false,
        data: job || ({} as Job),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create job'));
    }
  }

  async updateJob(jobId: string, jobData: UpdateJobData): Promise<ApiResponse<Job>> {
    try {
      const existing = await this.getJobById(jobId);
      const job = existing.data;
      if (!job) throw new Error('Job not found');

      const payload = {
        id: parseInt(jobId, 10),
        username: job.customerId,
        mechanicId: jobData.mechanicId ? parseInt(String(jobData.mechanicId), 10) : undefined,
        title: job.title,
        description: job.description,
        category: job.category,
        priority: job.priority,
        location: job.location?.address || '',
        latitude: job.location?.latitude,
        longitude: job.location?.longitude,
        date: (job.scheduledDate || job.createdAt).toISOString().split('T')[0],
        status: jobData.status || job.status,
      };

      const { data } = await this.api.put<ApiResponse<any>>('/request-mechanic', payload);
      const responseData = data as any;
      const mr = responseData.data;
      const updatedJob = mr ? mapMechanicRequestToJob(mr) : job;
      return {
        success: responseData.success !== false,
        data: updatedJob,
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update job'));
    }
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`/request-mechanic/${jobId}`);
      return { success: true, message: 'Job deleted successfully' };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete job'));
    }
  }

  async acceptJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const mechanicId = user?.id ? parseInt(String(user.id), 10) : null;
      if (!mechanicId) throw new Error('Mechanic profile required to accept jobs');

      const { data } = await this.api.post<ApiResponse<any>>(`/request-mechanic/${jobId}/accept`, {
        mechanicId,
      });
      const responseData = data as any;
      const mr = responseData.data;
      const job = mr ? mapMechanicRequestToJob(mr) : null;
      return {
        success: responseData.success !== false,
        data: job || ({} as Job),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to accept job'));
    }
  }

  async completeJob(
    jobId: string,
    _completionData?: { actualCost: number; notes?: string }
  ): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const mechanicId = user?.id ? parseInt(String(user.id), 10) : null;
      if (!mechanicId) throw new Error('Mechanic profile required to complete jobs');

      const { data } = await this.api.post<ApiResponse<any>>(`/request-mechanic/${jobId}/complete`, {
        mechanicId,
      });
      const responseData = data as any;
      const mr = responseData.data;
      const job = mr ? mapMechanicRequestToJob(mr) : null;
      return {
        success: responseData.success !== false,
        data: job || ({} as Job),
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to complete job'));
    }
  }

  async getAvailableJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const { data } = await this.api.get<ApiResponse<any[]>>('/request-mechanic/available');
      const responseData = data as any;
      const items = Array.isArray(responseData.data) ? responseData.data : [];
      const jobs = items.map(mapMechanicRequestToJob);
      return {
        success: responseData.success !== false,
        data: jobs,
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch available jobs'));
    }
  }

  async updateMechanicStatus(_isAvailable: boolean): Promise<ApiResponse<User>> {
    return this.getProfile();
  }

  async getMyJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const username = user?.username || user?.email?.split('@')[0];
      if (!username) {
        return { success: true, data: [], message: 'No jobs found' };
      }

      const { data } = await this.api.get<ApiResponse<any[]>>(
        `/request-mechanic/user/username/${username}`
      );
      const responseData = data as any;
      const items = Array.isArray(responseData.data) ? responseData.data : [];
      const jobs = items.map(mapMechanicRequestToJob);
      return {
        success: responseData.success !== false,
        data: jobs,
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch my jobs'));
    }
  }

  async rateJob(
    _jobId: string,
    _rating: { stars: number; review?: string }
  ): Promise<ApiResponse<void>> {
    return { success: true, message: 'Rating submitted' };
  }

  async uploadImage(_file: any, _type: 'profile' | 'job'): Promise<ApiResponse<{ url: string }>> {
    throw new Error('Image upload not implemented');
  }
}

export default new ApiService();
