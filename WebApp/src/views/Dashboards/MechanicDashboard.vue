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
   
<TableComponent title=" Pending Job Requests" :headers="tableHeaders" :items="pendingJobRequests" item-key="id"
       dense no-pagination :loading="loading">

        <template #item.actions="{ item }">
          <div class="d-flex justify-center">
            <v-btn color="green" small @click="updateJobStatus(item, 'accepted')">Accept</v-btn>
            <v-btn color="red" small class="ml-2" @click="updateJobStatus(item, 'decline')">Decline</v-btn>
          </div>
        </template>
      </TableComponent>
     

    </v-card>

  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS, COLORS, USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";


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
const { formatCurrency } = useCurrency();

// Stats cards data
const statsCards = computed(() => [
  { title: "Pending Jobs", value: pendingJobs.value, color: COLORS.SOFT_ORANGE },
  { title: "Completed Jobs", value: completedJobs.value, color: COLORS.SOFT_GREEN_DARK },
  { title: "Payments ", value: formatCurrency(pendingPayments.value), color: COLORS.SOFT_BLUE },
  { title: "Active Requests", value: activeRequests.value, color: COLORS.SOFT_PURPLE },
]);

// Table headers - Phone only for Admin
const profile = getSafeJson("userProfile", {});
const isAdmin = (profile?.roles || []).includes(USER_ROLES.ADMIN);
const tableHeaders = computed(() => {
  const base = [
    { title: "Client Name", value: "username" },
    { title: "Service", value: "description" },
    { title: "Date", value: "date" },
    { title: "Location", value: "location" },
    { title: "Actions", value: "actions", sortable: false },
  ];
  if (isAdmin) {
    base.splice(3, 0, {
      title: "Phone Number",
      value: "phoneNumber",
      formatter: (item) => item?.phoneNumber || "—",
    });
  }
  return base;
});

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
    const profile = getSafeJson("userProfile", {});
    const payload = { ...job, status, mechanicId: profile?.id };
  
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
