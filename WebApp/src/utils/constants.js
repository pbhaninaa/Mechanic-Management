// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  TIMEOUT: 30000 // 30s for slow connections
};

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/users/login',
  SIGNUP: '/users',
  PROFILE: '/user-profile',
  APPLICATIONS: '/job-applications',
  DELETE_ACCOUNT: '/users',
  DELETE_ALL_USERS: '/users/all',
  // Auth - Password Reset
  FORGOT_PASSWORD: '/users/forgot-password',
  RESET_PASSWORD: '/users/reset-password',

  // Request History Endpoints
  REQUEST_HISTORY: '/request-history',
  REQUEST_HISTORY_BY_USER: (username) => `/request-history/user/${username}`,
  REQUEST_HISTORY_BY_MECHANIC: (mechanicId) => `/request-history/mechanic/${mechanicId}`,

  // Request Mechanic Endpoints
  REQUEST_MECHANIC: '/request-mechanic',
  REQUEST_MECHANIC_BY_USER: (username) =>`/request-mechanic/user/username/${username}`,
  REQUEST_MECHANIC_BY_ID: (id) => `/request-mechanic/${id}`,

  // Payment Endpoints
  PAYMENTS: '/payments',
  PAYMENT_BY_CLIENT: (username) => `/payments/client/${username}`,
  PAYMENT_BY_MECHANIC: (mechanicId) => `/payments/mechanic/${mechanicId}`,
  PAYMENT_BY_CARWASHID: (carWashId) => `/payments/carWash/${carWashId}`,

  CREATE_PAYMENT: '/payments/pay',
  CREATE_PAYMENT_INTENT: '/payments/create-intent',
  UPDATE_PAYMENT_STATUS: (id, status) => `/payments/${id}/status?status=${status}`,
  // Car Wash Booking Endpoints
  CARWASH_BOOKINGS: '/carwash-bookings',
  CARWASH_BOOKINGS_BY_CLIENT: (username) => `/carwash-bookings/client/${username}`,
  CARWASH_BOOKINGS_BY_CARWASH: (carWashId) => `/carwash-bookings/carwash/${carWashId}`,
  CARWASH_BOOKING_BY_ID: (id) => `/carwash-bookings/${id}`,
  CREATE_CARWASH_BOOKING: '/carwash-bookings/create',
  UPDATE_CARWASH_BOOKING: (id) => `/carwash-bookings/update/${id}`,
  DELETE_CARWASH_BOOKING: (id) => `/carwash-bookings/delete/${id}`,
  // Communication - uses send-message (supports email type)
  SEND_EMAIL: '/send-message',
  // Reports - export and email history by date range
  REPORTS_CARWASH_EXPORT: '/reports/carwash/export',
  REPORTS_CARWASH_EMAIL: '/reports/carwash/email',
  REPORTS_MECHANIC_REQUESTS_EXPORT: '/reports/mechanic-requests/export',
  REPORTS_MECHANIC_REQUESTS_EMAIL: '/reports/mechanic-requests/email',
  REPORTS_EARNINGS_EXPORT: '/reports/earnings/export',
  REPORTS_EARNINGS_EMAIL: '/reports/earnings/email',
  REPORTS_COMPLETED_JOBS_EXPORT: '/reports/completed-jobs/export',
  REPORTS_COMPLETED_JOBS_EMAIL: '/reports/completed-jobs/email',
  // Dev - reset db (admin only, keep logged-in user)
  DEV_RESET_DB: '/users/reset-db'
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
  IN_PROGRESS: 'In progress',
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
  PAID: 'paid',
  OTHER: 'other'
};

// Color Palette
export const COLORS = {
  // Primary Colors
  PRIMARY_BLUE: '#1976D2',
  SECONDARY_GREY: '#424242',
  ACCENT_LIGHT_BLUE: '#82B1FF',

  // Semantic Colors
  SUCCESS_GREEN: '#4CAF50',
  ERROR_RED: '#FF5252',
  WARNING_YELLOW: '#FFC107',
  INFO_BLUE: '#2196F3',

  // Dashboard Card Colors (Vuetify color names for icon styling)
  CARD_BLUE: 'blue',
  CARD_TEAL: 'teal',
  CARD_GREEN: 'green',
  CARD_INDIGO: 'indigo',
  CARD_PURPLE: 'purple',
  CARD_ORANGE: 'orange',

  // Chart Colors (Hex values matching Vuetify colors for visual consistency)
  CHART_BLUE: '#2196F3',        // matches Vuetify blue
  CHART_TEAL: '#009688',         // matches Vuetify teal
  CHART_GREEN: '#4CAF50',        // matches Vuetify green
  CHART_INDIGO: '#3F51B5',       // matches Vuetify indigo
  CHART_PURPLE: '#9C27B0',       // matches Vuetify purple
  CHART_ORANGE: '#FF9800',       // matches Vuetify orange

  // Text Colors
  TEXT_WHITE: '#fff',
  TEXT_BLACK: '#000',
  TEXT_DARK_GREY: '#424242',
  TEXT_LIGHT_GREY: '#9e9e9e',
  TEXT_RED: 'red',

  // Background Colors
  BG_WHITE: '#fff',
  BG_LIGHT_GREY: '#f5f5f5',
  BG_LIGHT_BLUE: 'aliceblue',
  BG_LIGHT_GREY_TABLE: '#f3f4f6',
  BG_YELLOW: 'yellow',

  // Border Colors
  BORDER_LIGHT_GREY: '#e0e0e0',
  BORDER_BLUE: 'rgba(54, 162, 235, 0.9)',

  // Shadow/Overlay Colors
  SHADOW_DARK: 'rgba(0, 0, 0, 0.1)',
  SHADOW_DARK_STRONG: 'rgba(0, 0, 0, 0.15)',
  OVERLAY_BLUE: 'rgba(54, 162, 235, 0.2)',
  POINT_BLUE: 'rgba(54, 162, 235, 1)',

  // Map Colors
  MAP_ROUTE_BLUE: 'blue',

  // Soft/faded colors (semi-transparent)
  SOFT_GREEN: 'rgba(0, 255, 0, 0.45)',
  SOFT_RED: 'rgba(255, 0, 0, 0.45)',
  SOFT_ORANGE: 'rgba(255, 165, 0, 0.45)',
  SOFT_BLUE: 'rgba(0, 0, 255, 0.45)',
  SOFT_PURPLE: 'rgba(128, 0, 128, 0.45)',
  SOFT_GREEN_DARK: 'rgba(0, 128, 0, 0.45)',
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
