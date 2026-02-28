<template>
  <PageContainer>
    <v-card>
      <v-card-title>Request Mechanic</v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submitRequest">

          <v-radio-group v-model="request.forSelf" row>
            <v-radio label="For Myself" :value="true" />
            <v-radio label="For Someone Else" :value="false" />
          </v-radio-group>
          <v-btn-toggle color="primary" class="mt-3 mb-5" v-model="request.callOutService" mandatory>
            <v-btn :value="false">In-House Service</v-btn>
            <v-btn :value="true">Call Out Service</v-btn>
          </v-btn-toggle>
          <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">{{ locationError }}</v-alert>

          <InputField v-model="request.location" label="Location" placeholder="Enter your address"
            :disabled="loading || request.forSelf" :readonly="request.forSelf" required />

          <v-divider class="my-4" />
          <div class="text-subtitle-2 text-medium-emphasis mb-2">Vehicle details</div>
          <DropdownField v-model="request.carType" :items="carsList" label="Car brand" placeholder="Select car brand (e.g. Toyota, Ford)"
            :disabled="loading" required />
          <InputField v-model="request.carPlate" label="Car plate" placeholder="e.g. ABC 123 GP" :disabled="loading" required />
          <InputField v-model="request.vinNumber" label="VIN number" placeholder="Vehicle identification number" :disabled="loading" required />
          <v-divider class="my-4" />

          
          <template v-if="canShowServices">
            <DropdownField v-if="jobOptions.length > 0" v-model="request.serviceTypes" :items="jobOptions"
              label="Select Services" multiple chips required :disabled="loading || catalogLoading" />
            <v-alert v-else-if="!catalogLoading && jobOptions.length === 0" type="info" class="mb-2">
              No mechanic services are available near this location yet. Try a different address or check back later.
            </v-alert>
          </template>
          <v-alert v-else type="info" density="compact" class="mb-2">
            Provide your location above to see available services. If you enter an address we'll look up its coordinates
            to find
            nearby services.
          </v-alert>

          <InputField :model-value="formattedPrice" label="Total Price" type="text" disabled />

          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="request.date" label="Preferred Date" readonly v-bind="props" outlined
                :disabled="loading" required />
            </template>
            <v-date-picker v-model="request.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>

          <v-alert v-if="!loading && missingFields.length > 0" type="info" density="compact" class="mb-3">
            To enable the button, complete: {{ missingFields.join(", ") }}.
          </v-alert>
          <Button label="Request Mechanic" :color="STATUS_COLORS.REJECTED" :loading="loading"
            :disabled="!isFormValid || loading" @click="submitRequest" />

          <v-alert v-if="message" :type="messageType" class="mt-3" closable @click:close="message = ''">
            {{ message }}
          </v-alert>

        </v-form>
      </v-card-text>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import InputField from "@/components/InputField.vue";
import DropdownField from "@/components/DropdownField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import { STATUS_COLORS, JOB_STATUS } from "@/utils/constants";
import { useRouter } from "vue-router";
import { getCurrentLocationWithName, geocodeAddressToCoords, ensureLocationName, carsList } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import { toLocalDateString } from "@/composables/useDateFormat";

const router = useRouter();
const today = new Date().toISOString().split('T')[0];
const loading = ref(false);
const menu = ref(false);
const request = ref({
  forSelf: true,
  serviceTypes: [] as string[],
  location: "",
  carPlate: "",
  vinNumber: "",
  callOutService: false,
  carType: "",
  date: "",
  servicePrice: 0,
});
const jobOptions = ref<string[]>([]);
const mechanicServicePrices = ref<Record<string, number>>({});
const catalogLoading = ref(true);
const location = ref({ latitude: 0, longitude: 0 });
const manualLocationCoordsSet = ref(false); 
const locationError = ref("");
const message = ref("");
const messageType = ref<"success" | "error">("success");
const form = ref(null);

const canShowServices = computed(() =>
  (request.value.forSelf && request.value.location) ||
  (!request.value.forSelf && manualLocationCoordsSet.value)
);

const { formatCurrency } = useCurrency();
const computedPrice = computed(() => request.value.serviceTypes.reduce((total, s) => total + (mechanicServicePrices.value[s] ?? 0), 0));
const formattedPrice = computed(() => formatCurrency(computedPrice.value));
watch(computedPrice, (v) => request.value.servicePrice = v, { immediate: true });

const hasValidDate = computed(() => {
  const d = request.value.date;
  if (d == null) return false;
  if (typeof d === "string") return d.trim() !== "";
  if (d instanceof Date && !isNaN(d.getTime())) return true;
  return true; // other truthy (e.g. date object from picker)
});

const hasValidCarType = computed(() => {
  const ct = request.value.carType;
  if (Array.isArray(ct)) return ct.length > 0;
  if (ct != null && typeof ct === "string") return ct.trim() !== "";
  return false;
});

