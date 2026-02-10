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
import { onMounted, ref, onBeforeUnmount } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  destination: {
    lat: number;
    lng: number;
  };
}

const props = defineProps<Props>();

const map = ref<L.Map | null>(null);
const routeLayer = ref<L.GeoJSON | null>(null);
const userMarker = ref<L.Marker | null>(null);
const destinationMarker = ref<L.Marker | null>(null);
let watchId: number | null = null;

/* =========================
   Draw route using OSRM
========================= */
const drawRoute = async (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) => {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();

    if (!data.routes?.length) return;

    const geometry = data.routes[0].geometry;

    if (routeLayer.value) {
      map.value?.removeLayer(routeLayer.value);
    }

    routeLayer.value = L.geoJSON(geometry, {
      style: { color: "#2563eb", weight: 5 },
    }).addTo(map.value!);
  } catch (err) {
    console.error("Routing error:", err);
  }
};

/* =========================
   Initialize map ONCE
========================= */
const initMap = (location: { lat: number; lng: number }) => {
  if (map.value) return;

  map.value = L.map("map").setView([location.lat, location.lng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map.value);

  userMarker.value = L.marker([location.lat, location.lng])
    .addTo(map.value)
    .bindPopup("You are here")
    .openPopup();

  destinationMarker.value = L.marker([
    props.destination.lat,
    props.destination.lng,
  ])
    .addTo(map.value)
    .bindPopup("Destination");

  drawRoute(location, props.destination);
};

/* =========================
   Update user location
========================= */
const updateUserLocation = (location: { lat: number; lng: number }) => {
  if (!map.value || !userMarker.value) return;

  userMarker.value.setLatLng([location.lat, location.lng]);
  drawRoute(location, props.destination);
};

/* =========================
   Get current location
========================= */
const reloadLocation = () => {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      initMap(loc);
      map.value?.setView([loc.lat, loc.lng], 14);
    },
    (err) => console.error(err),
    { enableHighAccuracy: true }
  );
};

/* =========================
   Live GPS tracking
========================= */
const startLiveUpdates = () => {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      updateUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err) => console.error(err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );
};

onMounted(() => {
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
