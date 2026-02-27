import { ref } from "vue";
import router from "../router";
import apiService from "../api/apiService";
import { JOB_STATUS } from "./constants";

export const isAuthenticated = ref(!!localStorage.getItem("token"));

/** Notify app that auth state changed (login/logout/profile save) — avoids full page reload */
export const emitAuthChanged = () => {
  window.dispatchEvent(new CustomEvent("authChanged"));
};

const mapUserTypeToRole = (userType) => {
  if (!userType) return "CLIENT";
  const map = { customer: "CLIENT", mechanic: "MECHANIC", admin: "ADMIN", carwash: "CARWASH" };
  return map[userType.toLowerCase()] || userType.toUpperCase();
};

export const loginUser = async (username, password) => {
  try {
    const res = await apiService.login({ username, password });
    const data = res?.data ?? res;
    if (!data?.accessToken) throw new Error("Invalid response format");

    localStorage.setItem("token", data.accessToken);
    isAuthenticated.value = true;

    localStorage.removeItem("userProfile");
    localStorage.removeItem("profile");
    localStorage.removeItem("role");

    if (data.hasProfile && data.user) {
      try {
        const profileRes = await apiService.getUserProfile();
        const profile = profileRes?.data ?? profileRes;
        if (profile) {
          localStorage.setItem("userProfile", JSON.stringify(profile));
          const role = profile?.roles?.[0];
          localStorage.setItem("role", role ? role.toLowerCase() : "client");
        }
      } catch {
        const u = data.user;
        const userProfile = {
          username: u.username || username,
          firstName: u.name?.split(" ")[0] || "",
          lastName: u.name?.split(" ").slice(1).join(" ") || "",
          email: u.email || "",
          phoneNumber: u.phone || "",
          roles: [mapUserTypeToRole(u.userType)]
        };
        localStorage.setItem("userProfile", JSON.stringify(userProfile));
        localStorage.setItem("role", (userProfile.roles[0] || "client").toLowerCase());
      }
    } else {
      localStorage.setItem("profile", JSON.stringify({ username }));
    }

    return { success: true, message: "Login successful!" };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: err.message || "Login failed" };
  }
};

