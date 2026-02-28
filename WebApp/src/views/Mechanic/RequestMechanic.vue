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

          <InputField
            v-model="request.location"
            label="Location"
            placeholder="Enter your address"
            :disabled="loading || request.forSelf"
            :readonly="request.forSelf"
            required
          />

          <template v-if="canShowServices">
            <DropdownField v-if="jobOptions.length > 0"
              v-model="request.serviceTypes"
              :items="jobOptions"
              label="Select Services"
              multiple
              chips
              required
              :disabled="loading || catalogLoading"
            />
            <v-alert v-else-if="!catalogLoading && jobOptions.length === 0" type="info" class="mb-2">
              No mechanic services in the catalog yet. Providers can add services under "My Services".
            </v-alert>
            <InputField
              v-if="request.serviceTypes?.includes('Other')"
              v-model="request.customDescription"
              label="Please specify (for Other)"
              :disabled="loading"
              outlined
            />
          </template>
          <v-alert v-else type="info" density="compact" class="mb-2">
            Provide your location above to see available services. If you enter an address we'll look up its coordinates to find nearby services.
          </v-alert>

          <InputField :model-value="formattedPrice" label="Total Price" type="text" disabled />

          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="request.date" label="Preferred Date" readonly v-bind="props" outlined :disabled="loading" required />
            </template>
            <v-date-picker v-model="request.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>

          <Button label="Request Mechanic" :color="STATUS_COLORS.REJECTED" :loading="loading" :disabled="!isFormValid || loading" @click="submitRequest" />

          <v-alert v-if="message" :type="messageType" class="mt-3" closable @click:close="message=''">
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
import { getCurrentLocationWithName, geocodeAddressToCoords } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";

const router = useRouter();
const today = new Date().toISOString().split('T')[0];
const loading = ref(false);
const menu = ref(false);
const request = ref({
  forSelf: true,
  serviceTypes: [] as string[],
  customDescription: "",
  location: "",
  carPlate: "",
  vinNumber: "",
  carType: "",
  date: "",
  servicePrice: 0,
});
const jobOptions = ref<string[]>([]);
const mechanicServicePrices = ref<Record<string, number>>({});
const catalogLoading = ref(true);
const location = ref({ latitude: 0, longitude: 0 });
const manualLocationCoordsSet = ref(false); // true when user typed address and we geocoded it
const message = ref("");
const messageType = ref<"success"|"error">("success");
const form = ref(null);

const canShowServices = computed(() =>
  (request.value.forSelf && request.value.location) ||
  (!request.value.forSelf && manualLocationCoordsSet.value)
);

const { formatCurrency } = useCurrency();
const computedPrice = computed(() => request.value.serviceTypes.reduce((total, s) => total + (mechanicServicePrices.value[s] || mechanicServicePrices.value["Other"] || 0), 0));
const formattedPrice = computed(() => formatCurrency(computedPrice.value));
watch(computedPrice, (v) => request.value.servicePrice = v, { immediate: true });

const isFormValid = computed(() =>
  request.value.serviceTypes.length > 0 &&
  (!request.value.serviceTypes.includes("Other") || !!request.value.customDescription?.trim()) &&
  !!request.value.location &&
  !!request.value.date
);

const username = getSafeJson("profile", {})?.username || getSafeJson("userProfile", {})?.username;

const fetchCurrentLocation = async () => {
  const result = await getCurrentLocationWithName();
  if (!result.success) { message.value = result.message || "Failed to get location"; messageType.value = "error"; request.value.forSelf = false; return; }
  location.value = { latitude: result.latitude, longitude: result.longitude };
  request.value.location = result.locationName;
};

watch(() => request.value.forSelf, async val => {
  if (val) {
    await fetchCurrentLocation();
    manualLocationCoordsSet.value = false;
  } else {
    request.value.location = "";
    manualLocationCoordsSet.value = false;
    jobOptions.value = [];
    mechanicServicePrices.value = {};
  }
});

async function loadNearbyServices() {
  if (location.value.latitude === 0 && location.value.longitude === 0) return;
  catalogLoading.value = true;
  try {
    const res = await apiService.getNearbyServiceOfferings("mechanic", location.value.latitude, location.value.longitude, 50);
    const list = res?.data ?? [];
    const names = [...new Set(list.map((o: any) => o.serviceName).filter(Boolean))].sort();
    jobOptions.value = names.length ? names : ["Other"];
    if (!names.includes("Other")) jobOptions.value.push("Other");
    const priceMap: Record<string, number> = {};
    list.forEach(o => {
      const n = o.serviceName;
      if (!n) return;
      const p = Number(o.price);
      if (!isNaN(p) && (priceMap[n] == null || p < priceMap[n])) priceMap[n] = p;
    });
    if (priceMap["Other"] == null) priceMap["Other"] = 0;
    mechanicServicePrices.value = priceMap;
  } catch (_) {
    jobOptions.value = ["Other"];
    mechanicServicePrices.value = { Other: 0 };
  } finally {
    catalogLoading.value = false;
  }
}

// When location text changes (for "Someone Else"): geocode then load services
watch(() => request.value.location, async loc => {
  if (!loc) {
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
  // Manual address: geocode first
  const coords = await geocodeAddressToCoords(loc);
  if (!coords) {
    message.value = "We couldn't find coordinates for this address. Please try a more specific address or use 'For Myself' to use your current location.";
    messageType.value = "error";
    jobOptions.value = [];
    mechanicServicePrices.value = {};
    manualLocationCoordsSet.value = false;
    catalogLoading.value = false;
    return;
  }
  message.value = "";
  location.value = { latitude: coords.latitude, longitude: coords.longitude };
  manualLocationCoordsSet.value = true;
  await loadNearbyServices();
});

onMounted(() => { fetchCurrentLocation(); });

const submitRequest = async () => {
  if (loading.value) return;
  const { valid } = await form.value.validate?.() || { valid: true };
  if (!valid) { message.value = "Please fill in all required fields"; messageType.value = "error"; return; }
  loading.value = true; message.value="";
  try {
    const services = request.value.serviceTypes.filter(s=>s!=="Other");
    if(request.value.serviceTypes.includes("Other") && request.value.customDescription?.trim()) services.push(`Other: ${request.value.customDescription.trim()}`);
    const description = services.length>0?services.join(", "):request.value.customDescription||"Other";
    await apiService.createRequestMechanic({
      username,
      description,
      location: request.value.location,
      carType: request.value.carType,
      carPlate: request.value.carPlate,
      vinNumber: request.value.vinNumber,
      date: request.value.date,
      status: JOB_STATUS.PENDING,
      servicePrice: computedPrice.value,
    });
    setTimeout(()=>router.push({name:"RequestHistory"}),1000);
  } catch(err:any) {}
  finally{ loading.value=false; }
};
</script>