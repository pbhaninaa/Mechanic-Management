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
      <InputField
        v-model="form.phoneNumber"
        label="Phone Number"
        type="tel"
        required
        :disabled="loading"
        max-width="10"
      />
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
        :disabled="loading || !form.firstName || !form.lastName || !form.username || !form.email || !form.phoneNumber || form.phoneNumber.length !== 10"
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
  phoneNumber: "",
  address: "",
  roles: [] // always an array
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
  // Validate phone number length
  if (form.value.phoneNumber.length !== 10) {
    message.value = "Phone number must be exactly 10 digits.";
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
    // Ensure roles is always an array
    if (form.value.roles && !Array.isArray(form.value.roles)) {
      form.value.roles = [form.value.roles];
    }

    if (isEditMode.value) {
      const res = await apiService.updateUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      // Keep role in sync for role-driven navbar
      const nextRole = res.data?.roles?.[0]?.toLowerCase?.() || "";
      if (nextRole) localStorage.setItem("role", nextRole);
      // Notify app/navbar to refresh immediately
      window.dispatchEvent(new Event("profileUpdated"));
      message.value = "Profile updated successfully!";
    } else {
      const res = await apiService.createUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      const nextRole = res.data?.roles?.[0]?.toLowerCase?.() || "";
      if (nextRole) localStorage.setItem("role", nextRole);
      window.dispatchEvent(new Event("profileUpdated"));
      message.value = "Profile saved successfully!";
    }

    messageType.value = "success";

    // Redirect after 1 second
    setTimeout(() => {
      router.push({ name: "Dashboard" });
    }, 1000);
  } catch (err) {
    console.error("Error saving profile:", err);
    message.value = err.response?.data?.message || err.message || "Failed to save profile";
    messageType.value = "error";
  } finally {
    loading.value = false;
    windows.reload();
    
  }
};
</script>
