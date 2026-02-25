<template>
  <PageContainer>
    <v-card-text>
      <div v-if="historyLoading">Loading your requests...</div>
      <div v-else-if="historyError" class="error">{{ historyError }}</div>
      <div v-else>
        <TableComponent title="My Request History" :headers="headers" :items="requests"  :items-per-page="5" :loading="historyLoading">
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" dark>
              {{ item.status }}
            </v-chip>
          </template>

           <template #item.actions="{ item }">
          <v-btn small color="green" :disabled="!canPay(item)" @click="payForRequest(item)">
            Pay
          </v-btn>
          <v-btn v-if="false" small color="blue" :disabled="item.status.toLowerCase() !== 'accepted'"
            @click="goToDirections(item)">
            Directions
          </v-btn>
        </template>

          <template #no-data>
            You have no past requests.
          </template>
        </TableComponent>
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
import { getStatusColor } from "../../utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import { getSafeJson } from "@/utils/storage";
const router = useRouter();
// TypeScript interface matching backend entity
interface RequestHistory {
  id: number;
  username: string;
  description: string;
  location: string;
  date: string;
  status: string;
  servicePrice?: number;
  mechanicId?: number;
}

const formatPrice = (price?: number) =>
  price != null && !isNaN(price) ? `R ${Number(price).toFixed(2)}` : "—";

// Pay when accepted (admin assign) or assigned (mechanic accept)
const canPay = (item: RequestHistory) => {
  const s = (item?.status || "").toLowerCase();
  return s === "accepted" || s === "assigned";
};

// State
const requests = ref<RequestHistory[]>([]);
const historyLoading = ref(false);
const historyError = ref<string | null>(null);

// Table headers
const headers = [
  { title: "Description", value: "description" },
  { title: "Price", value: "price", formatter: (item: RequestHistory) => formatPrice(item.servicePrice) },
  { title: "Location", value: "location" },
  { title: "Date", value: "date" },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false }
];



// Fetch request history for current user
const loadRequests = async () => {
  const profile = getSafeJson("userProfile", {}) || getSafeJson("profile", {});
  const username = profile?.username;
  historyLoading.value = true;
  historyError.value = null;

  try {
    const response = await apiService.getUserRequestHistory(username);
    requests.value = Array.isArray(response.data) ? response.data : [];
  } catch (err: any) {
    console.error(err);
    historyError.value = err.message || "Failed to load request history";
  } finally {
    historyLoading.value = false;
  }
};
const goToDirections = (booking: any) => {
  router.push({
    name: "Mapview",
    query: { lat: booking.locationLat, lng: booking.locationLng },

  });
};
// Pay for an accepted request (same flow as Carwash - use pre-defined servicePrice)
const payForRequest = (request: RequestHistory) => {
  const amount = request.servicePrice ?? 0;
  router.push({
    name: "PaymentScreen",
    query: {
      bookingId: request.id,
      amount: amount,
      jobDes: request.description,
      clientUsername: getSafeJson("userProfile", {})?.username || "",
      mechanicId: request.mechanicId ?? "",
    },
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
