<template>
  <PageContainer>
    <v-alert v-if="updateError" type="error" dismissible class="mb-4" @click:close="updateError = ''">
      {{ updateError }}
    </v-alert>
    <v-card-text>
      <TableComponent title="Manage Washes" :headers="headers" :items="washes"  :items-per-page="5" :loading="loading">
        <!-- Status with colored chips -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Service types as comma-separated -->
        <template #item.serviceTypes="{ item }">
          {{ item.serviceTypes.join(", ") }}
        </template>

        <!-- Actions: Update Status -->
        <template #item.actions="{ item }">
          <!-- Start / In progress button -->
          <v-tooltip text="Start wash (client has paid)" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" small color="green" variant="text" class="mr-1"
                @click="updateStatus(item, JOB_STATUS.IN_PROGRESS)" :disabled="item.status === JOB_STATUS.COMPLETED || item.status !== JOB_STATUS.PAID">
                <v-icon size="18">mdi-play</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Finish wash - you have done the work" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" small color="blue" variant="text" class="mr-1"
                @click="updateStatus(item, JOB_STATUS.COMPLETED)" :disabled="item.status === JOB_STATUS.COMPLETED || item.status !== JOB_STATUS.IN_PROGRESS">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </TableComponent>
    
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { getStatusColor } from "@/utils/helper";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";


import { getSafeJson } from "@/utils/storage";

const loggedInUser = getSafeJson("userProfile", {});

interface WashJob {
  id: number;
  clientUsername: string;
  carWashId: string | null;
  carPlate: string;
  carType: string;
  carDescription: string;
  location: string;
  date: string;
  status: string;
  servicePrice: number;
  serviceTypes: string[];
  createdAt: string;
}

const washes = ref<WashJob[]>([]);
const loading = ref(false);
const updateError = ref("");

const headers = [
  { title: "Client", value: "clientUsername" },
  { title: "Plate", value: "carPlate" },
  { title: "Car Type", value: "carType" },
  { title: "Location", value: "location" },
  { title: "Services", value: "serviceTypes" },
  { title: "Date", value: "date" },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false },
];

// Optional: Update status (for example, to "Completed")
// ...imports and interfaces stay the same

const updateStatus = async (job: WashJob, newStatus: string) => {
  const jobId = job?.id;
  if (!jobId) {
    updateError.value = "Cannot update: booking has no ID. Please refresh the page.";
    return;
  }
  updateError.value = "";
  try {
    loading.value = true;
    const previousStatus = job.status;
    job.status = newStatus;

    await apiService.updateCarWashBooking(jobId, job);

    // ✅ Update locally only after success
    job.status = newStatus;
  } catch (error) {
    console.error(`Failed to update booking status for job ${job.id}`, error);
    job.status = previousStatus;
    updateError.value = `Failed to update status. Please try again.`;
  } finally {
    loading.value = false;
  }
};


// Fetch all bookings and filter to those assigned to this car wash operator
const fetchWashes = async () => {
  loading.value = true;
  try {
    const res = await apiService.getAllCarWashBookings();
    const allBookings = Array.isArray(res?.data) ? res.data : [];

    const userId = String(loggedInUser?.id || "");

    washes.value = allBookings.filter(
      (booking) => String(booking?.carWashId ?? "") === userId
    );
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    washes.value = [];
  } finally {
    loading.value = false;
  }
};


onMounted(fetchWashes);
</script>
