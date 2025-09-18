<template>
  <PageContainer>
    <v-card-title>Payments</v-card-title>
    <v-card-text>
      <p>Welcome Admin, manage all payments here.</p>

      <v-data-table
        :headers="headers"
        :items="payments"
        class="elevation-1"
        :items-per-page="5"
      >
        <template #item.amount="{ item }">
          R{{ item.amount.toFixed(2) }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            small
            color="green"
            :disabled="item.status.toLowerCase() === 'completed'"
            @click="markCompleted(item)"
          >
            Mark Completed
          </v-btn>
        </template>
      </v-data-table>

      <div v-if="payments.length === 0" class="mt-3">
        No payments found.
      </div>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";

interface Payment {
  id: number;
  client: string;
  mechanic: string;
  amount: number;
  date: string;
  status: string;
  jobId: number;
}

const payments = ref<Payment[]>([]);

const headers = [
  { text: "Client", value: "client" },
  { text: "Mechanic", value: "mechanic" },
  { text: "Amount", value: "amount" },
  { text: "Date", value: "date" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case JOB_STATUS.PENDING: return "orange";
    case JOB_STATUS.COMPLETED: return "green";
    case JOB_STATUS.FAILED: return "red";
    default: return "grey";
  }
};

// Load payments from API
const loadPayments = async () => {
  try {
    const res = await apiService.getPaymentsByClient(localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile") || "{}").username : "");
    console.log("Raw response:", res);

    // res is an ApiResponse, the actual payments are in res.data
    payments.value = res.data.map((p: any) => ({
      id: p.id,
      client: p.clientUsername,
      mechanic: p.mechanicId || "Unassigned",
      amount: p.amount,
      date: p.paidAt,
      status: p.status || "Paid",
      jobId: p.jobId
    }));

    console.log("Mapped payments:", payments.value);
  } catch (err) {
    console.error("Failed to load payments:", err);
  }
};


// Mark payment as completed
const markCompleted = async (payment) => {
  try {


    const job = await apiService.getMechanicRequestsById(payment.jobId);
    const payload = { ...job, status: JOB_STATUS.COMPLETED};
    alert("Test "+JSON.stringify(payload));
    await apiService.updateRequestMechanic(payload);
    await loadPayments(); // Refresh table after update
  } catch (err) {
    console.error("Failed to update payment status:", err);
  }
};

onMounted(() => {
  loadPayments();
});
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
