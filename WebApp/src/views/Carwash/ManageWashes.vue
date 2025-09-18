<template>
  <PageContainer>
    <v-card-title>Manage Washes</v-card-title>
    <v-card-text>
      <!-- Washes Table -->
      <v-data-table :headers="headers" :items="washes" :loading="loading" class="elevation-1" :items-per-page="5">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>Your Wash Jobs</v-toolbar-title>
            <v-spacer></v-spacer>
            <Button label="Refresh" color="primary" :loading="loading" @click="fetchWashes" />
          </v-toolbar>
        </template>

        <!-- Status with colored chips -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Service types as comma-separated -->
        <template v-slot:item.serviceTypes="{ item }">
          {{ item.serviceTypes.join(", ") }}
        </template>

        <!-- Optional Actions: (e.g., mark as completed) -->
        <!-- Actions: Update Status -->
        <template v-slot:item.actions="{ item }">
          <v-btn small color="green" variant="text" class="mr-1" @click="updateStatus(item, 'In progress')"
            :disabled="item.status == 'In progress'">
            <v-icon size="18">mdi-play</v-icon>
          </v-btn>

          <v-btn small color="blue" variant="text" class="mr-1" @click="updateStatus(item, 'completed')"
            :disabled="item.status == 'completed'">
            <v-icon size="18">mdi-check</v-icon>
          </v-btn>
        </template>

      </v-data-table>

      <div v-if="washes.length === 0" class="mt-3">
        No accepted wash jobs assigned to you.
      </div>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { getStatusColor } from "@/utils/helper";
import apiService from "@/api/apiService";


const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");

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

const headers = [
  { text: "Client", value: "clientUsername" },
  { text: "Plate", value: "carPlate" },
  { text: "Car Type", value: "carType" },
  { text: "Location", value: "location" },
  { text: "Services", value: "serviceTypes" },
  { text: "Date", value: "date" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false },
];

// Optional: Update status (for example, to "Completed")
// ...imports and interfaces stay the same

const updateStatus = async (job: WashJob, newStatus: string) => {
  try {
    loading.value = true;
    job.status=newStatus

    // 🔁 Call backend to persist the status change
    await apiService.updateCarWashBooking(job.id, job);

    // ✅ Update locally only after success
    job.status = newStatus;
  } catch (error) {
    console.error(`Failed to update booking status for job ${job.id}`, error);
    // TODO: Add user feedback via toast/snackbar if desired
  } finally {
    loading.value = false;
  }
};


// Fetch only bookings accepted by current car wash user
const fetchWashes = async () => {
  loading.value = true;
  try {
    const res = await apiService.getAllCarWashBookings();
    const allBookings = Array.isArray(res.data) ? res.data : [];

    const userId = String(loggedInUser.id);

    washes.value = allBookings.filter(
      booking =>
        booking.status === "accepted" &&
        String(booking.carWashId) === userId
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
