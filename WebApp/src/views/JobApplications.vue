<template>
  <PageContainer>
    <v-card-title>Job Applications</v-card-title>
    <v-card-text>
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>
      
      <v-alert
        v-if="error"
        type="error"
        closable
        @click:close="error = ''"
        class="mb-4"
      >
        {{ error }}
      </v-alert>
      
      <div v-if="!loading && applications.length === 0" class="text-center">
        <v-icon size="48" color="grey">mdi-briefcase-outline</v-icon>
        <p class="mt-2">No job applications found</p>
      </div>
      
      <v-list v-else-if="!loading">
        <v-list-item
          v-for="app in applications"
          :key="app.id"
          class="mb-2"
        >
          <template #prepend>
            <v-avatar color="primary" size="40">
              <span class="text-white">{{ app.applicantName?.charAt(0) || '?' }}</span>
            </v-avatar>
          </template>
          
          <v-list-item-content>
            <v-list-item-title class="font-weight-medium">
              {{ app.applicantName || 'Unknown Name' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Email: {{ app.email || 'N/A' }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              Phone: {{ app.phoneNumber || 'N/A' }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              Resume: 
              <a v-if="app.resumeLink" :href="app.resumeLink" target="_blank">View</a>
              <span v-else>N/A</span>
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              Applied: {{ formatDate(app.appliedDate) || 'N/A' }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              <v-chip
                :color="getStatusColor(app.status)"
                size="small"
                class="mt-1"
              >
                {{ app.status || 'Unknown Status' }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </PageContainer>
</template>
<script setup>
import { ref, onMounted } from "vue";
import PageContainer from "../components/PageContainer.vue";
import { STATUS_COLORS } from "../utils/constants";

// Demo data for testing
const demoApplications = [
  {
    id: 1,
    applicantName: "John Doe",
    email: "john.doe@example.com",
    phoneNumber: "+27123456789",
    resumeLink: "https://example.com/resume/john_doe.pdf",
    appliedDate: "2025-09-01",
    status: "pending",
  },
  {
    id: 2,
    applicantName: "Jane Smith",
    email: "jane.smith@example.com",
    phoneNumber: "+27111222333",
    resumeLink: "",
    appliedDate: "2025-08-25",
    status: "approved",
  },
  {
    id: 3,
    applicantName: "Bob Johnson",
    email: "bob.johnson@example.com",
    phoneNumber: "+27119876543",
    resumeLink: "https://example.com/resume/bob_johnson.pdf",
    appliedDate: "2025-09-05",
    status: "rejected",
  }
];

const applications = ref([]);
const loading = ref(true);
const error = ref("");

// Status color helper
const getStatusColor = (status) => {
  return STATUS_COLORS[status?.toLowerCase()] || 'grey';
};

// Format date nicely
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

onMounted(async () => {
  loading.value = true;
  try {
    // For testing, use demo data
    applications.value = demoApplications;

    // Later replace with real API call:
    // const res = await apiService.getJobApplications();
    // applications.value = res?.data || [];
  } catch (err) {
    console.error("Applications error:", err);
    error.value = err.message || "Failed to load job applications";
    applications.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
