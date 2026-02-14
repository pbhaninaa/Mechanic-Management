<template>
  <PageContainer>
    <v-card-text>
<TableComponent title="Payments" :headers="headers" :items="payments" :loading="false">
        <template #item.amount="{ item }">
          R{{ item.amount }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn small color="green" :disabled="item.status.toLowerCase() === 'completed'" @click="markCompleted(item)">
            Mark Completed
          </v-btn>
        </template>
      </TableComponent>
  

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
import { getStatusColor } from "@/utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import Test from "@/views/Test.vue";
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
  { title: "Client", value: "client" },
  { title: "Amount", value: "amount" },
  { title: "Jod Description", value: "jobDescription" },
  { title: "Payment Date", value: "date" },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false },
];



// Load payments from API
const loadPayments = async () => {
  try {
    const res = await apiService.getPaymentsByClients();   
    payments.value = res.data.map((p: any) => ({
      id: p.id,
      client: p.clientUsername,
      jobDescription: p.jobDescription,
      amount: Number(p.amount+p.platformFee).toFixed(2),
      date: p.paidAt,
      status: p.status || JOB_STATUS.PAID,
      jobId: p.jobId
    }));
  } catch (err) {
    console.error("Failed to load payments:", err);
  }
};


// Mark payment as completed
const markCompleted = async (payment) => {
  try {


    const job = await apiService.getMechanicRequestsById(payment.jobId);
    const payload = { ...job, status: JOB_STATUS.COMPLETED };
    await apiService.updateRequestMechanic(payload);
    await loadPayments();
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
