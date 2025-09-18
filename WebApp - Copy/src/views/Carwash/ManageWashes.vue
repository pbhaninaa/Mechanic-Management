<template>
  <PageContainer>
      <v-card-title>Manage Washes</v-card-title>
      <v-card-text>
        <!-- Washes Table -->
        <v-data-table
          :headers="headers"
          :items="washes"
          :loading="loading"
          class="elevation-1"
          :items-per-page="5"
        >
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>Your Wash Jobs</v-toolbar-title>
              <v-spacer></v-spacer>
              <Button label="Refresh" color="primary" :loading="loading" @click="fetchWashes" />
            </v-toolbar>
          </template>

          <!-- Status with colored chips -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              dark
            >
              {{ item.status }}
            </v-chip>
          </template>

          <!-- Actions: Update Status -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              small
              color="green"
              variant="text"
              class="mr-1"
              @click="updateStatus(item, 'In Progress')"
              :disabled="item.status !== 'Pending'"
            >
              <v-icon size="18">mdi-play</v-icon>
            </v-btn>

            <v-btn
              small
              color="blue"
              variant="text"
              class="mr-1"
              @click="updateStatus(item, 'Completed')"
              :disabled="item.status === 'Completed' || item.status === 'Pending'"
            >
              <v-icon size="18">mdi-check</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <div v-if="washes.length === 0" class="mt-3">
          No wash jobs found.
        </div>
      </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { getStatusColor } from "@/utils/helper";
interface WashJob {
  id: number;
  clientName: string;
  clientPhone: string;
  carMake: string;
  carModel: string;
  carPlate: string;
  serviceType: string;
  date: string;
  status: string;
}

const washes = ref<WashJob[]>([]);
const loading = ref(false);

const headers = [
  { text: "Client", value: "clientName" },
  { text: "Phone", value: "clientPhone" },
  { text: "Car Make", value: "carMake" },
  { text: "Car Model", value: "carModel" },
  { text: "Plate", value: "carPlate" },
  { text: "Service Type", value: "serviceType" },
  { text: "Date", value: "date" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false },
];

// Demo data
const demoWashes: WashJob[] = [
  {
    id: 1,
    clientName: "John Doe",
    clientPhone: "0821234567",
    carMake: "Toyota",
    carModel: "Corolla",
    carPlate: "ABC123GP",
    serviceType: "Full Wash",
    date: "2025-09-17",
    status: "Pending",
  },
  {
    id: 2,
    clientName: "Jane Smith",
    clientPhone: "0839876543",
    carMake: "Honda",
    carModel: "Civic",
    carPlate: "XYZ987GP",
    serviceType: "Interior Cleaning",
    date: "2025-09-18",
    status: "In Progress",
  },
  {
    id: 3,
    clientName: "Mike Johnson",
    clientPhone: "0845553333",
    carMake: "Ford",
    carModel: "Focus",
    carPlate: "LMN456GP",
    serviceType: "Exterior Wash",
    date: "2025-09-19",
    status: "Completed",
  },
];



// Update status locally (demo)
const updateStatus = (job: WashJob, status: string) => {
  job.status = status;
};

// Simulate fetch (replace with API later)
const fetchWashes = async () => {
  loading.value = true;
  try {
    washes.value = demoWashes;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchWashes);
</script>
