<template>
  <PageContainer style="min-width: 100%;">
    <h1>Mechanic Dashboard</h1>
    <p>Welcome Mechanic, view your jobs and updates below.</p>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <p v-if="error" class="text-error text-center">{{ error }}</p>

    <!-- Stats Cards with colors -->
    <v-row class="mt-4" dense v-if="!loading && !error">
      <v-col v-for="card in statsCards" :key="card.title" cols="12" sm="6" md="3">
        <v-card :color="card.color" class="pa-4">
          <v-card-title class="text-h6 white--text">{{ card.title }}</v-card-title>
          <v-card-text class="text-h5 white--text">{{ card.value }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pending Job Requests Table -->
    <v-card class="mt-6" outlined v-if="!loading && !error">
      <v-card-title>
        Pending Job Requests
        <!-- <InputField v-model="search" label="Search" dense hide-details solo clearable style="max-width: 200px" /> -->
      </v-card-title>

      <!-- Remove pagination-related props -->
      <v-data-table :headers="tableHeaders" :items="pendingJobRequests" :search="search" item-key="id"
        class="elevation-1" dense no-pagination>

        <template #item.actions="{ item }">
          <div class="d-flex justify-center">
            <v-btn color="green" small @click="updateJobStatus(item, 'accepted')">Accept</v-btn>
            <v-btn color="red" small class="ml-2" @click="updateJobStatus(item, 'decline')">Decline</v-btn>
          </div>
        </template>

        <template #item.location="{ item }">
          <TooltipText :text="item.location" :maxLength="80" />
        </template>


      </v-data-table>

    </v-card>

  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import TooltipText from "@/components/TooltipText.vue";
// import { STATUS_COLORS } from "@/utils/constants";
import { JOB_STATUS } from "@/utils/constants";


const loading = ref(false);
const error = ref<string | null>(null);
const jobRequests = ref<any[]>([]);
const search = ref("");
interface JobRequest {
  id: number;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
}
// Stats cards data
const statsCards = computed(() => [
  { title: "Pending Jobs", value: pendingJobs.value, color: "rgba(255, 165, 0, 0.45)" }, // soft orange
  { title: "Completed Jobs", value: completedJobs.value, color: "rgba(0, 128, 0, 0.45)" }, // soft green
  { title: "Payments Pending", value: `R${pendingPayments.value}`, color: "rgba(0, 0, 255, 0.45)" }, // soft blue
  { title: "Active Requests", value: activeRequests.value, color: "rgba(128, 0, 128, 0.45)" }, // soft purple
]);

// Table headers
const tableHeaders = [
  { text: "Client Name", value: "username" },
  { text: "Service", value: "description" },
  { text: "Date", value: "date" },
  { text: "Phone Number", value: "phoneNumber" },
  { text: "Location", value: "location" },
  { text: "Actions", value: "actions", sortable: false },
];

// Computed stats
const pendingJobs = computed(() =>
  jobRequests.value.filter((j) => j.status === JOB_STATUS.PENDING).length
);
const completedJobs = computed(() =>
  jobRequests.value.filter((j) => j.status === JOB_STATUS.COMPLETED).length
);
const activeRequests = computed(() => jobRequests.value.length);
const pendingPayments = computed(() => completedJobs.value * 1000);

// Only first 5 pending jobs
const pendingJobRequests = computed(() =>
  jobRequests.value.filter((j) => j.status ===JOB_STATUS.PENDING).slice(0, 5)
);
const updateJobStatus = async (job: JobRequest, status: string) => {
  try {
    const payload = { ...job, status };
    await apiService.updateRequestMechanic(payload);
    job.status = status;
  } catch (err: any) {
    console.error("Failed to update job status:", err);
  }
};


// Load mechanic's job requests
const loadJobRequests = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await apiService.getAllRequestHistory();

    // Add phone number to each job request
    jobRequests.value = (res.data || []).map(job => ({
      ...job,
      phoneNumber: "0782141216"  // <-- added phone number
    }));

  } catch (err) {
    error.value = "Failed to load job requests.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  loadJobRequests();
});
</script>

<style scoped>
.text-error {
  color: red;
  font-weight: 500;
}
</style>