/**
 * Logout User — SPA navigation (no full reload)
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("profile");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("role");
  localStorage.removeItem("isMechanic");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("isClient");

  isAuthenticated.value = false;
  emitAuthChanged();
  router.push("/login");
};

export const goToSignup = () => {
  router.push("/signup");
};
export const countries = [
  { label: "Afghanistan (+93)", code: "+93", iso: "AF", maxLength: 9, currency: "؋" },
  { label: "Albania (+355)", code: "+355", iso: "AL", maxLength: 9, currency: "L" },
  { label: "Algeria (+213)", code: "+213", iso: "DZ", maxLength: 9, currency: "دج" },
  { label: "Argentina (+54)", code: "+54", iso: "AR", maxLength: 10, currency: "$" },
  { label: "Australia (+61)", code: "+61", iso: "AU", maxLength: 9, currency: "$" },
  { label: "Austria (+43)", code: "+43", iso: "AT", maxLength: 10, currency: "€" },
  { label: "Bangladesh (+880)", code: "+880", iso: "BD", maxLength: 10, currency: "৳" },
  { label: "Belgium (+32)", code: "+32", iso: "BE", maxLength: 9, currency: "€" },
  { label: "Brazil (+55)", code: "+55", iso: "BR", maxLength: 11, currency: "R$" },
  { label: "Bulgaria (+359)", code: "+359", iso: "BG", maxLength: 9, currency: "лв" },
  { label: "Canada (+1)", code: "+1", iso: "CA", maxLength: 10, currency: "$" },
  { label: "China (+86)", code: "+86", iso: "CN", maxLength: 11, currency: "¥" },
  { label: "Croatia (+385)", code: "+385", iso: "HR", maxLength: 9, currency: "€" },
  { label: "Czech Republic (+420)", code: "+420", iso: "CZ", maxLength: 9, currency: "Kč" },
  { label: "Denmark (+45)", code: "+45", iso: "DK", maxLength: 8, currency: "kr" },
  { label: "Egypt (+20)", code: "+20", iso: "EG", maxLength: 10, currency: "£" },
  { label: "Finland (+358)", code: "+358", iso: "FI", maxLength: 10, currency: "€" },
  { label: "France (+33)", code: "+33", iso: "FR", maxLength: 9, currency: "€" },
  { label: "Germany (+49)", code: "+49", iso: "DE", maxLength: 11, currency: "€" },
  { label: "Ghana (+233)", code: "+233", iso: "GH", maxLength: 9, currency: "₵" },
  { label: "Greece (+30)", code: "+30", iso: "GR", maxLength: 10, currency: "€" },
  { label: "Hungary (+36)", code: "+36", iso: "HU", maxLength: 9, currency: "Ft" },
  { label: "India (+91)", code: "+91", iso: "IN", maxLength: 10, currency: "₹" },
  { label: "Indonesia (+62)", code: "+62", iso: "ID", maxLength: 11, currency: "Rp" },
  { label: "Ireland (+353)", code: "+353", iso: "IE", maxLength: 9, currency: "€" },
  { label: "Israel (+972)", code: "+972", iso: "IL", maxLength: 9, currency: "₪" },
  { label: "Italy (+39)", code: "+39", iso: "IT", maxLength: 10, currency: "€" },
  { label: "Japan (+81)", code: "+81", iso: "JP", maxLength: 10, currency: "¥" },
  { label: "Kenya (+254)", code: "+254", iso: "KE", maxLength: 9, currency: "KSh" },
  { label: "Malaysia (+60)", code: "+60", iso: "MY", maxLength: 9, currency: "RM" },
  { label: "Mexico (+52)", code: "+52", iso: "MX", maxLength: 10, currency: "$" },
  { label: "Netherlands (+31)", code: "+31", iso: "NL", maxLength: 9, currency: "€" },
  { label: "New Zealand (+64)", code: "+64", iso: "NZ", maxLength: 9, currency: "$" },
  { label: "Nigeria (+234)", code: "+234", iso: "NG", maxLength: 10, currency: "₦" },
  { label: "Norway (+47)", code: "+47", iso: "NO", maxLength: 8, currency: "kr" },
  { label: "Pakistan (+92)", code: "+92", iso: "PK", maxLength: 10, currency: "₨" },
  { label: "Philippines (+63)", code: "+63", iso: "PH", maxLength: 10, currency: "₱" },
  { label: "Poland (+48)", code: "+48", iso: "PL", maxLength: 9, currency: "zł" },
  { label: "Portugal (+351)", code: "+351", iso: "PT", maxLength: 9, currency: "€" },
  { label: "Romania (+40)", code: "+40", iso: "RO", maxLength: 9, currency: "lei" },
  { label: "Russia (+7)", code: "+7", iso: "RU", maxLength: 10, currency: "₽" },
  { label: "Saudi Arabia (+966)", code: "+966", iso: "SA", maxLength: 9, currency: "﷼" },
  { label: "Singapore (+65)", code: "+65", iso: "SG", maxLength: 8, currency: "$" },
  { label: "South Africa (+27)", code: "+27", iso: "ZA", maxLength: 9, currency: "R" },
  { label: "South Korea (+82)", code: "+82", iso: "KR", maxLength: 10, currency: "₩" },
  { label: "Spain (+34)", code: "+34", iso: "ES", maxLength: 9, currency: "€" },
  { label: "Sweden (+46)", code: "+46", iso: "SE", maxLength: 9, currency: "kr" },
  { label: "Switzerland (+41)", code: "+41", iso: "CH", maxLength: 9, currency: "CHF" },
  { label: "Tanzania (+255)", code: "+255", iso: "TZ", maxLength: 9, currency: "TSh" },
  { label: "Thailand (+66)", code: "+66", iso: "TH", maxLength: 9, currency: "฿" },
  { label: "Turkey (+90)", code: "+90", iso: "TR", maxLength: 10, currency: "₺" },
  { label: "Uganda (+256)", code: "+256", iso: "UG", maxLength: 9, currency: "USh" },
  { label: "Ukraine (+380)", code: "+380", iso: "UA", maxLength: 9, currency: "₴" },
  { label: "United Arab Emirates (+971)", code: "+971", iso: "AE", maxLength: 9, currency: "د.إ" },
  { label: "United Kingdom (+44)", code: "+44", iso: "GB", maxLength: 10, currency: "£" },
  { label: "United States (+1)", code: "+1", iso: "US", maxLength: 10, currency: "$" },
  { label: "Vietnam (+84)", code: "+84", iso: "VN", maxLength: 9, currency: "₫" },
  { label: "Zambia (+260)", code: "+260", iso: "ZM", maxLength: 9, currency: "ZK" },
  { label: "Zimbabwe (+263)", code: "+263", iso: "ZW", maxLength: 9, currency: "Z$" }
];


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
export const getCurrentLocationWithName = async () => {
  if (!navigator.geolocation) {
    return {
      success: false,
      message: "Geolocation is not supported by this browser",
    };
  }

  try {
    // 1️⃣ Get current coordinates
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // 2️⃣ Reverse geocode to get location name
    let locationName = `${latitude}, ${longitude}`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      if (data?.display_name) {
        locationName = data.display_name;
      }
    } catch (e) {
      // fallback already handled
      console.warn("Reverse geocoding failed, using coords only");
    }

    // 3️⃣ Return JSON
    return {
      success: true,
      coords: {
        latitude,
        longitude,
      },
      locationName,
    };
  } catch (err) {
    console.error("Failed to get current location:", err);
    return {
      success: false,
      message: err.message || "Failed to get current location",
    };
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
/**
 * Status priority for sorting requests.
 * Order: pending → accepted/assigned → paid → in progress → completed
 * @param {Array<{status?: string, date?: string}>} items
 * @param {'manage'|'default'} [order='default'] - both use same order: pending, paid, in progress, completed
 * @returns {Array} Sorted copy of items
 */
