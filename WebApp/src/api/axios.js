import axios from "axios";
import router from "../router";
import { API_CONFIG, API_ENDPOINTS } from "../utils/constants";

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
      // Token expired or invalid — avoid redirect for login requests themselves
      const requestUrl = error.config?.url || "";
      // If this is NOT the login endpoint, clear token and navigate to login route
      if (!requestUrl.includes(API_ENDPOINTS.LOGIN)) {
        localStorage.removeItem("token");
        // Use SPA navigation so we don't force a hard reload
        try {
          router.push("/login");
        } catch (e) {
          // fallback to href if router push fails
          window.location.href = "/login";
        }
      }
    }
    
    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please check your connection.";
    }
    
    return Promise.reject(error);
  }
);

export default API;