const isFormValid = computed(() =>
  (request.value.serviceTypes?.length ?? 0) > 0 &&
  !!request.value.location?.trim() &&
  hasValidDate.value &&
  hasValidCarType.value &&
  !!request.value.carPlate?.trim() &&
  !!request.value.vinNumber?.trim()
);

const missingFields = computed(() => {
  const m: string[] = [];
  if (!request.value.serviceTypes?.length) m.push("at least one service");
  if (!request.value.location?.trim()) m.push("location");
  if (!hasValidDate.value) m.push("preferred date");
  if (!hasValidCarType.value) m.push("car brand");
  if (!request.value.carPlate?.trim()) m.push("car plate");
  if (!request.value.vinNumber?.trim()) m.push("VIN number");
  return m;
});
// Prefer full userProfile (username, phoneNumber); fallback to profile (may only have username after login)
const loggedInUser = computed(() => {
  const profile = getSafeJson("userProfile", {}) || getSafeJson("profile", {});
  return profile;
});
const username = computed(() => loggedInUser.value?.username ?? getSafeJson("profile", {})?.username ?? "");

const fetchCurrentLocation = async () => {
  locationError.value = "";
  const result = await getCurrentLocationWithName();
  if (!result.success) {
    locationError.value = result.message || "Failed to get location. Enter address below for someone else.";
    messageType.value = "error";
    request.value.forSelf = false;
    return;
  }
  location.value = { latitude: result.latitude, longitude: result.longitude };
  request.value.location = ensureLocationName(result.locationName) || "Current location";
};

watch(() => request.value.forSelf, async val => {
  if (val) {
    message.value = "";
    locationError.value = "";
    await fetchCurrentLocation();
    manualLocationCoordsSet.value = false;
  } else {
    request.value.location = "";
    manualLocationCoordsSet.value = false;
    locationError.value = "";
    jobOptions.value = [];
    mechanicServicePrices.value = {};
  }
});

async function loadNearbyServices() {
  if (location.value.latitude === 0 && location.value.longitude === 0) return;
  catalogLoading.value = true;
  try {
    const res = await apiService.getNearbyServiceOfferings("mechanic", location.value.latitude, location.value.longitude, 50);
    // Nearby API returns the array directly (no .data wrapper)
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    const names = [...new Set(list.map((o: any) => o.serviceName ?? o.service_name).filter(Boolean))].sort();
    jobOptions.value = names;
    const priceMap: Record<string, number> = {};
    list.forEach(o => {
      const n = o.serviceName ?? o.service_name;
      if (!n) return;
      const p = Number(o.price);
      if (!isNaN(p) && (priceMap[n] == null || p < priceMap[n])) priceMap[n] = p;
    });
    mechanicServicePrices.value = priceMap;
  } catch (_) {
    jobOptions.value = [];
    mechanicServicePrices.value = {};
  } finally {
    catalogLoading.value = false;
  }
}

// When location text changes (for "Someone Else"): geocode then load services
watch(() => request.value.location, async loc => {
  if (!loc) {
    locationError.value = "";
    jobOptions.value = [];
    mechanicServicePrices.value = {};
    catalogLoading.value = false;
    manualLocationCoordsSet.value = false;
    return;
  }
  if (request.value.forSelf) {
    // Coords already set by fetchCurrentLocation
    loadNearbyServices();
    return;
  }
  locationError.value = ""; // clear previous error while we geocode
  // Manual address: geocode first to get coords (needed for nearby services)
  const coords = await geocodeAddressToCoords(loc);
  if (!coords) {
    locationError.value = "We couldn't find coordinates for this address. Please try a more specific address or use 'For Myself' to use your current location.";
    jobOptions.value = [];
    mechanicServicePrices.value = {};
    manualLocationCoordsSet.value = false;
    catalogLoading.value = false;
    return;
  }
  locationError.value = "";
  location.value = { latitude: coords.latitude, longitude: coords.longitude };
  manualLocationCoordsSet.value = true;
  await loadNearbyServices();
});

onMounted(() => { fetchCurrentLocation(); });

const submitRequest = async () => {
  if (loading.value) return;
  const { valid } = await form.value.validate?.() || { valid: true };
  if (!valid) { message.value = "Please fill in all required fields"; messageType.value = "error"; return; }
  loading.value = true; message.value = "";
  try {
    const description = request.value.serviceTypes.join(", ");
    await apiService.createRequestMechanic({
      username: loggedInUser.value?.username ?? "",
      phoneNumber: loggedInUser.value?.phoneNumber ?? loggedInUser.value?.phone ?? "",
      description,
      location: ensureLocationName(request.value.location),
      callOutService: request.value.callOutService,
      date: toLocalDateString(request.value.date),
       status: JOB_STATUS.PENDING,
       servicePrice: computedPrice.value,       
      carType: request.value.carType,
      carPlate: request.value.carPlate,
      vinNumber: request.value.vinNumber,
      
    
    });
    setTimeout(() => router.push({ name: "RequestHistory" }), 1000);
  } catch (err: any) { }
  finally { loading.value = false; }
};
</script>