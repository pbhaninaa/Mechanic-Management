<template>
  <v-container class="page-container" fluid :class="{ 'unauth-centered': !isAuthenticated }">
    <v-card class="pa-6  page-card">
      <slot style="background-color: yellow;"></slot>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
const isAuthenticated = ref(false);
const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};
onMounted(() => {
  checkAuth();
  window.addEventListener("storage", checkAuth);
});
</script>

<style scoped>
.page-container {
  margin-right: 15%;
  width: 85%;
}

.unauth-centered {
  align-items: center; 
  justify-content: center;
  margin: 0;
  width: 100%;
}

.page-card {
  align-self: auto;
  min-height: fit-content;
  max-height: fit-content;
  box-sizing: border-box;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .page-container {
    margin-right: 5%;
    width: 95%;
  }
  
  .page-card {
    padding: 16px !important;
  }
}

@media (max-width: 600px) {
  .page-container {
    margin-right: 2%;
    width: 98%;
  }
  
  .page-card {
    padding: 12px !important;
  }
}

@media (max-width: 400px) {
  .page-container {
    margin-right: 0;
    width: 100%;
  }
  
  .page-card {
    padding: 8px !important;
  }
}
</style>
