<template>
  <PageContainer>
    <v-alert v-if="bookingError" type="error" dismissible class="mb-4" @click:close="bookingError = ''">{{ bookingError }}</v-alert>
    <v-card>
      <v-card-title>Car Wash Booking</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="formValid" lazy-validation>
          <v-row>
            <v-col cols="12" md="4">
              <DropdownField v-model="newBooking.carType" :items="carTypes" label="Car Type" required />
            </v-col>
            <v-col cols="12" md="4">
              <InputField v-model="newBooking.carDescription" label="Car Description (Make/Model/Year/Color)"
                type="text" :disabled="loading" required />
            </v-col>
            <v-col cols="12" md="4">
              <InputField v-model="newBooking.carPlate" label="Car Plate Number" type="text" :disabled="loading"
                required />
            </v-col>
          </v-row>

          <DropdownField v-model="newBooking.serviceTypes" :items="serviceTypes" label="Select Services" multiple chips
            required />
          <v-radio-group v-model="useCurrentLocation" row>
            <v-radio label="Use My Current Location" :value="true" />
            <v-radio label="Enter Location Manually" :value="false" />
          </v-radio-group>
          <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">{{ locationError }}</v-alert>
          <InputField v-model="newBooking.location" label="Location" type="text"
            :disabled="loading || useCurrentLocation" :readonly="useCurrentLocation" required />
          <InputField v-model="formattedPrice" label="Total Price" type="text" :disabled="true" />
          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="newBooking.date" label="Preferred Date" readonly v-bind="props" outlined
                :disabled="loading" required />
            </template>
            <v-date-picker v-model="newBooking.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>
          <Button :label="isEditMode ? 'Update' : 'Book Now'" color="primary" @click="submitBooking" :loading="loading"
            :disabled="loading || !isFormComplete" />
        </v-form>
      </v-card-text>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import PageContainer from "@/components/PageContainer.vue";
import InputField from "@/components/InputField.vue";
import DropdownField from "@/components/DropdownField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import { getCurrentLocationWithName } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";

const loggedInUser = getSafeJson("userProfile", {});

interface Booking {
  clientUsername: string;
  carPlate: string;
  carType: string;
  carDescription: string;
  serviceTypes: string[];
  servicePrice: string;
  date: string;
  location: string;
  status: string;
}

const router = useRouter();
const loading = ref(false);
const formValid = ref(false);
const isEditMode = ref(false);
const menu = ref(false);
// MUST be string like 2026-02-26
const today = new Date().toISOString().split('T')[0]
const useCurrentLocation = ref(true);

const carTypes = [
  "Sedan", "SUV", "Hatchback", "Bakkie", "Van", "Truck", "Luxury",
  "Coupe", "Convertible", "Crossover", "Minivan", "Pickup", "Station Wagon",
  "Electric", "Hybrid", "Sports Car", "Microcar", "Off-Road", "Compact"
];

const serviceTypes = [
  "Full Wash", "Exterior Wash", "Interior Cleaning", "Engine Wash", "Undercarriage Wash",
  "Valet Service", "Waxing", "Polish", "Detailing", "Leather Treatment", "Glass Treatment",
  "Headlight Restoration"
];

const newBooking = ref<Booking>({
  clientUsername: loggedInUser.username || "",
  carPlate: "",
  carType: carTypes[0],
  carDescription: "",
  serviceTypes: [serviceTypes[0]],
  servicePrice: "0",
  date: "",
  location: "",
  status: "pending",
});

// Price Map
const basePrice = {
  "Full Wash": 120, "Exterior Wash": 50, "Interior Cleaning": 80, "Engine Wash": 100,
  "Undercarriage Wash": 90, "Valet Service": 220, "Waxing": 180, "Polish": 150,
  "Detailing": 300, "Leather Treatment": 120, "Glass Treatment": 80, "Headlight Restoration": 100
};

const priceMap: Record<string, Record<string, number>> = {};
carTypes.forEach(type => {
  priceMap[type] = { ...basePrice };
});

// Computed price
const computedPrice = computed(() => {
  const carType = newBooking.value.carType;
  if (!carType || newBooking.value.serviceTypes.length === 0) return 0;
  return newBooking.value.serviceTypes.reduce(
    (total, service) => total + (priceMap[carType]?.[service] || 0),
    0
  );
});

// Update servicePrice whenever computedPrice changes
watch(computedPrice, (newPrice) => {
  newBooking.value.servicePrice = newPrice.toFixed(2);
});

const { formatCurrency } = useCurrency();
const formattedPrice = computed(() => formatCurrency(computedPrice.value));

const locationError = ref("");
const fetchCurrentLocation = async () => {
  locationError.value = "";
  const result = await getCurrentLocationWithName();

  if (!result.success) {
    locationError.value = result.message || "Failed to get location. Enter address manually.";
    useCurrentLocation.value = false;
    return;
  }

  newBooking.value.location = result.locationName;
};
watch(useCurrentLocation, async (val) => {
  if (val) {
    await fetchCurrentLocation();
  } else {
    newBooking.value.location = "";
  }
});
fetchCurrentLocation();

// Form validation
const isFormComplete = computed(() =>
  !!newBooking.value.carPlate &&
  !!newBooking.value.carType &&
  !!newBooking.value.carDescription &&
  newBooking.value.serviceTypes.length > 0 &&
  !!newBooking.value.date &&
  !!newBooking.value.location
);

const bookingError = ref("");
const submitBooking = async () => {
  if (!isFormComplete.value || loading.value) return;
  bookingError.value = "";
  loading.value = true;
  try {
    await apiService.createCarWashBooking(newBooking.value);
    router.push({ name: "MyWashes" });
  } catch (error) {
    const msg = error?.message || "Booking failed. Please try again.";
    bookingError.value = msg;
  } finally {
    loading.value = false;
  }
};


</script>
