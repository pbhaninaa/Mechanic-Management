<template>
  <PageContainer>
    <v-card-text>
<TableComponent title="Payments" :headers="headers" :items="payments" :loading="false">
        <template #item.amount="{ item }">
          {{ currencySymbol }} {{ item.amount }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>
      </TableComponent>
  

     
    </v-card-text>
 
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";
import { getStatusColor } from "@/utils/helper";
import { useCurrency } from "@/composables/useCurrency";
import TableComponent from "@/components/TableComponent.vue";
import { formatDateTime } from "@/composables/useDateFormat";
import Test from "@/views/Test.vue";
interface Payment {
  id: string;
  client: string;
  mechanic: string;
  amount: number;
  date: string;
  status: string;
  jobId: string;
}

const { currencySymbol } = useCurrency();
const payments = ref<Payment[]>([]);

const headers = [
  { title: "Client", value: "client" },
  { title: "Amount", value: "amount" },
  { title: "Job Description", value: "jobDescription" },
  { title: "Payment Date", value: "date", formatter: (item) => formatDateTime(item?.date) },
  { title: "Status", value: "status" },
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

onMounted(() => {
  loadPayments();
});
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
