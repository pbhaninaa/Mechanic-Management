<template>
  <div v-if="hasError" class="error-boundary">
    <v-alert
      type="error"
      prominent
      class="ma-4"
    >
      <v-row align="center">
        <v-col class="grow">
          <div class="text-h6">Something went wrong!</div>
          <div>{{ errorMessage }}</div>
        </v-col>
        <v-col class="shrink">
          <v-btn @click="retry" color="white" variant="text">
            Retry
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);
const errorMessage = ref('');

onErrorCaptured((error) => {
  hasError.value = true;
  errorMessage.value = error.message || 'An unexpected error occurred';
  console.error('Error caught by boundary:', error);
  return false;
});

const retry = () => {
  hasError.value = false;
  errorMessage.value = '';
};
</script>
