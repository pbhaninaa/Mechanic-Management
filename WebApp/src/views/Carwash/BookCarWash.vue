<template>
  <PageContainer>
    <v-card>
      <v-card-title>Car Wash Booking</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="formValid" lazy-validation>
          <!-- Self or Other -->
          <v-radio-group v-model="useCurrentLocation" row>
            <v-radio label="For Myself" :value="true" />
            <v-radio label="For Someone Else" :value="false" />
          </v-radio-group>


          <v-btn-toggle color="primary" class="mt-3 mb-5" v-model="newBooking.callOutService" mandatory>
            <v-btn :value="false">In-House Service</v-btn>
            <v-btn :value="true">Call Out Service</v-btn>
          </v-btn-toggle>

          <!-- Location errors -->
          <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">{{ locationError }}</v-alert>

          <!-- Location input -->
          <InputField v-model="newBooking.location" label="Location" type="text"
            :disabled="loading || useCurrentLocation" :readonly="useCurrentLocation" required />

          <!-- Car details -->
          <DropdownField v-model="newBooking.carType" :items="carTypes" label="Car Type" required />
          <InputField :model-value="newBooking.carPlate"
            @update:model-value="newBooking.carPlate = (($event) ?? '').toString().toUpperCase()" label="Number plate"
            placeholder="e.g. ABC 123 GP" type="text" :disabled="loading" required />
          <InputField v-model="newBooking.carDescription" label="Car Description (Make/Model/Year/Color)" type="text"
            :disabled="loading" required />

          <!-- Services: hide until location has coords (from GPS or geocoded address) -->
          <template v-if="canShowServices">
            <v-alert v-if="!catalogLoading && serviceTypes.length === 0" type="info" density="compact" class="mb-2">
              No car wash services are available near this location yet. Try a different address or check back later.
            </v-alert>
            <DropdownField v-if="serviceTypes.length > 0" v-model="newBooking.serviceTypes" :items="serviceTypes"
              label="Select Services" multiple chips required :disabled="catalogLoading" />
          </template>
          <v-alert v-else type="info" density="compact" class="mb-2">
            Provide your location above to see available services. If you enter an address we'll look up its coordinates
            to find
            nearby services.
          </v-alert>

          <!-- Price -->
          <InputField v-model="formattedPrice" label="Total Price" type="text" :disabled="true" />

          <!-- Date picker -->
          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="newBooking.date" label="Preferred Date" readonly v-bind="props" outlined
                :disabled="loading" required />
            </template>
            <v-date-picker v-model="newBooking.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>

          <!-- Submit -->
          <Button :label="isEditMode ? 'Update' : 'Book Now'" :color="STATUS_COLORS.REJECTED" @click="submitBooking"
            :loading="loading" :disabled="loading || !isFormComplete" />
        </v-form>
      </v-card-text>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageContainer from "@/components/PageContainer.vue";
import InputField from "@/components/InputField.vue";
import DropdownField from "@/components/DropdownField.vue";
import Button from "@/components/Button.vue";
import { STATUS_COLORS } from "@/utils/constants";
import apiService from "@/api/apiService";
import { getCurrentLocationWithName, geocodeAddressToCoords, ensureLocationName } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import { toLocalDateString } from "@/composables/useDateFormat";

const loggedInUser = getSafeJson("userProfile", {});
const router = useRouter();

interface Booking {
  clientUsername: string;
  carPlate: string;
  carType: string;
  carDescription: string;
  serviceTypes: string[];
  servicePrice: string;
  callOutService: boolean;
  date: string;
  location: string;
  status: string;
}

const loading = ref(false);
const formValid = ref(false);
const isEditMode = ref(false);
const menu = ref(false);
const today = new Date().toISOString().split('T')[0];
const useCurrentLocation = ref(true);
const location = ref({ latitude: 0, longitude: 0 });
const locationError = ref("");
const manualLocationCoordsSet = ref(false);

const canShowServices = computed(() =>
  (useCurrentLocation.value && newBooking.value.location) ||
  (!useCurrentLocation.value && manualLocationCoordsSet.value)
);

const carTypes = [
  "Sedan", "SUV", "Hatchback", "Bakkie", "Van", "Truck", "Luxury",
  "Coupe", "Convertible", "Crossover", "Minivan", "Pickup", "Station Wagon",
  "Electric", "Hybrid", "Sports Car", "Microcar", "Off-Road", "Compact"
];

// Services
const serviceTypes = ref<string[]>([]);
const catalogPriceMap = ref<Record<string, number>>({});
const catalogLoading = ref(true);

