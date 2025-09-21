import { ref } from "vue";
import router from "../router";
import apiService from "../api/apiService";
import { JOB_STATUS } from "./constants";

export const isAuthenticated = ref(!!localStorage.getItem("token"));


export const loginUser = async (username, password) => {
  try {
    const res = await apiService.login({ username, password });
    if (res?.data?.accessToken) {
      localStorage.setItem("token", res.data.accessToken);

      isAuthenticated.value = true;

      const defaultProfile = { username };
      localStorage.setItem("profile", JSON.stringify(defaultProfile));
      window.location.reload();

      return { success: true, message: "Login successful!" };
    } else {
      throw new Error("Invalid response format");
    }
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: err.message || "Login failed" };
  }
};

/**
 * Logout User
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("profile");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("role");
  localStorage.removeItem("isMechanic");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("isClient");

  window.location.reload();
  isAuthenticated.value = false;
  router.push("/login");

};

export const goToSignup = () => {
  router.push("/signup");
};

export const getDistanceToLocation = async (locationName) => {
  try {
    const currentPosition = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported"));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const currentCoords = {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    };

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        locationName
      )}&format=json&limit=1`
    );

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error("Location not found");
    }

    const targetCoords = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    // Step 3: Calculate distance
    const distance = haversineDistance(currentCoords, targetCoords);

    return {
      success: true,
      distanceKm: distance,
      currentCoords,
      targetCoords,
    };
  } catch (err) {
    console.error("Error getting distance:", err);
    return { success: false, message: err.message };
  }
};

/**
 * Haversine formula to calculate distance (km) between two lat/lng pairs
 */
function haversineDistance(coords1, coords2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
    Math.cos(toRad(coords2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in km
}
// Helpers for job status
export const getStatusColor = (status) => {
  if (!status) return "grey";

  switch (status.toLowerCase()) {
    case JOB_STATUS.PENDING:
      return "orange";
    case JOB_STATUS.ACCEPTED:
      return "blue";
    case JOB_STATUS.IN_PROGRESS:
      return "blue";
    case "In progress":
      return "blue";
    case JOB_STATUS.COMPLETED:
      return "green";
    case JOB_STATUS.CANCELLED:
      return "grey";
    case JOB_STATUS.DECLINED:
    case JOB_STATUS.REJECTED:
    case JOB_STATUS.FAILED:
      return "red";
    default:
      return "grey";
  }
};
