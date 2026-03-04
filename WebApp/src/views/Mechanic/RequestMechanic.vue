<template>
  <PageContainer>
    <v-card>
      <v-card-title>Request Mechanic</v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submitRequest">

          <!-- Who is the request for -->
          <v-radio-group v-model="request.forSelf" row>
            <v-radio label="For Myself" :value="true" />
            <v-radio label="For Someone Else" :value="false" />
          </v-radio-group>

          <!-- Service type -->
          <v-btn-toggle color="primary" class="mt-3 mb-5" v-model="request.callOutService" mandatory>
            <v-btn :value="false">In-House Service</v-btn>
            <v-btn :value="true">Call Out Service</v-btn>
          </v-btn-toggle> 

          <!-- Towing option -->
          <v-checkbox
            color="primary"
            v-show="request.callOutService"
            v-model="request.towing"
            label="Do you need towing?"
            class="mb-2"
            :disabled="loading"
          />

          <!-- Pricing info -->
          <v-alert v-if="request.callOutService" type="info" class="mb-2">
            A call-out service includes an additional fee of R{{ additionalFees.callOut ?? 300 }}.
            If towing is required, a flat fee of R{{ additionalFees.towing ?? 1500 }} applies instead of the standard call-out fee. 
            The final service total is calculated based on your selected services plus the applicable call-out or towing fee. 
          </v-alert>

          <!-- Location error -->
          <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">{{ locationError }}</v-alert>

          <!-- Location input -->
          <InputField
            v-model="request.location"
            label="Location"
            placeholder="Enter your address"
            :disabled="loading || request.forSelf"
            :readonly="request.forSelf"
            required
          />

          <v-divider class="my-4" />
          <div class="text-subtitle-2 text-medium-emphasis mb-2">Vehicle details</div>

          <!-- Vehicle info -->
          <DropdownField
            v-model="request.carType"
            :items="carsList"
            label="Car brand"
            placeholder="Select car brand (e.g. Toyota, Ford)"
            :disabled="loading"
            required
          />
          <InputField v-model="request.carPlate" label="Car plate" placeholder="e.g. ABC 123 GP" :disabled="loading" required />
          <InputField v-model="request.vinNumber" label="VIN number" placeholder="Vehicle identification number" :disabled="loading" required />
          <DropdownField v-model="request.vehicleType" :items="CAR_TYPES" label="Vehicle type (optional)" placeholder="e.g. Sedan, SUV – for accurate pricing" :disabled="loading" clearable :prepopulate-first="false" />
          <v-divider class="my-4" />

          <!-- Service selection -->
          <template v-if="canShowServices">
            <DropdownField
              v-if="jobOptions.length > 0"
              v-model="request.serviceTypes"
              :items="jobOptions"
              label="Select Services"
              multiple
              chips
              required
              :disabled="loading || catalogLoading"
            />
            <v-alert v-else-if="!catalogLoading && jobOptions.length === 0" type="info" class="mb-2">
              No mechanic services are available near this location yet. Try a different address or check back later.
            </v-alert>
          </template>
          <v-alert v-else type="info" density="compact" class="mb-2">
            Provide your location above to see available services. If you enter an address we'll look up its coordinates to find nearby services.
          </v-alert>

          <!-- Total Price -->
          <InputField :model-value="formattedPrice" label="Total Price" type="text" disabled />

          <!-- Date picker -->
          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="request.date" label="Preferred Date" readonly v-bind="props" outlined :disabled="loading" required />
            </template>
            <v-date-picker v-model="request.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>

          <!-- Missing fields alert -->
          <v-alert v-if="!loading && missingFields.length > 0" type="info" density="compact" class="mb-3">
            {{ missingFields.length === 1
              ? `Please complete the following field: ${missingFields[0]}.`
              : `Please complete the following fields: ${missingFields.join(", ")}.` }}
          </v-alert>

          <!-- Submit button -->
          <Button
            label="Request Mechanic"
            :color="STATUS_COLORS.REJECTED"
            :loading="loading"
            :disabled="!isFormValid || loading"
            @click="submitRequest"
          />

          <!-- Message alert -->
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
import { STATUS_COLORS, JOB_STATUS, CAR_TYPES } from "@/utils/constants";
import { useRouter } from "vue-router";
import { getCurrentLocationWithName, geocodeAddressToCoords, ensureLocationName, carsList } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import { toLocalDateString } from "@/composables/useDateFormat";

const router = useRouter();
const today = new Date().toISOString().split("T")[0];
const loading = ref(false);
const menu = ref(false);


