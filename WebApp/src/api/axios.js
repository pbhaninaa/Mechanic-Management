import axios from "axios";
import router from "../router";
import { API_CONFIG, API_ENDPOINTS } from "../utils/constants";
import { toast } from "../utils/toast";

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

// Response interceptor - Handle common errors and show backend messages
API.interceptors.response.use(
  (response) => {
    if (response.config?.skipGlobalToast) return response;
    const method = response.config?.method?.toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const message = response.data?.message;
    if (isMutation && message) {
      toast.success(message);
    }
    return response;
  },
  (error) => {
    const isUnreachable =
      !error.response &&
      (error.code === "ERR_NETWORK" ||
        error.message === "Network Error" ||
        error.message?.toLowerCase?.().includes("network"));
    const isTimeout = error.code === "ECONNABORTED";

    if (isTimeout) {
      error.message = "Request timeout. Please check your connection.";
    } else if (isUnreachable) {
      error.message = "Server is down. Please try again later.";
    }

    if (!error.config?.skipGlobalToast) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred. Please try again later.";
      toast.error(message);
    }
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

    return Promise.reject(error);
  }
);

export default API;
