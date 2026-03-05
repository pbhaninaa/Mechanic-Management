<template>
  <PageContainer>
    <v-card-text>
      <v-alert v-if="historyError" type="error" density="compact" class="mb-3" closable @click:close="historyError = null">
        {{ historyError }}
      </v-alert>

      <TableComponent
        title="My Request History"
        :headers="headers"
        :items="requests"
        :items-per-page="10"
        :loading="historyLoading"
        no-data-message="No data."
        show-search
        search-placeholder="Search description, date, status..."
        @update:search-value="onSearch"
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-tooltip text="Pay" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" icon
                :disabled="isCompleted(item) || !canPay(item)"
                @click="payForRequest(item)">
                <v-icon size="18">mdi-credit-card</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </TableComponent>

      <v-row class="mt-4" justify="end" align="center">
        <v-col cols="12" class="d-flex justify-end flex-wrap gap-2 py-0">
          <v-btn
            color="primary"
            variant="tonal"  class="mr-3"
            :loading="exportLoading"
            @click="exportMechanicRequestsReport"
          >
            <v-icon start size="18">mdi-download</v-icon>
            Export CSV
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :loading="emailReportLoading"
            @click="emailMechanicRequestsReport"
          >
            <v-icon start size="18">mdi-email</v-icon>
            Email report
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
import { JOB_STATUS } from "@/utils/constants";
import { useRouter } from 'vue-router';
import { getStatusColor, sortRequestsByStatus } from "../../utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import { formatDate } from "@/composables/useDateFormat";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import API from "@/api/axios";
import { API_ENDPOINTS } from "@/utils/constants";
import { toast } from "@/utils/toast";
const router = useRouter();
// TypeScript interface matching backend entity
interface RequestHistory {
  id: string;
  username: string;
  description: string;
  location: string;
  date: string;
  status: string;
  servicePrice?: number;
  mechanicId?: string;
}

const { formatCurrency } = useCurrency();
const formatPrice = (price?: number) =>
  price != null && !isNaN(price) ? formatCurrency(price) : "—";

// Pay when accepted (admin assign) or assigned (mechanic accept)
const canPay = (item: RequestHistory) => {
  const s = (item?.status || "").toLowerCase();
  return s === "accepted" || s === "assigned";
};
const isCompleted = (item: RequestHistory) => (item?.status || "").toLowerCase() === "completed";

// State
const requests = ref<RequestHistory[]>([]);
const historyLoading = ref(false);
const historyError = ref<string | null>(null);

// Report dates: profile creation date → today (no date range picker)
const profile = computed(() => getSafeJson("userProfile", {}) || getSafeJson("profile", {}));
const reportStartDate = computed(() => {
  const createdAt = profile.value?.createdAt;
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
});
const reportEndDate = computed(() => new Date().toISOString().slice(0, 10));
const exportLoading = ref(false);
const emailReportLoading = ref(false);

function exportMechanicRequestsReport() {
  exportLoading.value = true;
  API.get(API_ENDPOINTS.REPORTS_MECHANIC_REQUESTS_EXPORT, {
    params: {
      username: profile.value?.username,
      startDate: reportStartDate.value,
      endDate: reportEndDate.value,
    },
    responseType: "blob",
  })
    .then((res) => {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mechanic-requests-history-${reportStartDate.value}-to-${reportEndDate.value}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded.");
    })
    .catch(() => toast.error("Export failed."))
    .finally(() => { exportLoading.value = false; });
}

function emailMechanicRequestsReport() {
  emailReportLoading.value = true;
  apiService
    .emailMechanicRequestsReport({
      username: profile.value?.username,
      startDate: reportStartDate.value,
      endDate: reportEndDate.value,
    })
    .then(() => {})
    .catch(() => toast.error("Failed to send report email."))
    .finally(() => { emailReportLoading.value = false; });
}

// Table headers
const headers = [
  { title: "Description", value: "description" },
  { title: "Price", value: "price", formatter: (item: RequestHistory) => formatPrice(item.servicePrice) },
  { title: "Date", value: "date", formatter: (item) => formatDate(item?.date) },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false }
];



const searchQuery = ref("");
function onSearch(q) {
  searchQuery.value = q;
}
const loadRequests = async () => {
  const username = profile.value?.username;
  historyLoading.value = true;
  historyError.value = null;
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {};
    const response = await apiService.getUserRequestHistory(username, params);
    const data = Array.isArray(response.data) ? response.data : [];
    requests.value = sortRequestsByStatus(data);
  } catch (err: any) {
    historyError.value = err?.message || "Failed to load request history";
    requests.value = [];
  } finally {
    historyLoading.value = false;
  }
};
watch(searchQuery, () => loadRequests());
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
.mt-3 {
  margin-top: 1rem;
}
</style>
