<template>
  <v-container class="page-container" fluid>
    <v-card class="pa-6 page-card">
      <slot></slot>
    </v-card>
  </v-container>
</template>

<script setup>
// All views using PageContainer require auth (router guard); no need for auth checks here.
// Removed to avoid layout flicker on every route change.
</script>

<style scoped>
.page-container {
  margin-right: 18%;
  width: 80%;
  height: 100%;
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
