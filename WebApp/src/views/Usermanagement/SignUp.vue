<template>
  <v-container class="d-flex justify-center align-center" fluid :class="{ 'unauth-centered': !isAuthenticated }">
    <v-card class="pa-6 page-card"  outlined>
      <v-card-title class="text-h5 text-center">Create Account</v-card-title>

      <v-card-text>
        <!-- Signup Form -->
        <v-form @submit.prevent="signup" ref="form">
          <!-- Username Input -->
          <InputField
            v-model="formData.username"
            label="Username"
            type="text"
            :extra-rules="[rules.minLength(3)]"
            :disabled="loading"
            required
            outlined
            class="mb-4"
          />

          <!-- Password Input -->
          <InputField
            v-model="formData.password"
            label="Password"
            type="password"
            :extra-rules="[rules.minLength(6)]"
            :disabled="loading"
            required
            outlined
            class="mb-4"
          />

          <!-- Confirm Password Input -->
          <InputField
            v-model="formData.confirmPassword"
            label="Confirm Password"
            type="password"
            :extra-rules="[rules.confirmPassword]"
            :disabled="loading"
            required
            outlined
            class="mb-4"
          />

          <!-- Submit Button -->
          <Button
            label="Create Account"
            color="primary"
            block
            @click="signup"
            :loading="loading"
            :disabled="!isFormValid"
            class="mb-3"
          />

          <!-- Divider -->
          <v-divider class="my-3"></v-divider>

          <!-- Sign In Link -->
          <div class="text-center">
            <span class="text-body-2">Already have an account?</span>
            <Button
              label="Sign In"
              variant="text"
              color="primary"
              @click="goToLogin"
              :disabled="loading"
              class="ml-2"
            />
          </div>

          <!-- Feedback Alert -->
          <v-alert
            v-if="message"
            :type="messageType"
            class="mt-4"
            closable
            @click:close="message = ''"
            transition="slide-x-reverse-transition"
          >
            {{ message }}
          </v-alert>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
const router = useRouter();
const form = ref(null);
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

const formData = ref({
  username: "",
  password: "",
  confirmPassword: ""
});

// Form validation rules
const rules = {
  required: (value) => !!value || "This field is required",
  minLength: (min) => (value) =>
    (value && value.length >= min) || `Must be at least ${min} characters`,
  confirmPassword: (value) =>
    value === formData.value.password || "Passwords do not match"
};

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return (
    formData.value.username &&
    formData.value.password &&
    formData.value.confirmPassword &&
    formData.value.password === formData.value.confirmPassword
  );
});

const signup = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    message.value = "Please fill in all required fields correctly";
    messageType.value = "error";
    return;
  }

  loading.value = true;
  message.value = "";

  try {
    const response = await apiService.signup({
      username: formData.value.username,
      password: formData.value.password
    });

    if (response && response.data) {
      message.value = "Account created successfully! Redirecting to login...";
      messageType.value = "success";
      setTimeout(() => {
        router.push("/login");
      }, 200);
      
      // Clear form
      formData.value = {
        username: "",
        password: "",
        confirmPassword: ""
      };
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Signup error:", error);
    message.value = error.message || "Failed to create account. Please try again.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.page-card {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1); 
  border-radius: 10px;
  width: 100%;
  max-width: 600px;
  margin: 16px;
}

.v-card-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.mb-4 {
  margin-bottom: 16px;
}

.v-divider {
  margin: 24px 0;
}

.text-body-2 {
  font-size: 14px;
}

.ml-2 {
  margin-left: 8px;
}

.text-center {
  text-align: center;
}

.v-alert {
  font-weight: 500;
  border-radius: 8px;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .page-card {
    margin: 8px;
    max-width: 90vw;
  }
  
  .v-card-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .page-card {
    margin: 4px;
    max-width: 95vw;
    border-radius: 8px;
  }
  
  .v-card-title {
    font-size: 1.25rem;
  }
  
  .mb-4 {
    margin-bottom: 12px;
  }
  
  .v-divider {
    margin: 16px 0;
  }
}

@media (max-width: 400px) {
  .page-card {
    margin: 2px;
    max-width: 98vw;
  }
  
  .v-card-title {
    font-size: 1.1rem;
  }
  
  .text-body-2 {
    font-size: 12px;
  }
}
</style>
