<template>
  <PageContainer>
    <!-- Reload Button -->
    <div class="flex justify-end mb-2">
      <button
        @click="reloadLocation"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        🔄 Reload Location
      </button>
    </div>

    <!-- Map Container -->
    <div id="map" class="w-full h-[80vh] rounded-xl shadow-md"></div>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, nextTick } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  destination: {
    lat: number;
    lng: number;
  };
}
const props = defineProps<Partial<Props>>(); // optional
const destination = props.destination ?? { lat: 0, lng: 0 };

const map = ref<L.Map | null>(null);
const routeLayer = ref<L.GeoJSON | null>(null);
const userMarker = ref<L.Marker | null>(null);
const destinationMarker = ref<L.Marker | null>(null);
let watchId: number | null = null;

// Draw route using OSRM API
const drawRoute = async (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  if (!map.value || !to) return;
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return;

    const routeGeoJSON = data.routes[0].geometry;

    // Remove existing route
    if (routeLayer.value) map.value.removeLayer(routeLayer.value);

    // Draw new route
    routeLayer.value = L.geoJSON(routeGeoJSON, { style: { color: "blue", weight: 5 } }).addTo(map.value);

    // Fit map to route
    map.value.fitBounds(L.geoJSON(routeGeoJSON).getBounds(), { padding: [50, 50] });
  } catch (error) {
    console.error("Routing error:", error);
  }
};

// Initialize map
const initMap = (currentLocation: { lat: number; lng: number }) => {
  if (!map.value) {
    map.value = L.map("map").setView([currentLocation.lat, currentLocation.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.value);

    // Add markers
    userMarker.value = L.marker([currentLocation.lat, currentLocation.lng]).addTo(map.value);
    destinationMarker.value = L.marker([destination.lat, destination.lng]).addTo(map.value);
  } else {
    // Update existing user marker
    userMarker.value?.setLatLng([currentLocation.lat, currentLocation.lng]);
  }

  drawRoute(currentLocation, destination);
};

// Reload current location
const reloadLocation = () => {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      await nextTick(); // ensure map div exists
      initMap(currentLocation);
    },
    (err) => console.error(err),
    { enableHighAccuracy: true }
  );
};

// Live updates
const startLiveUpdates = () => {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      userMarker.value?.setLatLng([currentLocation.lat, currentLocation.lng]);
      drawRoute(currentLocation, destination);
    },
    (err) => console.error(err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );
};

onMounted(async () => {
  await nextTick();
  reloadLocation();
  startLiveUpdates();
});

onBeforeUnmount(() => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 80vh;
}
</style>
