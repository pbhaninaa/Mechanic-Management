<template>
  <v-container class="d-flex justify-center align-center" fluid>
    <v-card class="pa-6 login-card">
      <v-card-title class="text-h5 text-center">Login</v-card-title>
      
      <v-card-text>
        <!-- Username Input -->
        <InputField
          v-model="username"
          label="Username"
          type="text"
          :disabled="loading"
          required
          class="mb-4"
          outlined
        />

        <!-- Password Input -->
        <InputField
          v-model="password"
          label="Password"
          type="password"
          :disabled="loading"
          required
          class="mb-4"
          outlined
        />

        <!-- Login Button -->
        <Button
          label="Login"
          color="primary"
          block
          @click="handleLogin"
          :loading="loading"
          :disabled="!username || !password"
          class="mb-3"
        />

        <!-- Divider -->
        <v-divider class="my-3"></v-divider>

        <!-- Sign Up Link -->
        <div class="text-center">
          <span class="text-body-2">Don't have an account?</span>
          <Button
            label="Sign Up"
            variant="text"
            color="primary"
            @click="goToSignup"
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
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { loginUser, goToSignup } from "@/utils/helper";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
const username = ref("");
const password = ref("");
const message = ref("");
const messageType = ref("success");
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  message.value = "";

  const result = await loginUser(username.value, password.value);

  if (result.success) {
    message.value = result.message;
    messageType.value = "success";
    
    // Redirect after successful login
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    message.value = result.message;
    messageType.value = "error";
  }

  loading.value = false;
};
</script>

<style scoped>
.login-card {
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

.v-alert {
  font-weight: 500;
  border-radius: 8px;
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

/* Mobile responsiveness */
@media (max-width: 960px) {
  .login-card {
    margin: 8px;
    max-width: 90vw;
  }
  
  .v-card-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 600px) {
  .login-card {
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
  .login-card {
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
