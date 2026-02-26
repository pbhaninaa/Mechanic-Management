<template>
  <v-container class="d-flex justify-center align-center" fluid>
    <v-card class="pa-6 reset-card">
      <v-card-title class="text-h5 text-center">Reset Password</v-card-title>
      <v-card-subtitle class="text-center pa-2">
        Enter your new password below. The link from your email includes a security token.
      </v-card-subtitle>
      <v-card-text>
        <InputField
          v-model="newPassword"
          label="New Password"
          type="password"
          :disabled="loading"
          required
          class="mb-4"
          outlined
          placeholder="At least 6 characters"
        />
        <InputField
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          :disabled="loading"
          required
          class="mb-4"
          outlined
        />
        <v-alert v-if="passwordMismatch" type="error" density="compact" class="mb-3">
          Passwords do not match
        </v-alert>
        <Button
          label="Reset Password"
          color="primary"
          block
          @click="handleSubmit"
          :loading="loading"
          :disabled="!isFormValid"
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import { toast } from "@/utils/toast";

const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const route = useRoute();
const router = useRouter();

const token = computed(() => {
  const t = route.query.token;
  return typeof t === "string" ? t : (Array.isArray(t) ? t[0] : "");
});

const passwordMismatch = computed(() => {
  const p = newPassword.value;
  const c = confirmPassword.value;
  return p.length > 0 && c.length > 0 && p !== c;
});

const isFormValid = computed(() => {
  const p = newPassword.value;
  const c = confirmPassword.value;
  return token.value && p.length >= 6 && c === p;
});

onMounted(() => {
  if (!token.value) {
    toast.error("Invalid or missing reset link. Please request a new password reset.");
    router.push("/forgot-password");
  }
});

const handleSubmit = async () => {
  if (!isFormValid.value || loading.value) return;
  loading.value = true;
  try {
    await apiService.resetPassword(token.value, newPassword.value);
    router.push("/login");
  } catch (err: any) {
    // Error toast shown by global axios interceptor
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-card {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  width: 100%;
  max-width: 450px;
  margin: 16px;
}
</style>
