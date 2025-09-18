import axios from "axios";
import { useRouter } from "vue-router";
import { API_CONFIG } from "../utils/constants";

const API = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor - Attach JWT automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please check your connection.";
    }
    
    return Promise.reject(error);
  }
);

export default API;
