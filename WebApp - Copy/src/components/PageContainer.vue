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
}

.page-card {
  align-self: auto;
  min-height: fit-content;
  max-height: fit-content;
  box-sizing: border-box;
}
</style>
