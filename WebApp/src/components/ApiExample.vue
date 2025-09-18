<template>
  <v-container>
    <v-card class="pa-6 mx-auto" max-width="600">
      <v-card-title>API Service Usage Examples</v-card-title>
      <v-card-text>
        <v-alert
          v-if="message"
          :type="messageType"
          class="mb-4"
          closable
          @click:close="message = ''"
        >
          {{ message }}
        </v-alert>

        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              color="primary"
              block
              @click="testGetRequest"
              :loading="loading.get"
              class="mb-2"
            >
              Test GET Request
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn
              color="success"
              block
              @click="testPostRequest"
              :loading="loading.post"
              class="mb-2"
            >
              Test POST Request
            </v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              color="warning"
              block
              @click="testPutRequest"
              :loading="loading.put"
              class="mb-2"
            >
              Test PUT Request
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn
              color="error"
              block
              @click="testDeleteRequest"
              :loading="loading.delete"
              class="mb-2"
            >
              Test DELETE Request
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <h3>Response Data:</h3>
        <v-card variant="outlined" class="pa-3">
          <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </v-card>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import apiService from '../api/apiService';

const message = ref('');
const messageType = ref('info');
const responseData = ref(null);
const loading = ref({
  get: false,
  post: false,
  put: false,
  delete: false
});

const showMessage = (text, type = 'info') => {
  message.value = text;
  messageType.value = type;
};

const testGetRequest = async () => {
  loading.value.get = true;
  try {
    // Example: Get user profile
    const response = localStorage.getItem("userProfile")
      ? JSON.parse(localStorage.getItem("userProfile"))
      : null;
    responseData.value = response;
    showMessage('GET request successful!', 'success');
  } catch (error) {
    showMessage(`GET request failed: ${error.message}`, 'error');
    responseData.value = { error: error.message };
  } finally {
    loading.value.get = false;
  }
};

const testPostRequest = async () => {
  loading.value.post = true;
  try {
    // Example: Create a new job application
    const testData = {
      companyName: 'Test Company',
      position: 'Test Position',
      status: 'applied'
    };
    const response = await apiService.createJobApplication(testData);
    responseData.value = response;
    showMessage('POST request successful!', 'success');
  } catch (error) {
    showMessage(`POST request failed: ${error.message}`, 'error');
    responseData.value = { error: error.message };
  } finally {
    loading.value.post = false;
  }
};

const testPutRequest = async () => {
  loading.value.put = true;
  try {
    // Example: Update user profile
    const testData = {
      fullName: 'Updated Name',
      bio: 'Updated bio'
    };
    const response = await apiService.updateUserProfile(testData);
    responseData.value = response;
    showMessage('PUT request successful!', 'success');
  } catch (error) {
    showMessage(`PUT request failed: ${error.message}`, 'error');
    responseData.value = { error: error.message };
  } finally {
    loading.value.put = false;
  }
};

const testDeleteRequest = async () => {
  loading.value.delete = true;
  try {
    // Example: Delete a job application (using a test ID)
    const testId = 1;
    const response = await apiService.deleteJobApplication(testId);
    responseData.value = response;
    showMessage('DELETE request successful!', 'success');
  } catch (error) {
    showMessage(`DELETE request failed: ${error.message}`, 'error');
    responseData.value = { error: error.message };
  } finally {
    loading.value.delete = false;
  }
};
</script>
