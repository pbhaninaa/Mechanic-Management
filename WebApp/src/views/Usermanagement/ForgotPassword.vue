<template>
  <v-container class="d-flex justify-center align-center" fluid>
    <v-card class="pa-6 forgot-card">
      <v-card-title class="text-h5 text-center">Forgot Password</v-card-title>
      <v-card-subtitle class="text-center pa-2">
        Enter your email address and we'll send you a link to reset your password.
      </v-card-subtitle>
      <v-card-text>
        <InputField
          v-model="email"
          label="Email"
          type="email"
          :disabled="loading"
          required
          class="mb-4"
          outlined
          placeholder="your@email.com"
        />
        <Button
          label="Send Reset Link"
          color="primary"
          block
          @click="handleSubmit"
          :loading="loading"
          :disabled="!email || !isEmailValid"
          class="mb-3"
        />
        <div class="text-center mt-3">
          <router-link to="/login" class="text-body-2 text-primary">Back to Login</router-link>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";

const email = ref("");
const loading = ref(false);
const router = useRouter();

const isEmailValid = computed(() => {
  const e = email.value?.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
});

const handleSubmit = async () => {
  if (!isEmailValid.value || loading.value) return;
  loading.value = true;
  try {
    await apiService.forgotPassword(email.value.trim());
    router.push("/login");
  } catch (err: any) {
    // Error toast shown by global axios interceptor
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-card {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  width: 100%;
  max-width: 450px;
  margin: 16px;
}
</style>
