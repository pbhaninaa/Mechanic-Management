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
import { Alert } from 'react-native';

/**
 * Maps backend MechanicRequest to frontend Job type.
 */
function mapMechanicRequestToJob(mr: any): Job {
  return {
    id: String(mr.id),
    customerId: mr.username,
    mechanicId: mr.mechanicId != null ? String(mr.mechanicId) : undefined,
    title: mr.title || mr.description || 'Service Request',
    description: mr.description || '',
    category: mr.category || 'Other',
    priority: (mr.priority || 'medium') as Job['priority'],
    status: mapStatus(mr.status),
    estimatedCost: mr.servicePrice != null ? Number(mr.servicePrice) : undefined,
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
/**
 * Maps backend status to frontend Job status
*/
function mapStatus(status: string): Job['status'] {
  const key = String(status || '').toLowerCase();
  const map: Record<string, Job['status']> = {
    pending: 'pending',
    assigned: 'assigned',
    accepted: 'assigned',
    paid: 'paid',
    'in progress': 'in_progress',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
    declined: 'cancelled',
  };
  return (map[key] || 'pending') as Job['status'];
}

/**
 * Maps backend user/profile to frontend User type.
 */
function mapToUser(data: any): User {
  if (!data) return {} as User;
  const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.username || '';
  const role = (data.roles?.[0] || data.userType || '').toLowerCase();
  const userTypeMap: Record<string, User['userType']> = {
    mechanic: 'mechanic', admin: 'admin', carwash: 'carwash', client: 'customer', customer: 'customer',
  };
  const userType = userTypeMap[role] || 'customer';
  return {
    id: data.id != null ? String(data.id) : undefined,
    username: data.username || undefined,
    email: data.email ?? '',
    name,
    phone: data.phone || data.phoneNumber || '',
    userType,
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
//  ====================== INITIALIZATION =================
  constructor() {
    // Use CONFIG.API_BASE_URL - set to your computer's IP (e.g. 172.20.10.11) for physical device on same WiFi
    const baseURL = CONFIG.API_BASE_URL || 'https://172.20.10.11:8080/api';
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
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string; hasProfile: boolean }>> {
    try {
      const payload = { username: credentials.username, password: credentials.password };
      const { data } = await this.api.post<ApiResponse<{ accessToken?: string; token?: string; hasProfile?: boolean; user?: any }>>(
        '/users/login',
        payload
      );
      const responseData = data as any;
      const token = responseData.data?.accessToken || responseData.data?.token;
      const hasProfile = responseData.data?.hasProfile === true;
      let user: User;

      if (!token) throw new Error(responseData.message || 'Login failed - no token received');

      if (hasProfile && responseData.data?.user) {
        user = mapToUser({ ...responseData.data.user, userType: responseData.data.user.userType || 'customer' });
      } else if (hasProfile) {
        const profileRes = await this.getProfile();
        const p = profileRes.data as any;
        user = p ? mapToUser({ ...p, userType: p.roles?.[0]?.toLowerCase?.() || 'customer' }) : mapToUser({ username: credentials.username, userType: 'customer' } as any);
      } else {
        user = mapToUser({ username: credentials.username, userType: 'customer' } as any);
      }

      return {
        success: responseData.success !== false,
        data: { user, token, hasProfile },
        message: responseData.message,
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  }

  /** Register = create User only (username, password). No profile. User must login then CreateProfile. */
  async register(userData: RegisterData): Promise<ApiResponse<void>> {
    try {
      await this.api.post('/users', { username: userData.username, password: userData.password });
      return { success: true, message: 'User created' };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Registration failed'));
    }
  }

  /** Create UserProfile (after login, when hasProfile is false). Backend uses auth username. */
  async createProfile(profileData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    countryCode?: string;
    address?: string;
    roles: string[];
  }): Promise<ApiResponse<User>> {
    try {
      const { data } = await this.api.post<ApiResponse<any>>('/user-profile', profileData);
      const responseData = data as any;
      const profile = responseData.data;
      const user = profile ? mapToUser(profile) : ({} as User);
      return { success: responseData.success !== false, data: user, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create profile'));
    }
  }
// ================= LOGOUT =================
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('hasProfile');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
// ================= PROFILE =================
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
// ================= UPDATE PROFILE =================
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
//  ================= GET JOB BY ID =================
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
// ====================== CREATE JOB =================
  async createJob(jobData: CreateJobData): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const username = user?.username || user?.name || user?.email?.split('@')[0] || 'customer';

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
// ====================== UPDATE JOB =================
  async updateJob(jobId: string, jobData: UpdateJobData): Promise<ApiResponse<Job>> {
    try {
      const existing = await this.getJobById(jobId);
      const job = existing.data;
      if (!job) throw new Error('Job not found');

      const payload = {
        id: jobId,
        username: job.customerId,
        mechanicId: jobData.mechanicId ? String(jobData.mechanicId) : job.mechanicId,
        title: job.title,
        description: job.description,
        category: job.category,
        priority: job.priority,
        servicePrice: job.estimatedCost ?? job.actualCost,
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
// ====================== DELETE JOB =================
  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`/request-mechanic/${jobId}`);
      return { success: true, message: 'Job deleted successfully' };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to delete job'));
    }
  }
//  ====================== ACCEPT JOB (Mechanic) =================
  async acceptJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const mechanicId = user?.id ? String(user.id) : null;
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
// ====================== COMPLETE JOB (Mechanic) =================
  async completeJob(
    jobId: string,
    _completionData?: { actualCost: number; notes?: string }
  ): Promise<ApiResponse<Job>> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const mechanicId = user?.id ? String(user.id) : null;
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
//  ====================== GET AVAILABLE JOBS (Mechanic) =================
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
// ====================== UPDATE MECHANIC STATUS (Available/Unavailable) =================
  async updateMechanicStatus(_isAvailable: boolean): Promise<ApiResponse<User>> {
    return this.getProfile();
  }
//  ====================== GET MY JOBS (Customer) =================
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
//  ====================== RATE JOB =================
  async rateJob(
    _jobId: string,
    _rating: { stars: number; review?: string }
  ): Promise<ApiResponse<void>> {
    return { success: true, message: 'Rating submitted' };
  }
//  ======================== UPLOAD IMAGE (Profile/Job) =================
  async uploadImage(_file: any, _type: 'profile' | 'job'): Promise<ApiResponse<{ url: string }>> {
    throw new Error('Image upload not implemented');
  }
  // ================= CAR WASH BOOKINGS =================

  async getCarWashBookingsByClient(username: string): Promise<ApiResponse<any[]>> {
    try {
      const { data } = await this.api.get(`/carwash-bookings/client/${username}`);
      const responseData = data as any;
      const items = Array.isArray(responseData.data) ? responseData.data : [];
      return { success: responseData.success !== false, data: items, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch car wash bookings'));
    }
  }
//  ====================== GET CAR WASH BOOKING BY ID =================
  async createCarWashBooking(booking: any): Promise<ApiResponse<any>> {
    try {
      const { data } = await this.api.post('/carwash-bookings/create', booking);
      const responseData = data as any;
      return { success: responseData.success !== false, data: responseData.data, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create car wash booking'));
    }
  }
//  ====================== GET CAR WASH BOOKING BY ID =================
  async getCarWashBookingById(id: string): Promise<ApiResponse<any>> {
    try {
      const { data } = await this.api.get(`/carwash-bookings/${id}`);
      const responseData = data as any;
      return { success: responseData.success !== false, data: responseData.data, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch car wash booking'));
    }
  }
//  ====================== UPDATE CAR WASH BOOKING =================
  async updateCarWashBooking(id: string, booking: any): Promise<ApiResponse<any>> {
    try {
      const { data } = await this.api.put(`/carwash-bookings/update/${id}`, booking);
      const responseData = data as any;
      return { success: responseData.success !== false, data: responseData.data, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to update car wash booking'));
    }
  }
  // ================= PAYMENTS =================
  async createPayment(payload: { jobId: string; amount: number; clientUsername: string; mechanicId?: string; carWashId?: string; paymentIntentId?: string }): Promise<ApiResponse<any>> {
    try {
      const { data } = await this.api.post('/payments/pay', payload);
      const responseData = data as any;
      return { success: responseData.success !== false, data: responseData.data, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to process payment'));
    }
  }
// ================= CREATE PAYMENT INTENT (Stripe) =================
  async createPaymentIntent(payload: any): Promise<ApiResponse<{ clientSecret?: string; paymentIntentId?: string }>> {
    try {
      const { data } = await this.api.post('/payments/create-intent', payload);
      const responseData = data as any;
      return { success: responseData.success !== false, data: responseData.data, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to create payment intent'));
    }
  }
  // ================= GET PAYMENT HISTORY =================
  async getUserRequestHistory(username: string): Promise<ApiResponse<Job[]>> {
    try {
      const { data } = await this.api.get<ApiResponse<any[]>>(`/request-history/user/${username}`);
      const responseData = data as any;
      const items = Array.isArray(responseData.data) ? responseData.data : [];
      const jobs = items.map(mapMechanicRequestToJob);
      return { success: responseData.success !== false, data: jobs, message: responseData.message };
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Failed to fetch request history'));
    }
  }
}

export default new ApiService();
