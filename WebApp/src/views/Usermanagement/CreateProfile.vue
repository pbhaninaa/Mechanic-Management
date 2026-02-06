<template>
  <PageContainer>
    <v-card-title>{{ isEditMode ? "Edit Profile" : "Create Profile" }}</v-card-title>
    <v-card-text>
      <!-- Input fields -->
      <InputField
        v-model="form.firstName"
        label="First Name"
        type="text"
        :disabled="loading"
        required
      />
      <InputField
        v-model="form.lastName"
        label="Last Name"
        type="text"
        :disabled="loading"
        required
      />
      <InputField
        v-model="form.username"
        label="Username"
        type="text"
        :disabled="true"
        required
      />
      <InputField
        v-model="form.email"
        label="Email"
        type="email"
        :disabled="loading || isEditMode"
        required
      />
      <!-- Country code + phone number -->
      <v-row>
        <!-- <v-col cols="4">
          <v-select
            v-model="form.countryCode"
            :items="countryOptions"
            item-title="label"
            item-value="code"
            label="Country Code"
            :disabled="loading"
            required
          />
        </v-col> -->
        <v-col >
          <InputField
            v-model="form.phoneNumber"
            label="Phone Number"
            type="tel"
            required
            :disabled="loading"
          />
        </v-col>
      </v-row>
      <InputField
        v-model="form.address"
        label="Address"
        type="text"
        :disabled="loading || form.roles[0] === USER_ROLES.ADMIN"
      />

      <!-- Roles select -->
      <v-select
        v-model="form.roles"
        :items="roles"
        label="Role"
        chips
        :multiple="false"
        :disabled="loading || !canEditRole"
        required
      />

      <!-- Save / Update button -->
      <Button
        :label="isEditMode ? 'Update' : 'Save'"
        color="primary"
        @click="saveProfile"
        :loading="loading"
        :disabled="
          loading ||
          !form.firstName ||
          !form.lastName ||
          !form.username ||
          !form.email ||
          !form.phoneNumber ||
          !form.countryCode ||
          !isPhoneValid
        "
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
    </v-card-text>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import PageContainer from "@/components/PageContainer.vue";
import { USER_ROLES } from "@/utils/constants";

// Router
const router = useRouter();
const route = useRoute();

// Get profile from query (if editing)
const propsProfile = ref(
  route.query.profile
    ? JSON.parse(route.query.profile)
    : JSON.parse(localStorage.getItem("profile") || "{}")
);

// Roles array
const roles = [USER_ROLES.CLIENT, USER_ROLES.MECHANIC, USER_ROLES.CAR_WASH, USER_ROLES.ADMIN];

// Edit mode if profile exists
const isEditMode = computed(() => !!propsProfile.value?.firstName || !!propsProfile.value?.lastName);

// Form state
const form = ref({
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  countryCode: localStorage.getItem("phoneCountryCode") || "+27",
  phoneNumber: "",
  address: "",
  roles: [] // always an array
});

// Supported country codes and expected local number lengths (excluding country code)
const countryOptions = [
  { label: "South Africa (+27)", code: "+27", length: 9 },
  { label: "United States (+1)", code: "+1", length: 10 },
  { label: "United Kingdom (+44)", code: "+44", length: 10 },
];

const requiredPhoneLength = computed(() => {
  const found = countryOptions.find(c => c.code === form.value.countryCode);
  return found?.length ?? 9;
});

const isPhoneValid = computed(() => {
  const digitsOnly = (form.value.phoneNumber || "").replace(/\D/g, "");
  return digitsOnly.length === requiredPhoneLength.value;
});

// Loading and feedback
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

// Current logged-in user
const currentUser = ref(JSON.parse(localStorage.getItem("userProfile") || "{}"));

// Determine if the logged-in user can edit roles
const canEditRole = computed(() => {
  // If creating profile → everyone can choose role
  if (!isEditMode.value) return true;

  // If editing → only ADMIN can edit role
  return currentUser.value.roles?.includes(USER_ROLES.ADMIN);
});


// Fill form if editing
onMounted(() => {
  if (propsProfile.value) {
    form.value = {
      ...form.value,
      ...propsProfile.value,
      roles: propsProfile.value.roles ? [...propsProfile.value.roles] : []
    };
  }
});

// Save or update profile
const saveProfile = async () => {
  // Validate phone number length based on selected country code
  const digitsOnly = (form.value.phoneNumber || "").replace(/\D/g, "");
  if (digitsOnly.length !== requiredPhoneLength.value) {
    message.value = `Phone number must be exactly ${requiredPhoneLength.value} digits for the selected country.`;
    messageType.value = "error";
    return;
  }

  // Prevent non-admins from changing roles
  if (!canEditRole.value) {
    form.value.roles = propsProfile.value.roles ? [...propsProfile.value.roles] : [];
  }

  loading.value = true;
  message.value = "";
  try {
    // Persist selected country code for use elsewhere (e.g. Help page)
    if (form.value.countryCode) {
      localStorage.setItem("phoneCountryCode", form.value.countryCode);
    }

    // Ensure roles is always an array
    if (form.value.roles && !Array.isArray(form.value.roles)) {
      form.value.roles = [form.value.roles];
    }

    if (isEditMode.value) {
      const res = await apiService.updateUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      message.value = "Profile updated successfully!";
    } else {
      const res = await apiService.createUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      message.value = "Profile saved successfully!";
    }

    messageType.value = "success";

    // Give a short delay for localStorage to settle, then reload the app.
    // This remounts the navbar so it pulls the latest profile/role.
    setTimeout(() => {
      window.location.reload();
    }, 200);
  } catch (err) {
    console.error("Error saving profile:", err);
    message.value = err.response?.data?.message || err.message || "Failed to save profile";
    messageType.value = "error";
  } finally {
    loading.value = false;
    
  }
};
</script>
