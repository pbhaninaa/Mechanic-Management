// API Configuration
// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL, 
  TIMEOUT: 10000
};


// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/users/login',
  SIGNUP: '/users',
  PROFILE: '/user-profile',
  APPLICATIONS: '/job-applications',
  DELETE_ACCOUNT: '/users',

  // Request History Endpoints
  REQUEST_HISTORY: '/request-history',
  REQUEST_HISTORY_BY_USER: (username) => `/request-history/user/${username}`,

  // Request Mechanic Endpoints
  REQUEST_MECHANIC: '/request-mechanic',
  REQUEST_MECHANIC_BY_USER: (username) => `/request-mechanic/user/${username}`,
  REQUEST_MECHANIC_BY_ID: (id) => `/request-mechanic/${id}`,

  // Payment Endpoints
  PAYMENTS: '/payments',
  PAYMENT_BY_CLIENT: (username) => `/payments/client/${username}`,
  PAYMENT_BY_MECHANIC: (mechanicId) => `/payments/mechanic/${mechanicId}`,
  PAYMENT_BY_CARWASHID: (carWashId) => `/payments/carWash/${carWashId}`,

  CREATE_PAYMENT: '/payments/pay',
  UPDATE_PAYMENT_STATUS: (id, status) => `/payments/${id}/status?status=${status}`,
  // Car Wash Booking Endpoints
  CARWASH_BOOKINGS: '/carwash-bookings',
  CARWASH_BOOKINGS_BY_CLIENT: (username) => `/carwash-bookings/client/${username}`,
  CARWASH_BOOKING_BY_ID: (id) => `/carwash-bookings/${id}`,
  CREATE_CARWASH_BOOKING: '/carwash-bookings/create',
  UPDATE_CARWASH_BOOKING: (id) => `/carwash-bookings/update/${id}`,
  DELETE_CARWASH_BOOKING: (id) => `/carwash-bookings/delete/${id}`
};

// User Roles
export const USER_ROLES = {
  CLIENT: 'CLIENT',
  MECHANIC: 'MECHANIC',
  ADMIN: 'ADMIN',
  CAR_WASH: 'CARWASH'
};

// Job Status Constants
export const JOB_STATUS = {
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress'||'In progress'||'In progress',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
  SCHEDULED: 'scheduled',
  CLOSED: 'closed',
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
  FAILED: 'failed',
  PAID:'paid',
  OTHER: 'other'
};

// Status Colors (using JOB_STATUS instead of APPLICATION_STATUS)
export const STATUS_COLORS = {
  [JOB_STATUS.ACCEPTED]: '#00C853',   // Neon Green
  [JOB_STATUS.REJECTED]: '#D50000',   // Danger Red
  [JOB_STATUS.PENDING]: '#455A64',    // Asphalt Grey
  [JOB_STATUS.COMPLETED]: '#2962FF',  // Electric Blue
  [JOB_STATUS.IN_PROGRESS]: '#FFAB00',// Safety Yellow

  // Soft/faded colors (semi-transparent)
  SOFT_GREEN: 'rgba(0, 255, 0, 0.45)',
  SOFT_RED: 'rgba(255, 0, 0, 0.45)',
  SOFT_ORANGE: 'rgba(255, 165, 0, 0.45)',
  SOFT_BLUE: 'rgba(0, 0, 255, 0.45)',
  SOFT_PURPLE: 'rgba(128, 0, 128, 0.45)'
};

// Frontend Routes
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  APPLICATIONS: '/applications'
};