export const sortRequestsByStatus = (items, order = "default") => {
  if (!Array.isArray(items) || items.length === 0) return [...items];

  const priority = (s) => {
    const status = String(s || "").toLowerCase();
    // Order: pending, accepted/assigned, paid, in progress, completed
    if (status === "pending") return 0;
    if (status === "accepted" || status === "assigned") return 1;
    if (status === "paid") return 2;
    if (status === "in progress") return 3;
    if (status === "completed") return 4;
    if (status === "declined" || status === "rejected") return 5;
    return 6;
  };

  const dateSort = (a, b) => {
    const da = a?.date ? new Date(a.date).getTime() : 0;
    const db = b?.date ? new Date(b.date).getTime() : 0;
    return da - db;
  };

  return [...items].sort((a, b) => {
    const pa = priority(a?.status);
    const pb = priority(b?.status);
    if (pa !== pb) return pa - pb;
    return dateSort(a, b);
  });
};

// Helpers for job status
export const getStatusColor = (status) => {
  if (!status) return "grey";

  switch (status.toLowerCase()) {
    case JOB_STATUS.PENDING:
      return "orange";
    case JOB_STATUS.ACCEPTED:
      case 'in progress':
      return "blue";
    case JOB_STATUS.IN_PROGRESS:
      return "blue";
    case JOB_STATUS.COMPLETED:
       case JOB_STATUS.PAID:
      return "green";   
    case JOB_STATUS.DECLINED:
    case JOB_STATUS.REJECTED:
    case JOB_STATUS.FAILED:
      return "red";
    default:
      return "grey";
  }



  
};
// ==============================================================================================================
export const getUserProfile = () => {
  const profileStr = localStorage.getItem("profile");
  if (!profileStr) return null;
  return JSON.parse(profileStr);
};

export const getUserRole = () => {
  return localStorage.getItem("role");
};  

export const isUserMechanic = () => {
  return localStorage.getItem("isMechanic") === "true";
}

export const isUserAdmin = () => {
  return localStorage.getItem("isAdmin") === "true";
}   

export const isUserClient = () => {
  return localStorage.getItem("isClient") === "true";
} 

export const getBookings = async () => {
  try {
    const res = await apiService.getBookings();
    if (res?.data) {
      return { success: true, bookings: res.data };
    } else {
      throw new Error("Invalid response format");
    }
  } catch (err) {
    console.error("Error fetching bookings:", err);
    return { success: false, message: err.message || "Failed to fetch bookings" };
  } 
};

export const getMechanics = async () => {
  try {
    const res = await apiService.getMechanics();    
    if (res?.data) {
      return { success: true, mechanics: res.data };

    } else {
      throw new Error("Invalid response format");
    }
  } catch (err) {
    console.error("Error fetching mechanics:", err);
    return { success: false, message: err.message || "Failed to fetch mechanics" };
  }
};

export const bookService = async (bookingData) => {
  try {
    const res = await apiService.bookService(bookingData);
    if (res?.data) {
      return { success: true, booking: res.data };
    }

    throw new Error("Invalid response format");
  }
  catch (err) {
    console.error("Error booking service:", err);
    return { success: false, message: err.message || "Failed to book service" };
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {

    const res = await apiService.updateBookingStatus(bookingId, status);
    if (res?.data) {
      return { success: true, booking: res.data };
    }
    throw new Error("Invalid response format");
  } catch (err) {
    console.error("Error updating booking status:", err);
    return { success: false, message: err.message || "Failed to update booking status" };
  }
};
export const getServices = async () => {
  try {
    const res = await apiService.getServices();
    if (res?.data) {
      return { success: true, services: res.data };
    }
    throw new Error("Invalid response format");
  } catch (err) {
    console.error("Error fetching services:", err);
    return { success: false, message: err.message || "Failed to fetch services" };
  }
};
export const getServiceById = async (serviceId) => {
  try {
    const res = await apiService.getServiceById(serviceId);
    if (res?.data) {
      return { success: true, service: res.data };
    }
    throw new Error("Invalid response format");
  }
  catch (err) { 
    console.error("Error fetching service by ID:", err);
    return { success: false, message: err.message || "Failed to fetch service details" };
  }
} 
