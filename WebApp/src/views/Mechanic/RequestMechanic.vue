<template>
  <PageContainer>
    <v-card-title>Request Mechanic</v-card-title>
    <v-card-text>
      <v-form ref="form" @submit.prevent="submitRequest">

        <!-- Toggle for self or someone else -->
        <v-radio-group v-model="request.forSelf" row>
          <v-radio label="For Myself" :value="true" />
          <v-radio label="For Someone Else" :value="false" />
        </v-radio-group>
        <!-- Location -->
        <InputField v-model="request.location" label="Location"
          placeholder="Please be as specific as possible ie. 123 Main St, City" :extra-rules="[rules.required]"
          :disabled="loading || request.forSelf" :readonly="request.forSelf" required />

        <!-- Service Description - multi-select (like Carwash: wipers, brake pads, engine, etc.) -->
        <DropdownField v-model="request.serviceTypes" :items="jobOptions" label="Select Services"
          placeholder="Select one or more services" multiple chips required :disabled="loading"
          variant="outlined" :prepopulate-first="false" />

        <!-- Custom explanation if "Other" is selected -->
        <InputField v-if="request.serviceTypes?.includes('Other')" v-model="request.customDescription"
          label="Please specify (for Other)" :disabled="loading" outlined />

        <!-- Total Price (pre-defined, like Carwash) -->
        <InputField :model-value="formattedPrice" label="Total Price" type="text" disabled />

        <!-- Preferred Date -->
        <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y variant="outlined"
          min-width="290px">
          <template #activator="{ props }">
            <v-text-field v-model="request.date" label="Preferred Date" readonly v-bind="props" outlined
              :rules="[rules.required]" :disabled="loading" required />
          </template>

          <v-date-picker v-model="request.date" :min="today" color="primary"  @update:model-value="menu = false" />
        </v-menu>

        <!-- Submit Button -->
        <Button label="Request Mechanic" :color="STATUS_COLORS.REJECTED" block :loading="loading"
          :disabled="!isFormValid" @click="submitRequest" />

        <v-alert v-if="message" :type="messageType" class="mt-3" closable @click:close="message = ''">
          {{ message }}
        </v-alert>
      </v-form>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import { STATUS_COLORS } from "@/utils/constants";
import { useRoute, useRouter } from "vue-router";
import { JOB_STATUS } from "@/utils/constants";
import { getCurrentLocationWithName } from "@/utils/helper";
import DropdownField from "@/components/DropdownField.vue";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";

// Router
const router = useRouter();
const route = useRoute();
// Mechanic service options with mock prices (multi-select like Carwash)
const jobOptions = [
  "Fix car engine",
  "Replace brake pads",
  "Replace wipers",
  "Change oil",
  "Battery replacement",
  "Tire replacement",
  "AC repair",
  "Suspension repair",
  "Other",
];

// Mock price map - R per service
const mechanicServicePrices: Record<string, number> = {
  "Fix car engine": 850,
  "Replace brake pads": 650,
  "Replace wipers": 180,
  "Change oil": 350,
  "Battery replacement": 550,
  "Tire replacement": 480,
  "AC repair": 720,
  "Suspension repair": 890,
  "Other": 500,
};

const request = ref({
  forSelf: true,
  serviceTypes: [] as string[],
  customDescription: "",
  location: "",
  latitude: null,
  longitude: null,
  date: "",
  servicePrice: 0,
});

// Refs & messages
const form = ref(null);
const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

// Date picker
const menu = ref(false);
// MUST be string like 2026-02-26
const today = new Date().toISOString().split('T')[0]

// Validation
const rules = {
  required: (value: string) => !!value || "This field is required",
};

// Computed price from selected services (sum like Carwash)
const computedPrice = computed(() => {
  const types = request.value.serviceTypes || [];
  if (types.length === 0) return 0;
  return types.reduce(
    (total, service) => total + (mechanicServicePrices[service] ?? mechanicServicePrices["Other"]),
    0
  );
});


const { formatCurrency } = useCurrency();
const formattedPrice = computed(() => formatCurrency(computedPrice.value));

// Keep servicePrice in sync for payload
watch(computedPrice, (v) => {
  request.value.servicePrice = v;
}, { immediate: true });

const isFormValid = computed(
  () =>
    (request.value.serviceTypes?.length ?? 0) > 0 &&
    (!request.value.serviceTypes?.includes("Other") || !!request.value.customDescription?.trim()) &&
    request.value.location &&
    request.value.date
);

// Get current user from local storage
const username = getSafeJson("profile", {})?.username || getSafeJson("userProfile", {})?.username;

const fetchCurrentLocation = async () => {
  const result = await getCurrentLocationWithName();

  if (!result.success) {
    message.value = result.message || "Failed to get your location";
    messageType.value = "error";
    request.value.forSelf = false;
    return;
  }

  request.value.latitude = result.coords.latitude;
  request.value.longitude = result.coords.longitude;
  request.value.location = result.locationName;
};


// Watch "For Myself" toggle
watch(
  () => request.value.forSelf,
  async (val) => {
    if (val) {
      await fetchCurrentLocation();
    } else {
      request.value.location = "";
      request.value.latitude = null;
      request.value.longitude = null;
    }
  }
);


const submitRequest = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    message.value = "Please fill in all required fields correctly";
    messageType.value = "error";
    return;
  }

  loading.value = true;
  message.value = "";

  try {
    // Build description: "Service A, Service B, Other: custom text"
    const services = request.value.serviceTypes || [];
    const parts = services.filter((s) => s !== "Other");
    if (request.value.serviceTypes?.includes("Other") && request.value.customDescription?.trim()) {
      parts.push(`Other: ${request.value.customDescription.trim()}`);
    }
    const description = parts.length > 0 ? parts.join(", ") : request.value.customDescription || "Other";

    const payload = {
      username,
      description,
      location: request.value.location,
      latitude: request.value.latitude,
      longitude: request.value.longitude,
      date: request.value.date,
      status: JOB_STATUS.PENDING,
      servicePrice: computedPrice.value,
    };

    await apiService.createRequestMechanic(payload);
    // Success toast shown by global axios interceptor
    setTimeout(() => {
      router.push({ name: "RequestHistory" });
    }, 1000);
    request.value = {
      forSelf: true,
      serviceTypes: [],
      customDescription: "",
      location: "",
      latitude: null,
      longitude: null,
      date: "",
    };
    form.value.resetValidation();
    fetchCurrentLocation;
  } catch (err: any) {
    // Error toast shown by global axios interceptor
  } finally {
    loading.value = false;
  }
};
fetchCurrentLocation();
// On mount
onMounted(() => {
  if (request.value.forSelf) fetchCurrentLocation();
});
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
