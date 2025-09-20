import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Job, 
  LoginCredentials, 
  RegisterData, 
  CreateJobData, 
  UpdateJobData,
  ApiResponse 
} from '../types';

const API_BASE_URL = 'https://api.mechanicapp.com/v1'; // Replace with your actual API URL

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage and redirect to login
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
        await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = 
        await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.api.put('/auth/profile', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  // Jobs endpoints
  async getJobs(filters?: { status?: string; category?: string; priority?: string }): Promise<ApiResponse<Job[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Job[]>> = 
        await this.api.get('/jobs', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }

  async getJobById(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const response: AxiosResponse<ApiResponse<Job>> = 
        await this.api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch job');
    }
  }

  async createJob(jobData: CreateJobData): Promise<ApiResponse<Job>> {
    try {
      const response: AxiosResponse<ApiResponse<Job>> = 
        await this.api.post('/jobs', jobData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create job');
    }
  }

  async updateJob(jobId: string, jobData: UpdateJobData): Promise<ApiResponse<Job>> {
    try {
      const response: AxiosResponse<ApiResponse<Job>> = 
        await this.api.put(`/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update job');
    }
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = 
        await this.api.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete job');
    }
  }

  async acceptJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const response: AxiosResponse<ApiResponse<Job>> = 
        await this.api.post(`/jobs/${jobId}/accept`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to accept job');
    }
  }

  async completeJob(jobId: string, completionData: { actualCost: number; notes?: string }): Promise<ApiResponse<Job>> {
    try {
      const response: AxiosResponse<ApiResponse<Job>> = 
        await this.api.post(`/jobs/${jobId}/complete`, completionData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete job');
    }
  }

  // Mechanic specific endpoints
  async getAvailableJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Job[]>> = 
        await this.api.get('/mechanic/available-jobs');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available jobs');
    }
  }

  async updateMechanicStatus(isAvailable: boolean): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.api.put('/mechanic/status', { isAvailable });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update status');
    }
  }

  // Customer specific endpoints
  async getMyJobs(): Promise<ApiResponse<Job[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Job[]>> = 
        await this.api.get('/customer/my-jobs');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch my jobs');
    }
  }

  async rateJob(jobId: string, rating: { stars: number; review?: string }): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = 
        await this.api.post(`/jobs/${jobId}/rate`, rating);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to rate job');
    }
  }

  // File upload
  async uploadImage(file: any, type: 'profile' | 'job'): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response: AxiosResponse<ApiResponse<{ url: string }>> = 
        await this.api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  }
}

export default new ApiService(); 