const newBooking = ref<Booking>({
  clientUsername: loggedInUser.username || "",
  carPlate: "",
  carType: carTypes[0],
  carDescription: "",
  serviceTypes: [],
  servicePrice: "0",
  callOutService: false,
  date: "",
  location: "",
  status: "pending",
});

// Computed price
const { formatCurrency } = useCurrency();
const computedPrice = computed(() => newBooking.value.serviceTypes.reduce((total, s) => total + (catalogPriceMap.value[s] || 0), 0));
watch(computedPrice, (newPrice) => newBooking.value.servicePrice = newPrice.toFixed(2));
const formattedPrice = computed(() => formatCurrency(computedPrice.value));

// Fetch current location
const fetchCurrentLocation = async () => {
  locationError.value = "";
  const result = await getCurrentLocationWithName();
  if (!result.success) {
    locationError.value = result.message || "Failed to get location. Enter address manually.";
    useCurrentLocation.value = false;
    return;
  }
  location.value = { latitude: result.latitude, longitude: result.longitude };
  newBooking.value.location = ensureLocationName(result.locationName) || "Current location";
};

async function loadNearbyServices() {
  if (location.value.latitude === 0 && location.value.longitude === 0) return;
  catalogLoading.value = true;
  try {
    const res = await apiService.getNearbyServiceOfferings("carwash", location.value.latitude, location.value.longitude, 50);
    // Nearby API returns the array directly (no .data wrapper)
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    const names = [...new Set(list.map((o: any) => o.serviceName ?? o.service_name).filter(Boolean))].sort();
    serviceTypes.value = names;
    const priceMap: Record<string, number> = {};
    list.forEach((o: any) => { const n = o.serviceName ?? o.service_name; if (!n) return; const p = Number(o.price); if (!isNaN(p) && (priceMap[n] == null || p < priceMap[n])) priceMap[n] = p; });
    catalogPriceMap.value = priceMap;
    if (names.length && newBooking.value.serviceTypes.length === 0) newBooking.value.serviceTypes = [names[0]];
  } catch (_) { serviceTypes.value = []; catalogPriceMap.value = {}; }
  finally { catalogLoading.value = false; }
}

// When location changes: for "Myself" we have coords from fetchCurrentLocation; for "Someone Else" geocode then load
watch(() => newBooking.value.location, async (loc) => {
  if (!loc) {
    locationError.value = "";
    serviceTypes.value = [];
    catalogPriceMap.value = {};
    catalogLoading.value = false;
    manualLocationCoordsSet.value = false;
    return;
  }
  if (useCurrentLocation.value) {
    loadNearbyServices();
    return;
  }
  locationError.value = ""; // clear previous error while we try to geocode
  const coords = await geocodeAddressToCoords(loc);
  if (!coords) {
    locationError.value = "We couldn't find coordinates for this address. Please try a more specific address or use 'For Myself' to use your current location.";
    serviceTypes.value = [];
    catalogPriceMap.value = {};
    manualLocationCoordsSet.value = false;
    catalogLoading.value = false;
    return;
  }
  locationError.value = "";
  location.value = { latitude: coords.latitude, longitude: coords.longitude };
  manualLocationCoordsSet.value = true;
  await loadNearbyServices();
});

watch(useCurrentLocation, async (val) => {
  if (val) {
    locationError.value = "";
    await fetchCurrentLocation();
    manualLocationCoordsSet.value = false;
  } else {
    newBooking.value.location = "";
    manualLocationCoordsSet.value = false;
    locationError.value = "";
    serviceTypes.value = [];
    catalogPriceMap.value = {};
  }
});
onMounted(() => { fetchCurrentLocation(); });

// Form completeness (callOutService can be true or false - both are valid selections)
const isFormComplete = computed(() =>
  !!newBooking.value.carPlate &&
  !!newBooking.value.carType &&
  !!newBooking.value.carDescription &&
  (newBooking.value.callOutService === true || newBooking.value.callOutService === false) &&
  newBooking.value.serviceTypes.length > 0 &&
  !!newBooking.value.date &&
  !!newBooking.value.location
);

const submitBooking = async () => {
  if (!isFormComplete.value || loading.value) return;
  loading.value = true;
  try {
    const payload = {
      ...newBooking.value,
      date: toLocalDateString(newBooking.value.date),
      servicePrice: Number(newBooking.value.servicePrice) || computedPrice.value,
      location: ensureLocationName(newBooking.value.location),
    };
    await apiService.createCarWashBooking(payload);
    router.push({ name: "MyWashes" });
  } catch (err: any) { locationError.value = err?.message || "Booking failed"; }
  finally { loading.value = false; }
};
</script>