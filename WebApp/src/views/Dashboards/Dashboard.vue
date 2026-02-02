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

<script setup>
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { useProfile } from "@/composables/useProfile";

import ClientDashboard from "./ClientDashboard.vue";
import MechanicDashboard from "./MechanicDashboard.vue";
import AdminDashboard from "./AdminDashboard.vue";
import CarWashDashbord from "./CarWashDashbord.vue";
import { USER_ROLES } from "@/utils/constants";

const { profile, loading, error, loadProfile } = useProfile();

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

onMounted(() => loadProfile());
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
