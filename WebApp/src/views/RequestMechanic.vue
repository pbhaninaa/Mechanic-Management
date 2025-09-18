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

        <!-- Service Description Dropdown -->
        <v-select
          v-model="request.description"
          :items="jobOptions"
          label="Service Description"
          :rules="[rules.required]"
          :disabled="loading"
          outlined
        />

        <!-- Custom explanation if "Other" is selected -->
        <v-text-field
          v-if="request.description === 'Other'"
          v-model="request.customDescription"
          label="Please specify"
          :rules="[rules.required]"
          :disabled="loading"
          outlined
        />

        <!-- Location -->
        <InputField
          v-model="request.location"
          label="Location"
          placeholder="Please be as specific as possible ie. 123 Main St, City"
          :extra-rules="[rules.required]"
          :disabled="loading || request.forSelf"
          :readonly="request.forSelf"
          required
        />

        <!-- Preferred Date -->
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="290px"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="request.date"
              label="Preferred Date"
              readonly
              v-bind="props"
              outlined
              :rules="[rules.required]"
              :disabled="loading"
              required
            />
          </template>
          <v-date-picker
            v-model="request.date"
            :min="today"
            color="primary"
            @update:model-value="menu = false" 
          />
        </v-menu>

        <!-- Submit Button -->
        <Button
          label="Request Mechanic"
          :color="STATUS_COLORS.REJECTED"
          block
          :loading="loading"
          :disabled="!isFormValid"
          @click="submitRequest"
        />

        <v-alert
          v-if="message"
          :type="messageType"
          class="mt-3"
          closable
          @click:close="message = ''"
        >
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
// Router
const router = useRouter();
const route = useRoute();
// Form state
const request = ref({
  forSelf: true,
  description: "",
  customDescription: "",
  location: "",
  latitude: null,
  longitude: null,
  date: "",
});
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
const username = JSON.parse(localStorage.getItem("profile") || "{}").username;

// Geolocation for "For Myself"
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        request.value.latitude = pos.coords.latitude;
        request.value.longitude = pos.coords.longitude;
        await getLocationName(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.error(err);
        message.value = "Failed to get your location. Please enter manually.";
        messageType.value = "error";
        request.value.forSelf = false;
      }
    );
  }
};

// Reverse geocoding
const getLocationName = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    request.value.location = data.display_name || `${lat}, ${lng}`;
  } catch {
    request.value.location = `${lat}, ${lng}`;
  }
};

// Watch "For Myself" toggle
watch(
  () => request.value.forSelf,
  (val) => {
    if (val) getCurrentLocation();
    else request.value.location = "";
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

    const res = await apiService.createRequestMechanic(payload);
    message.value = res.message || "Mechanic request submitted successfully!";
    messageType.value = "success";
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
    getCurrentLocation();
  } catch (err: any) {
    message.value = err.message || "Failed to submit request";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

// On mount
onMounted(() => {
  if (request.value.forSelf) getCurrentLocation();
});
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