const request = ref({
  forSelf: true,
  serviceTypes: [] as string[],
  location: "",
  carPlate: "",
  vinNumber: "",
  callOutService: false,
  towing: false,
  carType: "",
  vehicleType: "" as string, // Sedan, SUV, etc. – used to filter offerings by provider-supported car types
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

const { formatCurrency } = useCurrency();

// Additional fees from API (fallback if fetch fails)
const additionalFees = ref<Record<string, number>>({ callOut: 300, towing: 1500 });

// Show services only if location is set
const canShowServices = computed(() =>
  (request.value.forSelf && request.value.location) ||
  (!request.value.forSelf && manualLocationCoordsSet.value)
);

// --- Price calculation ---
const computedPrice = computed(() => {
  const serviceTotal = request.value.serviceTypes.reduce(
    (total, s) => total + (mechanicServicePrices.value[s] ?? 0),
    0
  );

  let additionalFee = 0;
  if (request.value.callOutService) {
    additionalFee = request.value.towing
      ? (additionalFees.value.towing ?? 1500)
      : (additionalFees.value.callOut ?? 300);
  }

  return serviceTotal + additionalFee;
});

const formattedPrice = computed(() => formatCurrency(computedPrice.value));

watch(computedPrice, v => request.value.servicePrice = v, { immediate: true });

// Reset towing if call-out is turned off
watch(() => request.value.callOutService, val => {
  if (!val) request.value.towing = false;
});

// --- Validation ---
const hasValidDate = computed(() => {
  const d = request.value.date;
  if (!d) return false;
  if (typeof d === "string") return d.trim() !== "";
  if (d instanceof Date) return !isNaN(d.getTime());
  return true;
});

const hasValidCarType = computed(() => {
  const ct = request.value.carType;
  if (Array.isArray(ct)) return ct.length > 0;
  return !!ct?.trim();
});

const isFormValid = computed(() =>
  request.value.serviceTypes.length > 0 &&
  !!request.value.location?.trim() &&
  hasValidDate.value &&
  hasValidCarType.value &&
  !!request.value.carPlate?.trim() &&
  !!request.value.vinNumber?.trim()
);

// --- Missing fields for alert ---
const missingFields = computed(() => {
  const m: string[] = [];
  if (!request.value.serviceTypes.length) m.push("at least one service");
  if (!request.value.location?.trim()) m.push("location");
  if (!hasValidDate.value) m.push("preferred date");
  if (!hasValidCarType.value) m.push("car brand");
  if (!request.value.carPlate?.trim()) m.push("car plate");
  if (!request.value.vinNumber?.trim()) m.push("VIN number");
  return m;
});

// --- User ---
const loggedInUser = computed(() => getSafeJson("userProfile", {}) || getSafeJson("profile", {}));

// --- Location ---
const fetchCurrentLocation = async () => {
  locationError.value = "";
  const result = await getCurrentLocationWithName();

  if (!result.success) {
    locationError.value = result.message || "Failed to get location.";
    request.value.forSelf = false;
    return;
  }

  location.value = { latitude: result.latitude, longitude: result.longitude };
  request.value.location = ensureLocationName(result.locationName) || "Current location";
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

function offeringMatchesCarType(o: any, clientVehicleType: string): boolean {
  if (!clientVehicleType?.trim()) return true;
  const supported = o.supportedCarTypes;
  if (!supported || (typeof supported === "string" && !supported.trim())) return true;
  const types = typeof supported === "string" ? supported.split(",").map((s: string) => s.trim()) : Array.isArray(supported) ? supported : [];
  if (types.length === 0) return true;
  return types.some((t: string) => t === clientVehicleType);
}

// Load nearby services; filter by vehicle type when set so price matches (e.g. bus vs sedan).
async function loadNearbyServices() {
  if (!location.value.latitude) return;
  catalogLoading.value = true;

  try {
    const res = await apiService.getNearbyServiceOfferings(
      "mechanic",
      location.value.latitude,
      location.value.longitude,
      50
    );

    const list = Array.isArray(res) ? res : (res?.data ?? []);
    const vehicleType = request.value.vehicleType || "";
    const matching = vehicleType ? list.filter((o: any) => offeringMatchesCarType(o, vehicleType)) : list;

    jobOptions.value = [...new Set(matching.map((o: any) => o.serviceName ?? o.service_name).filter(Boolean))];

    const priceMap: Record<string, number> = {};
    matching.forEach((o: any) => {
      const name = o.serviceName ?? o.service_name;
      const price = Number(o.price);
      if (!isNaN(price)) priceMap[name] = price;
    });

    mechanicServicePrices.value = priceMap;
  } catch {
    jobOptions.value = [];
    mechanicServicePrices.value = {};
  } finally {
    catalogLoading.value = false;
  }
}

watch(() => request.value.vehicleType, () => {
  if (canShowServices.value && location.value.latitude) loadNearbyServices();
});

// Watch location for manual geocoding
watch(() => request.value.location, async loc => {
  if (!loc) return;
  if (request.value.forSelf) {
    loadNearbyServices();
    return;
  }

  const coords = await geocodeAddressToCoords(loc);
  if (!coords) {
    locationError.value = "Couldn't find coordinates for this address.";
    return;
  }

  location.value = coords;
  manualLocationCoordsSet.value = true;
  await loadNearbyServices();
});

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

// --- Submit ---
const submitRequest = async () => {
  if (loading.value) return;
  loading.value = true;
  message.value = "";

  try {
    await apiService.createRequestMechanic({
      username: loggedInUser.value?.username ?? "",
      phoneNumber: loggedInUser.value?.phoneNumber ?? "",
      description: request.value.serviceTypes.join(", "),
      location: ensureLocationName(request.value.location),
      callOutService: request.value.callOutService,
      towing: request.value.towing,
      servicePrice: computedPrice.value,
      status: JOB_STATUS.PENDING,
      carType: request.value.carType,
      carPlate: request.value.carPlate,
      vinNumber: request.value.vinNumber,
      date: toLocalDateString(request.value.date),
    });

    router.push({ name: "RequestHistory" });
  } finally {
    loading.value = false;
  }
};
</script>