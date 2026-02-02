<template>
  <PageContainer>
    <v-card class="profile-card">
      <v-card-title>{{ isEditMode ? "Edit Profile" : "Create Profile" }}</v-card-title>
      <v-card-text>
        <!-- Input fields -->
        <div class="form-fields">
          <InputField 
            v-model="form.firstName" 
            label="First Name" 
            type="text" 
            :disabled="loading" 
            required 
            class="mb-3"
          />
          <InputField 
            v-model="form.lastName" 
            label="Last Name" 
            type="text" 
            :disabled="loading" 
            required 
            class="mb-3"
          />
          <InputField 
            v-model="form.username" 
            label="Username" 
            type="text" 
            :disabled="true" 
            required 
            class="mb-3"
          />
          <InputField 
            v-model="form.email" 
            label="Email" 
            type="email" 
            :disabled="loading || isEditMode" 
            required 
            class="mb-3"
          />
          <InputField 
            v-model="form.phoneNumber" 
            label="Phone Number" 
            type="tel" 
            :disabled="loading" 
            class="mb-3"
          />
          <InputField 
            v-model="form.address" 
            label="Address" 
            type="text" 
            :disabled="loading" 
            class="mb-3"
          />

          <!-- Roles select -->
          <v-select
            v-model="form.roles"
            :items="roles"
            label="Role"
            chips
            :multiple="false"          
            :disabled="loading"
            required
            class="mb-4"
          />

          <Button
            :label="isEditMode ? 'Update' : 'Save'"
            color="primary"
            @click="saveProfile"
            :loading="loading"
            :disabled="loading || !isFormValid"
            class="mb-3"
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
        </div>
      </v-card-text>
    </v-card>
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
import { useProfile } from "@/composables/useProfile";

// Router
const router = useRouter();
const route = useRoute();

// Profile composable
const { refreshProfile } = useProfile();

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

// Form validation
const isFormValid = computed(() => {
  return form.value.firstName && 
         form.value.lastName && 
         form.value.username && 
         form.value.email && 
         form.value.roles && 
         form.value.roles.length > 0;
});

// Fill form if editing
onMounted(() => {
  // Get username from localStorage (set during login)
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");
  if (profile.username) {
    form.value.username = profile.username;
  }
  
  if (propsProfile.value) {
    // Ensure roles is always an array
    form.value = { 
      ...form.value, 
      ...propsProfile.value, 
      roles: propsProfile.value.roles ? [...propsProfile.value.roles] : [] 
    };
  }
});

// Save or update profile
const saveProfile = async () => {
  loading.value = true;
  message.value = "";
  try {
    // Ensure roles is always an array, even if only one selected
    if (form.value.roles && !Array.isArray(form.value.roles)) {
      form.value.roles = [form.value.roles];
    }
    if (isEditMode.value) {
     const res= await apiService.updateUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      message.value = "Profile updated successfully!";
     
    } else {
     const res= await apiService.createUserProfile(form.value);
      localStorage.setItem("userProfile", JSON.stringify(res.data));
      message.value = "Profile saved successfully!";

    } 
    messageType.value = "success";

    // Refresh profile data
    await refreshProfile();

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('profileUpdated'));

    // Refresh the page to update auth stores and navbar
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (err) {
    console.error("Error saving profile:", err);
    message.value = err.response?.data?.message || err.message || "Failed to save profile";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.profile-card {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.form-fields {
  max-width: 600px;
}

.mb-3 {
  margin-bottom: 16px;
}

.mb-4 {
  margin-bottom: 24px;
}

/* Mobile responsiveness for CreateProfile */
@media (max-width: 960px) {
  .profile-card {
    margin: 8px;
  }
  
  .form-fields {
    max-width: 90vw;
  }
}

@media (max-width: 600px) {
  .profile-card {
    margin: 4px;
  }
  
  .v-card-title {
    font-size: 1.25rem;
  }
  
  .form-fields {
    max-width: 95vw;
  }
  
  .mb-3 {
    margin-bottom: 12px;
  }
}

@media (max-width: 400px) {
  .profile-card {
    margin: 2px;
  }
  
  .v-card-title {
    font-size: 1.1rem;
  }
  
  .form-fields {
    max-width: 98vw;
  }
}
</style>
