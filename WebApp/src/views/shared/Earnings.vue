<template>
  <PageContainer>
    <v-card-text>
     
      <!-- Earnings Table -->
      <TableComponent
        title="Earnings"
        :headers="headers"
        :items="earnings"
        :items-per-page="10"
        :loading="loading"
        show-search
        search-placeholder="Search job, date, status..."
        @update:search-value="onSearch"
      >

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

      <v-row v-if="isServiceProvider" class="mt-4" justify="end" align="center">
        <v-col cols="12" class="d-flex justify-end flex-wrap gap-2 py-0">
          <v-btn
            color="primary"
            variant="tonal"
              class="mr-3"
            :loading="exportEarningsLoading"
            @click="exportEarnings"
          >
            <v-icon start size="18">mdi-download</v-icon>
            Export earnings
          </v-btn>
         
          <v-btn
            color="primary"
              class="mr-3"
            variant="tonal"
            :loading="emailEarningsLoading"
            @click="emailEarningsReport"
          >
            <v-icon start size="18">mdi-email</v-icon>
            Email earnings report
          </v-btn>
         
        </v-col>
      </v-row>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { getSafeJson } from "@/utils/storage";
import { formatDateTime } from "@/composables/useDateFormat";
import { useCurrency } from "@/composables/useCurrency";
import { getStatusColor } from "@/utils/helper";
import { USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import API from "@/api/axios";
import { API_ENDPOINTS } from "@/utils/constants";
import { toast } from "@/utils/toast";

const { currencySymbol } = useCurrency();

// Logged in user
const loggedInUser = getSafeJson("userProfile", {}) || {};
const role = loggedInUser.roles?.[0];
const isServiceProvider = role === USER_ROLES.MECHANIC || role === USER_ROLES.CAR_WASH;

// Report dates: profile creation date → today (no date range picker)
const reportStartDate = computed(() => {
  const createdAt = loggedInUser.createdAt;
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
});
const reportEndDate = computed(() => new Date().toISOString().slice(0, 10));
const exportEarningsLoading = ref(false);
const exportJobsLoading = ref(false);
const emailEarningsLoading = ref(false);
const emailJobsLoading = ref(false);

function providerParams() {
  const mechanicId = role === USER_ROLES.MECHANIC ? loggedInUser.id : undefined;
  const carWashId = role === USER_ROLES.CAR_WASH ? loggedInUser.id : undefined;
  return { mechanicId, carWashId, startDate: reportStartDate.value, endDate: reportEndDate.value };
}

function exportEarnings() {
  const { mechanicId, carWashId, startDate, endDate } = providerParams();
  exportEarningsLoading.value = true;
  API.get(API_ENDPOINTS.REPORTS_EARNINGS_EXPORT, {
    params: { mechanicId, carWashId, startDate, endDate },
    responseType: "blob",
  })
    .then((res) => {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `earnings-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Earnings report downloaded.");
    })
    .catch(() => toast.error("Export failed."))
    .finally(() => { exportEarningsLoading.value = false; });
}

function exportCompletedJobs() {
  const { mechanicId, carWashId, startDate, endDate } = providerParams();
  exportJobsLoading.value = true;
  API.get(API_ENDPOINTS.REPORTS_COMPLETED_JOBS_EXPORT, {
    params: { mechanicId, carWashId, startDate, endDate },
    responseType: "blob",
  })
    .then((res) => {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `completed-jobs-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Completed jobs report downloaded.");
    })
    .catch(() => toast.error("Export failed."))
    .finally(() => { exportJobsLoading.value = false; });
}

function emailEarningsReport() {
  emailEarningsLoading.value = true;
  const payload = { ...providerParams() };
  apiService.emailEarningsReport(payload).then(() => {}).catch(() => toast.error("Failed to send email.")).finally(() => { emailEarningsLoading.value = false; });
}

function emailCompletedJobsReport() {
  emailJobsLoading.value = true;
  const payload = { ...providerParams() };
  apiService.emailCompletedJobsReport(payload).then(() => {}).catch(() => toast.error("Failed to send email.")).finally(() => { emailJobsLoading.value = false; });
}
// Table headers: Service providers see "Amount" (their payout); Admin sees Done By (who did the job), Amount Paid, Commission, Provider Payout
const headers = [
  { title: "Job Description", value: "jobDescription" },
  ...(role === USER_ROLES.ADMIN ? [{ title: "Done By", value: "serviceProvider" }] : []),
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

const searchQuery = ref("");
function onSearch(q) {
  searchQuery.value = q;
}
const fetchEarnings = async () => {
  loading.value = true;
  const params = searchQuery.value ? { search: searchQuery.value } : {};
  try {
    let response;
    let providerMap: Record<string, string> = {};
    if (role === USER_ROLES.MECHANIC) {
      response = await apiService.getPaymentsByMechanic(loggedInUser.id, params);
    } else if (role === USER_ROLES.CAR_WASH) {
      response = await apiService.getPaymentsByCarWash(loggedInUser.id, params);
    } else if (role === USER_ROLES.ADMIN) {
      const [paymentsRes, profilesRes] = await Promise.all([
        apiService.getPaymentsByClients(params),
        apiService.getAllUsers(),
      ]);
      response = paymentsRes;
      const profiles = profilesRes.data || [];
      profiles.forEach((profile: any) => {
        const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.username;
        if (profile.id) providerMap[profile.id] = name || profile.id;
      });
    } else {
      throw new Error("Invalid user role for earnings");
    }

    // Map backend data to table-friendly format
    // Service providers (mechanic/carwash) see only their payout (amount). Admin sees full breakdown + Service Provider.
    earnings.value = (response.data || []).map((p) => {
      const providerPayout = Number(p.amount || 0);
      const commission = Number(p.platformFee || 0);
      const amountPaidByUser = providerPayout + commission;
      const providerId = p.mechanicId || p.carWashId;
      const providerType = p.mechanicId ? "Mechanic" : p.carWashId ? "Car Wash" : "";
      const providerName = providerId ? (providerMap[providerId] || null) : null;
      const serviceProvider = providerName || (providerType || "-");
      return {
        id: p.id,
        jobDescription: p.jobDescription || `Job #${p.jobId}`,
        serviceProvider: role === USER_ROLES.ADMIN ? serviceProvider : undefined,
        paidAt: formatDateTime(p.paidAt),
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

watch(searchQuery, () => fetchEarnings());
onMounted(fetchEarnings);
</script>

<style scoped>

</style>
