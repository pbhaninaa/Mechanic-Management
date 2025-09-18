# API Service Documentation

This directory contains the API service layer that provides a clean, centralized way to handle all API calls without exposing the base URL in your components.

## Files

- `axios.js` - Axios configuration with interceptors
- `apiService.js` - Generic API service with convenience methods
- `README.md` - This documentation

## Usage

### Basic Usage

Instead of importing axios directly in your components:

```javascript
// ❌ Old way - exposes base URL
import API from '../api/axios';
const response = await API.get('/users/login');
```

Use the API service:

```javascript
// ✅ New way - clean and centralized
import apiService from '../api/apiService';
const response = await apiService.login(credentials);
```

### Generic Methods

The API service provides generic methods for all HTTP operations:

```javascript
// GET request
const data = await apiService.get('/endpoint');

// POST request
const result = await apiService.post('/endpoint', { key: 'value' });

// PUT request
const updated = await apiService.put('/endpoint', { key: 'value' });

// PATCH request
const patched = await apiService.patch('/endpoint', { key: 'value' });

// DELETE request
const deleted = await apiService.delete('/endpoint');
```

### Convenience Methods

The service also includes convenience methods for specific endpoints:

```javascript
// Authentication
const loginResponse = await apiService.login({ username, password });

// User Profile
const profile = await apiService.getUserProfile();
const updatedProfile = await apiService.updateUserProfile(profileData);

// Job Applications
const applications = await apiService.getJobApplications();
const newApp = await apiService.createJobApplication(applicationData);
const updatedApp = await apiService.updateJobApplication(id, applicationData);
const deletedApp = await apiService.deleteJobApplication(id);
const singleApp = await apiService.getJobApplication(id);
```

### Error Handling

All methods return consistent error objects:

```javascript
try {
  const response = await apiService.getUserProfile();
  // Handle success
} catch (error) {
  // error.message - User-friendly error message
  // error.status - HTTP status code
  // error.data - Response data from server
  // error.originalError - Original axios error
  console.error('API Error:', error.message);
}
```

### Configuration

API configuration is centralized in `src/utils/constants.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  TIMEOUT: 10000
};
```

### Adding New Endpoints

1. Add the endpoint to `API_ENDPOINTS` in `constants.js`:
```javascript
export const API_ENDPOINTS = {
  // ... existing endpoints
  NEW_FEATURE: '/new-feature'
};
```

2. Add convenience methods to `apiService.js`:
```javascript
async getNewFeature() {
  return this.get(API_ENDPOINTS.NEW_FEATURE);
}

async createNewFeature(data) {
  return this.post(API_ENDPOINTS.NEW_FEATURE, data);
}
```

### Benefits

- **Centralized Configuration**: Base URL and timeout are managed in one place
- **Consistent Error Handling**: All errors are processed the same way
- **Clean Component Code**: No need to import axios or handle base URLs
- **Easy Testing**: Service methods can be easily mocked
- **Type Safety**: Consistent response format across all methods
- **Automatic Token Handling**: JWT tokens are automatically attached via interceptors

### Migration Guide

To migrate existing components:

1. Replace `import API from '../api/axios'` with `import apiService from '../api/apiService'`
2. Replace `API.get('/endpoint')` with `apiService.get('/endpoint')` or use convenience methods
3. Update error handling to use `error.message` instead of `error.response?.data?.message`
4. Remove base URL from endpoint strings (they're now handled automatically)
