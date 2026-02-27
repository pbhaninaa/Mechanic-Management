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
        :role="primaryRole"
      />
      <p v-else>No dashboard available for this role.</p>
    </div>
  </PageContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { useProfile } from "@/composables/useProfile";

import ClientDashboard from "./ClientDashboard.vue";
import ServiceProviderDashboard from "./ServiceProviderDashboard.vue";
import AdminDashboard from "./AdminDashboard.vue";
import { USER_ROLES } from "@/utils/constants";

const { profile, loading, error, loadProfile } = useProfile();

const primaryRole = computed(() => profile.value?.roles?.[0] || null);

const dashboardComponent = computed(() => {
  switch (primaryRole.value) {
    case USER_ROLES.CLIENT:
      return ClientDashboard;
    case USER_ROLES.MECHANIC:
    case USER_ROLES.CAR_WASH:
      return ServiceProviderDashboard;
    case USER_ROLES.ADMIN:
      return AdminDashboard;
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
