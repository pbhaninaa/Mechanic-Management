import API from './axios';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Generic API Service
 * Provides a clean interface for all API calls without exposing base URL
 */
class ApiService {
  // ---------- Generic HTTP ----------
  async get(endpoint, config = {}) {
    try {
      const response = await API.get(endpoint, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await API.post(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await API.put(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await API.patch(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(endpoint, config = {}) {
    try {
      const response = await API.delete(endpoint, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ---------- Response/Error Handling ----------
  handleResponse(response) {
    return response?.data ?? response;
  }

  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const status = error.response?.status;
    const apiError = new Error(message);
    apiError.status = status;
    apiError.responseData = error.response?.data;
    apiError.originalError = error;
    console.error('API Error:', { message, status, url: error.config?.url });
    throw apiError;
  }

  // ---------- Authentication ----------
  async authenticateUser(credentials) {
    return this.post(API_ENDPOINTS.LOGIN, credentials);
  }

  /** Alias for authenticateUser - for backward compatibility */
  async login(credentials) {
    return this.authenticateUser(credentials);
  }

  async registerUser(userData, config = {}) {
    return this.post(API_ENDPOINTS.SIGNUP, userData, config);
  }

  /** Alias for registerUser - for backward compatibility */
  async signup(userData) {
    return this.registerUser(userData);
  }

  async deleteUserAccount() {
    return this.delete(API_ENDPOINTS.PROFILE);
  }

  /** Alias for deleteUserAccount */
  async deleteAccount() {
    return this.deleteUserAccount();
  }

  async deleteAllUsersAdmin() {
    return this.delete(API_ENDPOINTS.DELETE_ALL_USERS);
  }

  /** Dev: Reset database, keep logged-in user */
  async resetDb() {
    return this.delete(API_ENDPOINTS.DEV_RESET_DB);
  }

  /** Alias for deleteAllUsersAdmin */
  async deleteAllUsers() {
    return this.deleteAllUsersAdmin();
  }

  /** Request password reset - sends email with reset link */
  async forgotPassword(email) {
    return this.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  }

  /** Reset password with token from email link */
  async resetPassword(token, newPassword) {
    return this.post(API_ENDPOINTS.RESET_PASSWORD, { token, newPassword });
  }

  // ---------- User Profile ----------
  async fetchUserProfile() {
    return this.get(API_ENDPOINTS.PROFILE);
  }

  /** Alias for fetchUserProfile */
  async getUserProfile() {
    return this.fetchUserProfile();
  }

  async saveUserProfile(profileData) {
    return this.put(API_ENDPOINTS.PROFILE, profileData);
  }

  /** Alias for saveUserProfile */
  async updateUserProfile(profileData) {
    return this.saveUserProfile(profileData);
  }

  async createUserProfile(profileData, config = {}) {
    return this.post(API_ENDPOINTS.PROFILE, profileData, config);
  }

  async getAllUsers() {
    return this.get(`${API_ENDPOINTS.PROFILE}/all`);
  }

  async getProfilesByRole(role) {
    return this.get(`${API_ENDPOINTS.PROFILE}/role/${role}`);
  }

  async deleteUserByUsername(username) {
    return this.delete(`${API_ENDPOINTS.DELETE_ACCOUNT}/${username}`);
  }

  async updateUserByUsername(username, data) {
    return this.put(`${API_ENDPOINTS.PROFILE}/user/${username}`, data);
  }
  // ---------- Email ----------
async sendEmail(emailData) {
  return this.post(API_ENDPOINTS.SEND_EMAIL, emailData);
}


  // ---------- Request History ----------
  async createRequestHistory(requestData) {
    return this.post(API_ENDPOINTS.REQUEST_HISTORY, requestData);
  }

  async getAllRequestHistory() {
    return this.get(API_ENDPOINTS.REQUEST_HISTORY);
  }

  async getUserRequestHistory(username) {
    return this.get(API_ENDPOINTS.REQUEST_HISTORY_BY_USER(username));
  }

  async getRequestHistoryByMechanicId(mechanicId) {
    return this.get(API_ENDPOINTS.REQUEST_HISTORY_BY_MECHANIC(mechanicId));
  }

  async updateRequestHistoryByUsername(username, requestData) {
    return this.put(API_ENDPOINTS.REQUEST_HISTORY_BY_USER(username), requestData);
  }

  async deleteRequestHistoryByUsername(username) {
    return this.delete(API_ENDPOINTS.REQUEST_HISTORY_BY_USER(username));
  }

  // ---------- Mechanic Requests (Jobs) ----------
  async createMechanicRequest(data) {
    return this.post(API_ENDPOINTS.REQUEST_MECHANIC, data);
  }

  /** Alias */
  async createRequestMechanic(data) {
    return this.createMechanicRequest(data);
  }

  async updateMechanicRequest(data) {
    return this.put(API_ENDPOINTS.REQUEST_MECHANIC, data);
  }

  /** Alias */
  async updateRequestMechanic(data) {
    return this.updateMechanicRequest(data);
  }

  async fetchMechanicRequestsByCustomer(username) {
    return this.get(API_ENDPOINTS.REQUEST_MECHANIC_BY_USER(username));
  }

  /** Alias */
  async getMechanicRequestsByUser(username) {
    return this.fetchMechanicRequestsByCustomer(username);
  }

  async fetchMechanicRequestById(id) {
    return this.get(API_ENDPOINTS.REQUEST_MECHANIC_BY_ID(id));
  }

  /** Alias */
  async getMechanicRequestsById(id) {
    return this.fetchMechanicRequestById(id);
  }

  async fetchAvailableMechanicJobs() {
    return this.get(`${API_ENDPOINTS.REQUEST_MECHANIC}/available`);
  }

  async deleteMechanicRequestsByCustomer(username) {
    return this.delete(API_ENDPOINTS.REQUEST_MECHANIC_BY_USER(username));
  }

  /** Alias */
  async deleteMechanicRequest(username) {
    return this.deleteMechanicRequestsByCustomer(username);
  }

  // ---------- Payments ----------
async getAllPayments() {
  return this.get(API_ENDPOINTS.PAYMENTS);
}

async getPaymentsByClient(username) {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/client/${username}`);
}
async getPaymentsByClients() {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/getPayments`);
}

async getPaymentsByMechanic(mechanicId) {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/mechanic/${mechanicId}`);
}
async getPaymentsByCarWash(carWashId) {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/carWash/${carWashId}`);
}

async createPayment(paymentRequest) {
  return this.post(API_ENDPOINTS.CREATE_PAYMENT, paymentRequest);
}

async createPaymentIntent(paymentRequest) {
  return this.post(API_ENDPOINTS.CREATE_PAYMENT_INTENT, paymentRequest);
}

async updatePaymentStatus(paymentId, status) {
  return this.put(API_ENDPOINTS.UPDATE_PAYMENT_STATUS(paymentId, status));
}
// ---------- Car Wash Bookings ----------
async createCarWashBooking(bookingData) {
  return this.post(API_ENDPOINTS.CREATE_CARWASH_BOOKING, bookingData);
}

async getAllCarWashBookings() {
  return this.get(API_ENDPOINTS.CARWASH_BOOKINGS);
}

async getCarWashBookingsByClient(username) {
  return this.get(API_ENDPOINTS.CARWASH_BOOKINGS_BY_CLIENT(username));
}

async getCarWashBookingById(id) {
  return this.get(API_ENDPOINTS.CARWASH_BOOKING_BY_ID(id));
}

async updateCarWashBooking(id, bookingData) {
  return this.put(API_ENDPOINTS.UPDATE_CARWASH_BOOKING(id), bookingData, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}


async deleteCarWashBooking(id) {
  return this.delete(API_ENDPOINTS.DELETE_CARWASH_BOOKING(id));
}


}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Also export the class for testing purposes
export { ApiService };
