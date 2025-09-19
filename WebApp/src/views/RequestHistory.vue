<template>
  <PageContainer>
    <v-card-title>My Request History</v-card-title>
    <v-card-text>
      <div v-if="historyLoading">Loading your requests...</div>
      <div v-else-if="historyError" class="error">{{ historyError }}</div>
      <div v-else>
        <v-data-table :headers="headers" :items="requests" class="elevation-1" :items-per-page="5">
          <!-- Location column -->
          <template #item.location="{ item }">
            {{ truncateLocation(item.location) }}

          </template>

          <!-- Status column -->
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" dark>
              {{ item.status }}
            </v-chip>
          </template>

          <!-- Actions column -->
          <template #item.actions="{ item }">
            <v-btn small color="green" :disabled="item.status.toLowerCase() !== 'accepted'"
              @click="payForRequest(item)">
              Pay
            </v-btn>
          </template>
        </v-data-table>

        <div v-if="requests.length === 0" class="mt-3">
          You have no past requests.
        </div>
      </div>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";
import { useRouter } from 'vue-router';
const router = useRouter();
// TypeScript interface matching backend entity
interface RequestHistory {
  id: number;
  username: string;
  description: string;
  location: string;
  date: string;
  status: string;
}

// State
const requests = ref<RequestHistory[]>([]);
const historyLoading = ref(false);
const historyError = ref<string | null>(null);

// Table headers
const headers = [
  { text: "Description", value: "description" },
  { text: "Location", value: "location" },
  { text: "Date", value: "date" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false }
];

// Status colors
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case JOB_STATUS.PENDING: return "orange";
    case JOB_STATUS.ACCEPTED: return "blue";
    case JOB_STATUS.COMPLETED: return "green";
    case JOB_STATUS.DECLINED: return "red";
    default: return "grey";
  }
};

// Fetch request history for current user
const loadRequests = async () => {
  const username = JSON.parse(localStorage.getItem("profile") || "{}").username;
  historyLoading.value = true;
  historyError.value = null;

  try {
    const res = await apiService.getUserRequestHistory(username);
    requests.value = res.data;
  } catch (err: any) {
    console.error(err);
    historyError.value = err.message || "Failed to load request history";
  } finally {
    historyLoading.value = false;
  }
};
const truncateLocation = (location: string) => {
  const parts = location.split(",");
  if (parts.length > 3) {
    return parts.slice(0, 3).join(",") + ", ...";
  }
  return location;
};
// Pay for an accepted request
const payForRequest = async (request) => {
  const amountStr = prompt("Enter payment amount:");
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert("Invalid amount");
    return;
  }
  
 router.push({
    name: 'PaymentScreen',   
    query: {
      bookingId: request.id,
      amount: amount,
      jobDes:request.description,
      clientUsername: JSON.parse(localStorage.getItem('userProfile') || '{}').username || '',
      mechanicId:request.mechanicId
    }
  });

 
};

// On component mount
onMounted(() => {
  loadRequests();
});
</script>

<style scoped>
.error {
  color: red;
  font-weight: bold;
}

.mt-3 {
  margin-top: 1rem;
}
</style>
