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

        <!-- Service Description Dropdown -->
        <DropdownField v-model="request.description" :items="jobOptions" label="Service Description"
          placeholder="Select Service Description" :rules="[rules.required]" :disabled="loading" variant="outlined" />


        <!-- Custom explanation if "Other" is selected -->
        <InputField v-if="request.description === 'Other'" v-model="request.customDescription" label="Please specify"
          :rules="[rules.required]" :disabled="loading" outlined />

        <!-- Preferred Date -->
        <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y variant="outlined"
          min-width="290px">
          <template #activator="{ props }">
            <v-text-field v-model="request.date" label="Preferred Date" readonly v-bind="props" outlined
              :rules="[rules.required]" :disabled="loading" required />
          </template>
          <v-date-picker v-model="request.date" :min="today" color="primary" @update:model-value="menu = false" />
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

// Router
const router = useRouter();
const route = useRoute();
// Form state
const jobOptions = [
  "Fix car engine",
  "Replace brake pads",
  "Change oil",
  "Battery replacement",
  "Tire replacement",
  "AC repair",
  "Suspension repair",
  "Other",
];

const request = ref({
  forSelf: true,
  description: jobOptions[0],
  customDescription: "",
  location: "",
  latitude: null,
  longitude: null,
  date: "",
});

// Refs & messages
const form = ref(null);
const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

// Date picker
const menu = ref(false);
const today = new Date().toISOString().split("T")[0];

// Validation
const rules = {
  required: (value: string) => !!value || "This field is required",
};

const isFormValid = computed(
  () =>
    (request.value.description || request.value.customDescription) &&
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
    const payload = {
      username,
      description:
        request.value.description === "Other"
          ? request.value.customDescription
          : request.value.description,
      location: request.value.location,
      latitude: request.value.latitude,
      longitude: request.value.longitude,
      date: request.value.date,
      status: JOB_STATUS.PENDING,
    };

    await apiService.createRequestMechanic(payload);
    // Success toast shown by global axios interceptor
    setTimeout(() => {
      router.push({ name: "RequestHistory" });
    }, 1000);
    request.value = {
      forSelf: true,
      description: "",
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
