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
    return response.data || response;
  }

  handleError(error) {
    const processedError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error
    };
    console.error('API Error:', processedError);
    return processedError;
  }

  // ---------- Authentication ----------
  async login(credentials) {
    return this.post(API_ENDPOINTS.LOGIN, credentials);
  }

  async signup(userData) {
    return this.post(API_ENDPOINTS.SIGNUP, userData);
  }

  async deleteAccount() {
    return this.delete(API_ENDPOINTS.PROFILE);
  }

  // ---------- User Profile ----------
  async getUserProfile() {
    return this.get(API_ENDPOINTS.PROFILE);
  }

  async updateUserProfile(profileData) {
    return this.put(API_ENDPOINTS.PROFILE, profileData);
  }

  async createUserProfile(profileData) {
    return this.post(API_ENDPOINTS.PROFILE, profileData);
  }

  async getAllUsers() {
    return this.get(`${API_ENDPOINTS.PROFILE}/all`);
  }

  async deleteUserByUsername(username) {
    return this.delete(`${API_ENDPOINTS.PROFILE}/user/${username}`);
  }

  async updateUserByUsername(username, data) {
    return this.put(`${API_ENDPOINTS.PROFILE}/user/${username}`, data);
  }

  // ---------- Job Applications ----------
 /* async getJobApplications() {
    return this.get(API_ENDPOINTS.APPLICATIONS);
  }

  async createJobApplication(applicationData) {
    return this.post(API_ENDPOINTS.APPLICATIONS, applicationData);
  }

  async updateJobApplication(id, applicationData) {
    return this.put(`${API_ENDPOINTS.APPLICATIONS}/${id}`, applicationData);
  }

  async deleteJobApplication(id) {
    return this.delete(`${API_ENDPOINTS.APPLICATIONS}/${id}`);
  }

  async getJobApplication(id) {
    return this.get(`${API_ENDPOINTS.APPLICATIONS}/${id}`);
  }
*/
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

  async updateRequestHistoryByUsername(username, requestData) {
    return this.put(API_ENDPOINTS.REQUEST_HISTORY_BY_USER(username), requestData);
  }

  async deleteRequestHistoryByUsername(username) {
    return this.delete(API_ENDPOINTS.REQUEST_HISTORY_BY_USER(username));
  }

  // ---------- Request Mechanic ----------
  async createRequestMechanic(data) {
    return this.post(API_ENDPOINTS.REQUEST_MECHANIC, data);
  }

  async updateRequestMechanic(data) {
    return this.put(API_ENDPOINTS.REQUEST_MECHANIC, data);
  }

  async getMechanicRequestsByUser(username) {
    return this.get(API_ENDPOINTS.REQUEST_MECHANIC_BY_USER(username));
  }
  async getMechanicRequestsById(id) {
    return this.get(API_ENDPOINTS.REQUEST_MECHANIC_BY_ID(id));
  }

  async deleteMechanicRequest(username) {
    return this.delete(API_ENDPOINTS.REQUEST_MECHANIC_BY_USER(username));
  }

  // ---------- Payments ----------
async getAllPayments() {
  return this.get(API_ENDPOINTS.PAYMENTS);
}

async getPaymentsByClient(username) {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/client/${username}`);
}

async getPaymentsByMechanic(mechanicId) {
  return this.get(`${API_ENDPOINTS.PAYMENTS}/mechanic/${mechanicId}`);
}

async createPayment(paymentRequest) {
  return this.post(API_ENDPOINTS.CREATE_PAYMENT, paymentRequest);
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
