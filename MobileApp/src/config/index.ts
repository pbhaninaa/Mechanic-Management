export const CONFIG = {
  // API Configuration
  API_BASE_URL: 'https://api.mechanicapp.com/v1',
  API_TIMEOUT: 10000,
  
  // App Configuration
  APP_NAME: 'MechanicApp',
  APP_VERSION: '1.0.0',
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    SETTINGS: 'settings',
  },
  
  // Job Categories
  JOB_CATEGORIES: [
    'Battery Service',
    'Tire Service',
    'Engine Repair',
    'Electrical',
    'Diagnostics',
    'Oil Change',
    'Brake Service',
    'AC/Heating',
    'Towing',
    'Emergency',
    'Other',
  ],
  
  // Job Priorities
  JOB_PRIORITIES: [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FF9800' },
    { value: 'high', label: 'High', color: '#F44336' },
    { value: 'emergency', label: 'Emergency', color: '#9C27B0' },
  ],
  
  // Job Statuses
  JOB_STATUSES: [
    { value: 'pending', label: 'Pending', color: '#FF9800' },
    { value: 'assigned', label: 'Assigned', color: '#2196F3' },
    { value: 'in_progress', label: 'In Progress', color: '#9C27B0' },
    { value: 'completed', label: 'Completed', color: '#4CAF50' },
    { value: 'cancelled', label: 'Cancelled', color: '#F44336' },
  ],
  
  // Colors
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    INFO: '#5AC8FA',
    LIGHT_GRAY: '#F2F2F7',
    GRAY: '#8E8E93',
    DARK_GRAY: '#1C1C1E',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
  },
  
  // Dimensions
  DIMENSIONS: {
    PADDING: 16,
    MARGIN: 16,
    BORDER_RADIUS: 8,
    BUTTON_HEIGHT: 48,
    INPUT_HEIGHT: 48,
  },
  
  // Font Sizes
  FONT_SIZES: {
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 16,
    XLARGE: 18,
    XXLARGE: 20,
    TITLE: 24,
    HEADER: 28,
  },
  
  // Map Configuration
  MAP: {
    DEFAULT_LATITUDE: 37.7749,
    DEFAULT_LONGITUDE: -122.4194,
    DEFAULT_ZOOM: 13,
    SEARCH_RADIUS: 5000, // meters
  },
  
  // Notification Configuration
  NOTIFICATIONS: {
    CHANNEL_ID: 'mechanic_app',
    CHANNEL_NAME: 'Mechanic App Notifications',
    CHANNEL_DESCRIPTION: 'Notifications for mechanic app',
  },
  
  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    MAX_FILES: 5,
  },
  
  // Validation
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

export default CONFIG; 