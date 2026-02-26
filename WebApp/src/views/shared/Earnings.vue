<template>
  <PageContainer>
    <v-card-text>
      <!-- Earnings Table -->
      <TableComponent title="Earnings" :headers="headers" :items="earnings"  :items-per-page="10"
        :loading="loading">

        <template #item.amount="{ item }">
          {{ currencySymbol }} {{ item.amount }}
        </template>
        <template #item.amountPaidByUser="{ item }">
          {{ currencySymbol }} {{ item.amountPaidByUser }}
        </template>
        <template #item.platformFee="{ item }">
          {{ currencySymbol }} {{ item.platformFee }}
        </template>

        <template #item.paidAt="{ item }">
          {{ item.paidAt }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #no-data>
          No earnings found.
        </template>
      </TableComponent>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { getSafeJson } from "@/utils/storage";
import { format } from "date-fns";
import { useCurrency } from "@/composables/useCurrency";
import { getStatusColor } from "@/utils/helper";
import { USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";

const { currencySymbol } = useCurrency();

// Logged in user
const loggedInUser = getSafeJson("userProfile", {}) || {};
const role = loggedInUser.roles?.[0];
// Table headers: Service providers see "Amount" (their payout); Admin sees Amount Paid, Commission, Provider Payout
const headers = [
  { title: "Job Description", value: "jobDescription" },
  { title: "Date", value: "paidAt" },
  ...(role === USER_ROLES.ADMIN
    ? [
        { title: "Amount Paid (User)", value: "amountPaidByUser" },
        { title: "App Commission", value: "platformFee" },
        { title: "Provider Payout", value: "amount" },
      ]
    : [{ title: "Amount", value: "amount" }]),
  { title: "Status", value: "status" },
];

// State
const earnings = ref([]);
const loading = ref(false);

// Fetch earnings depending on role
const fetchEarnings = async () => {
  loading.value = true;

  try {
    let response;
    if (role === USER_ROLES.MECHANIC) {
      response = await apiService.getPaymentsByMechanic(loggedInUser.id);
    } else if (role === USER_ROLES.CAR_WASH) {
      response = await apiService.getPaymentsByCarWash(loggedInUser.id);
    } else if (role === USER_ROLES.ADMIN) {
      response = await apiService.getPaymentsByClients();
    } else {
      throw new Error("Invalid user role for earnings");
    }

    // Map backend data to table-friendly format
    // Service providers (mechanic/carwash) see only their payout (amount). Admin sees full breakdown.
    earnings.value = (response.data || []).map((p) => {
      const providerPayout = Number(p.amount || 0);
      const commission = Number(p.platformFee || 0);
      const amountPaidByUser = providerPayout + commission;
      return {
        id: p.id,
        jobDescription: p.jobDescription || `Job #${p.jobId}`,
        paidAt: format(new Date(p.paidAt), "dd MMM yyyy, HH:mm"),
        amount: providerPayout.toFixed(2),
        amountPaidByUser: role === USER_ROLES.ADMIN ? amountPaidByUser.toFixed(2) : undefined,
        platformFee: role === USER_ROLES.ADMIN ? commission.toFixed(2) : undefined,
        status: "Paid",
      };
    });
  } catch (err: any) {
    console.error("Error fetching earnings:", err);
    // Error toast shown by global axios interceptor
  } finally {
    loading.value = false;
  }
};

// Auto-fetch on mount
onMounted(fetchEarnings);
</script>

<style scoped>

</style>
