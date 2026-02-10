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

      // Clear any existing profile data for fresh login
      localStorage.removeItem("userProfile");
      localStorage.removeItem("profile");
      localStorage.removeItem("role");
      
      const defaultProfile = { username };
      localStorage.setItem("profile", JSON.stringify(defaultProfile));

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
