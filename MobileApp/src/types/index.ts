export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  userType: 'customer' | 'mechanic';
  profileImage?: string;
  rating?: number;
  totalJobs?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  specialties?: string[];
  experience?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
}

export interface Job {
  id: string;
  customerId: string;
  mechanicId?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images?: string[];
  estimatedCost?: number;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  customerRating?: number;
  customerReview?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  // Location tracking fields
  customerLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  mechanicLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  distanceToMechanic?: number; // in meters
  estimatedArrivalTime?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    category?: string;
    priority?: string;
  };
}

export interface RootState {
  auth: AuthState;
  jobs: JobState;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  userType: 'customer' | 'mechanic';
}

export interface CreateJobData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  // Location tracking options
  useCurrentLocation?: boolean;
  locationFor?: 'self' | 'other';
  otherPersonName?: string;
  otherPersonPhone?: string;
}

export interface UpdateJobData {
  status?: string;
  estimatedCost?: number;
  actualCost?: number;
  mechanicId?: string;
  completedDate?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'job_assigned' | 'job_completed' | 'payment_received' | 'general';
  read: boolean;
  createdAt: Date;
  jobId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  jobId?: string;
}

export interface Payment {
  id: string;
  jobId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'card' | 'cash' | 'mobile_money';
  createdAt: Date;
  completedAt?: Date;
}

// Location tracking interfaces
export interface LocationTracking {
  jobId: string;
  customerId: string;
  mechanicId?: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  mechanicLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  distance?: number; // in meters
  estimatedArrivalTime?: Date;
  isActive: boolean;
}

export interface LocationUpdate {
  jobId: string;
  userId: string;
  userType: 'customer' | 'mechanic';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: Date;
} 