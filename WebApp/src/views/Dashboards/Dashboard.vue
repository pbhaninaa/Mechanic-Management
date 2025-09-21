<template>
  <PageContainer>
    <h1>Dashboard</h1>
    <p>
      Welcome, 
      {{ profile ? profile.firstName : "User" }}
      {{ profile ? profile.lastName : "" }}!
    </p>

    <div v-if="loading">Loading profile...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Render dashboard only if role is valid -->
      <component
        v-if="dashboardComponent"
        :is="dashboardComponent"
        :profile="profile"
      />
      <p v-else>No dashboard available for this role.</p>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";

import ClientDashboard from "./ClientDashboard.vue";
import MechanicDashboard from "./MechanicDashboard.vue";
import AdminDashboard from "./AdminDashboard.vue";
import CarWashDashbord from "./CarWashDashbord.vue";
import { USER_ROLES } from "@/utils/constants";

const profile = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const primaryRole = computed(() => profile.value?.roles?.[0] || null);

const dashboardComponent = computed(() => {
  switch (primaryRole.value) {
    case USER_ROLES.CLIENT:
      return ClientDashboard;
    case USER_ROLES.MECHANIC:
      return MechanicDashboard;
    case USER_ROLES.ADMIN:
      return AdminDashboard;
          case USER_ROLES.CAR_WASH:
      return CarWashDashbord;
    default:
      return null;
  }
});

const getProfile = async () => {
  loading.value = true;
  error.value = null;

  try {
    let userProfile = null;

    // 1. Try localStorage
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      userProfile = JSON.parse(stored);
    }
    // 2. Fallback to API if not in localStorage
    if (!userProfile) {
      const res = await apiService.getUserProfile();
      userProfile = res.data;
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
    }

    profile.value = userProfile;
  } catch (err: any) {
    error.value = err.message || "Profile not found or unauthorized";
  } finally {
    loading.value = false;
  }
};

onMounted(() => getProfile());
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.error {
  color: red;
  font-weight: bold;
}
</style>
