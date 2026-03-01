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

          <!-- Call Out Service -->
          <v-btn-toggle color="primary" class="mt-3 mb-5" v-model="newBooking.callOutService" mandatory>
            <v-btn :value="false">In-House Service</v-btn>
            <v-btn :value="true">Call Out Service</v-btn>
          </v-btn-toggle>

          <v-alert v-if="newBooking.callOutService" type="info" class="mb-2">
            A call-out service includes an additional fee of R{{ additionalFees.callOut ?? 500 }}.
            The total price above includes selected services plus the call-out fee.
          </v-alert>

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

          <!-- Services -->
          <template v-if="canShowServices">
            <v-alert v-if="!catalogLoading && serviceTypes.length === 0" type="info" density="compact" class="mb-2">
              No car wash services are available near this location yet. Try a different address or check back later.
            </v-alert>
            <DropdownField v-if="serviceTypes.length > 0" v-model="newBooking.serviceTypes" :items="serviceTypes"
              label="Select Services" multiple chips required :disabled="catalogLoading" />
          </template>
          <v-alert v-else type="info" density="compact" class="mb-2">
            Provide your location above to see available services. If you enter an address we'll look up its coordinates
            to find nearby services.
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

// Additional fees from API (fallback for display/calculation if fetch fails)
const additionalFees = ref<Record<string, number>>({ callOut: 500 });

// Car types
const carTypes = [
  "Sedan","SUV","Hatchback","Bakkie","Van","Truck","Luxury",
  "Coupe","Convertible","Crossover","Minivan","Pickup","Station Wagon",
  "Electric","Hybrid","Sports Car","Microcar","Off-Road","Compact"
];

// Services
const serviceTypes = ref<string[]>([]);
const catalogPriceMap = ref<Record<string, number>>({});
const catalogLoading = ref(true);

// Booking state
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

// Computed price including call-out
const { formatCurrency } = useCurrency();
const computedPrice = computed(() => {
  const serviceTotal = newBooking.value.serviceTypes.reduce(
    (total, s) => total + (catalogPriceMap.value[s] || 0),
    0
  );
  const callOutFee = newBooking.value.callOutService ? (additionalFees.value.callOut ?? 500) : 0;
  return serviceTotal + callOutFee;
});
watch(computedPrice, (newPrice) => newBooking.value.servicePrice = newPrice.toFixed(2));
const formattedPrice = computed(() => formatCurrency(computedPrice.value));

// Show services only if location has coords
const canShowServices = computed(() =>
  (useCurrentLocation.value && newBooking.value.location) ||
  (!useCurrentLocation.value && manualLocationCoordsSet.value)
);

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

// Load nearby services
async function loadNearbyServices() {
  if (location.value.latitude === 0 && location.value.longitude === 0) return;
  catalogLoading.value = true;
  try {
    const res = await apiService.getNearbyServiceOfferings("carwash", location.value.latitude, location.value.longitude, 50);
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    const names = [...new Set(list.map((o: any) => o.serviceName ?? o.service_name).filter(Boolean))].sort();
    serviceTypes.value = names;
    const priceMap: Record<string, number> = {};
    list.forEach((o: any) => {
      const n = o.serviceName ?? o.service_name;
      if (!n) return;
      const p = Number(o.price);
      if (!isNaN(p) && (priceMap[n] == null || p < priceMap[n])) priceMap[n] = p;
    });
    catalogPriceMap.value = priceMap;
    if (names.length && newBooking.value.serviceTypes.length === 0) newBooking.value.serviceTypes = [names[0]];
  } catch (_) { serviceTypes.value = []; catalogPriceMap.value = {}; }
  finally { catalogLoading.value = false; }
}

// Handle location changes
watch(() => newBooking.value.location, async (loc) => {
  if (!loc) return;
  if (useCurrentLocation.value) { loadNearbyServices(); return; }

  locationError.value = "";
  const coords = await geocodeAddressToCoords(loc);
  if (!coords) {
    locationError.value = "Could not find coordinates. Try a more specific address or use 'For Myself'.";
    serviceTypes.value = [];
    catalogPriceMap.value = {};
    manualLocationCoordsSet.value = false;
    catalogLoading.value = false;
    return;
  }
  location.value = { latitude: coords.latitude, longitude: coords.longitude };
  manualLocationCoordsSet.value = true;
  await loadNearbyServices();
});

watch(useCurrentLocation, async (val) => {
  if (val) { locationError.value = ""; await fetchCurrentLocation(); manualLocationCoordsSet.value = false; }
  else { newBooking.value.location = ""; manualLocationCoordsSet.value = false; locationError.value = ""; serviceTypes.value = []; catalogPriceMap.value = {}; }
});

// Fetch additional fees from API
async function loadAdditionalFees() {
  try {
    const res = await apiService.getAdditionalFees();
    const list = res?.data ?? res ?? [];
    if (Array.isArray(list) && list.length) {
      const map: Record<string, number> = {};
      list.forEach((f: { feeKey?: string; amount?: number }) => {
        if (f?.feeKey != null && typeof f.amount === "number") map[f.feeKey] = f.amount;
      });
      if (Object.keys(map).length) additionalFees.value = { ...additionalFees.value, ...map };
    }
  } catch (_) { /* use fallback */ }
}

onMounted(() => { fetchCurrentLocation(); loadAdditionalFees(); });

// Form completeness
const isFormComplete = computed(() =>
  !!newBooking.value.carPlate &&
  !!newBooking.value.carType &&
  !!newBooking.value.carDescription &&
  (newBooking.value.callOutService === true || newBooking.value.callOutService === false) &&
  newBooking.value.serviceTypes.length > 0 &&
  !!newBooking.value.date &&
  !!newBooking.value.location
);

// Submit booking
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