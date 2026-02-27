<template>
  <PageContainer>
    <v-card-text>
      <v-row class="mb-4" align="center">
        <v-col cols="12" sm="auto">
          <span class="text-subtitle-2 mr-2">Date range:</span>
        </v-col>
        <v-col cols="12" sm="2">
          <v-text-field
            v-model="reportStartDate"
            type="date"
            label="From"
            density="compact"
            hide-details
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="2">
          <v-text-field
            v-model="reportEndDate"
            type="date"
            label="To"
            density="compact"
            hide-details
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="auto">
          <v-btn
            color="primary"
            variant="tonal"
            :loading="exportLoading"
            :disabled="!reportStartDate || !reportEndDate"
            @click="exportCarWashReport"
          >
            <v-icon start size="18">mdi-download</v-icon>
            Export CSV
          </v-btn>
        </v-col>
        <v-col cols="12" sm="auto">
          <v-btn
            color="primary"
            variant="tonal"
            :loading="emailReportLoading"
            :disabled="!reportStartDate || !reportEndDate"
            @click="emailCarWashReport"
          >
            <v-icon start size="18">mdi-email</v-icon>
            Email report
          </v-btn>
        </v-col>
      </v-row>
      <TableComponent
        title="My Car Wash History"
        :headers="headers"
        :items="bookings"
        :items-per-page="10"
        :loading="loading"
        show-search
        search-placeholder="Search car plate, services, date, status..."
        @update:search-value="onSearch"
      >


        <template #item.serviceTypes="{ item }">
          {{ item.serviceTypes.join(", ") }}
        </template>

        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        <template #item.price="{ item }">
          {{ formatCurrency(item.servicePrice) }}
        </template>
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-tooltip text="Pay" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" icon
                :disabled="item.status?.toLowerCase() === 'completed' || item.status?.toLowerCase() !== 'accepted'"
                @click="payForRequest(item)">
                <v-icon size="18">mdi-credit-card</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <template #no-data>
          You have no past car washes.
        </template>
      </TableComponent>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { formatDate } from "@/composables/useDateFormat";
import apiService from "@/api/apiService";
import { getStatusColor, sortRequestsByStatus } from "@/utils/helper";
import { useCurrency } from "@/composables/useCurrency";
import { useRouter } from 'vue-router'
import TableComponent from "@/components/TableComponent.vue";

// Booking interface matching backend
interface Booking {
  id: number;
  clientName: string;
  clientPhone: string;
  carPlate: string;
  carType: string;
  carDescription: string;
  serviceTypes: string[];
  servicePrice: number;
  date: string;
  location: string;
  locationLat: number;
  locationLng: number;
  status: string;
}

// Table headers
const headers = [
  { title: "Car Plate", value: "carPlate" },
  // { title: "Car Type", value: "carType" },
  { title: "Services", value: "serviceTypes" },
  { title: "Date", value: "date" },
  { title: "Price", value: "price" },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false }
];

const { formatCurrency } = useCurrency();

// Reactive states
const bookings = ref<Booking[]>([]);
const loading = ref(false);
const router = useRouter();

// Get logged-in username from localStorage
import { getSafeJson } from "@/utils/storage";
import API from "@/api/axios";
import { API_ENDPOINTS } from "@/utils/constants";
import { toast } from "@/utils/toast";
const loggedInUser = getSafeJson("userProfile", {});

// Report date range (default last 30 days)
const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const defaultEnd = () => new Date().toISOString().slice(0, 10);
const reportStartDate = ref(defaultStart());
const reportEndDate = ref(defaultEnd());
const exportLoading = ref(false);
const emailReportLoading = ref(false);

function exportCarWashReport() {
  if (!reportStartDate.value || !reportEndDate.value) return;
  exportLoading.value = true;
  API.get(API_ENDPOINTS.REPORTS_CARWASH_EXPORT, {
    params: { username: loggedInUser.username, startDate: reportStartDate.value, endDate: reportEndDate.value },
    responseType: "blob",
  })
    .then((res) => {
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `car-wash-history-${reportStartDate.value}-to-${reportEndDate.value}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded.");
    })
    .catch(() => toast.error("Export failed."))
    .finally(() => { exportLoading.value = false; });
}

function emailCarWashReport() {
  if (!reportStartDate.value || !reportEndDate.value) return;
  emailReportLoading.value = true;
  apiService
    .emailCarWashReport({
      username: loggedInUser.username,
      startDate: reportStartDate.value,
      endDate: reportEndDate.value,
    })
    .then(() => {})
    .catch(() => toast.error("Failed to send report email."))
    .finally(() => { emailReportLoading.value = false; });
}

const searchQuery = ref("");
function onSearch(q) {
  searchQuery.value = q;
}
const fetchBookings = async () => {
  loading.value = true;
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {};
    const response = await apiService.getCarWashBookingsByClient(loggedInUser.username, params);
    const data = Array.isArray(response.data) ? response.data : [];
    bookings.value = sortRequestsByStatus(data);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};
watch(searchQuery, () => fetchBookings());
// Redirect to payment

const payForRequest = async (request) => {

  router.push({
    name: "PaymentScreen",
    query: {
      bookingId: request.id,
      amount: request.servicePrice,
      clientUsername: getSafeJson("userProfile", {})?.username || "",
      carWashId: request.carWashId,
      jobDes: "Car wash service"
    }
  });


};

// Open directions in map view
const goToDirections = (booking: Booking) => {
  router.push({
    name: "Mapview",
    query: { lat: booking.locationLat, lng: booking.locationLng },

  });
};

// Fetch data on component mount
onMounted(fetchBookings);
</script>

<style scoped></style>
