<template>
  <PageContainer>
  
    <v-card>
      <v-card-title>Car Wash Booking</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="formValid" lazy-validation>
          <v-radio-group v-model="useCurrentLocation" row>
            <v-radio label="For Myself" :value="true" />
            <v-radio label="For Someone Else" :value="false" />
          </v-radio-group>
          <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">{{ locationError }}</v-alert>

          <InputField v-model="newBooking.location" label="Location" type="text"
            :disabled="loading || useCurrentLocation" :readonly="useCurrentLocation" required />

          <DropdownField v-model="newBooking.carType" :items="carTypes" label="Car Type" required />
          <InputField :model-value="newBooking.carPlate"
            @update:model-value="newBooking.carPlate = (($event) ?? '').toString().toUpperCase()"
            label="Car Plate Number" type="text" :disabled="loading" required />


          <InputField v-model="newBooking.carDescription" label="Car Description (Make/Model/Year/Color)" type="text"
            :disabled="loading" required />

          <v-alert v-if="!catalogLoading && serviceTypes.length === 0" type="info" density="compact" class="mb-2">
            No car wash services in the catalog yet. Providers can add services under "My Services".
          </v-alert>
          <DropdownField v-model="newBooking.serviceTypes" :items="serviceTypes" label="Select Services" multiple chips
            required :disabled="catalogLoading" />

          <InputField v-model="formattedPrice" label="Total Price" type="text" :disabled="true" />
          <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="290px">
            <template #activator="{ props }">
              <v-text-field v-model="newBooking.date" label="Preferred Date" readonly v-bind="props" outlined
                :disabled="loading" required />
            </template>
            <v-date-picker v-model="newBooking.date" :min="today" color="primary" @update:model-value="menu = false" />
          </v-menu>
          <Button :label="isEditMode ? 'Update' : 'Book Now'" :color="STATUS_COLORS.REJECTED" @click="submitBooking" :loading="loading"
            :disabled="loading || !isFormComplete" />
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
const today = new Date().toISOString().split('T')[0];
const useCurrentLocation = ref(true);

const carTypes = [
  "Sedan", "SUV", "Hatchback", "Bakkie", "Van", "Truck", "Luxury",
  "Coupe", "Convertible", "Crossover", "Minivan", "Pickup", "Station Wagon",
  "Electric", "Hybrid", "Sports Car", "Microcar", "Off-Road", "Compact"
];

// Services and prices from DB catalog (loaded on mount)
const serviceTypes = ref<string[]>([]);
const catalogPriceMap = ref<Record<string, number>>({});
const catalogLoading = ref(true);

const newBooking = ref<Booking>({
  clientUsername: loggedInUser.username || "",
  carPlate: "",
  carType: carTypes[0],
  carDescription: "",
  serviceTypes: [] as string[],
  servicePrice: "0",
  date: "",
  location: "",
  status: "pending",
});

// Computed price from DB catalog
const computedPrice = computed(() => {
  const selected = newBooking.value.serviceTypes || [];
  const prices = catalogPriceMap.value;
  if (selected.length === 0) return 0;
  return selected.reduce((total, service) => total + (prices[service] ?? 0), 0);
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

// Load car wash services catalog from DB (for clients)
async function loadCarwashCatalog() {
  catalogLoading.value = true;
  try {
    const res = await apiService.getServiceCatalog("carwash");
    const list = res?.data ?? [];
    const names = [...new Set(list.map((o: any) => o.serviceName).filter(Boolean))].sort();
    serviceTypes.value = names;
    const priceMap: Record<string, number> = {};
    list.forEach((o: any) => {
      const name = o.serviceName;
      if (!name) return;
      const p = Number(o.price);
      if (!Number.isNaN(p) && (priceMap[name] == null || p < priceMap[name])) priceMap[name] = p;
    });
    catalogPriceMap.value = priceMap;
    if (names.length && newBooking.value.serviceTypes.length === 0) {
      newBooking.value.serviceTypes = [names[0]];
    }
  } catch (_) {
    serviceTypes.value = [];
    catalogPriceMap.value = {};
  } finally {
    catalogLoading.value = false;
  }
}

onMounted(() => {
  loadCarwashCatalog();
});

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
  if (!isFormComplete.value || loading.value) return; // prevent double submit
  bookingError.value = "";
  loading.value = true;
  try {
    const payload = {
      ...newBooking.value,
      servicePrice: Number(newBooking.value.servicePrice) || computedPrice.value,
    };
    await apiService.createCarWashBooking(payload);
    router.push({ name: "MyWashes" });
  } catch (error) {
    const msg = error?.message || "Booking failed. Please try again.";
    bookingError.value = msg;
  } finally {
    loading.value = false;
  }
};


</script>
