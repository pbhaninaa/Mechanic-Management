<template>
  <PageContainer style="min-width: 100%;">
    <h1>Car Wash Dashboard</h1>
    <p>Welcome Car Wash, view your bookings and updates below.</p>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <p v-if="loadError" class="text-error text-center">{{ loadError }}</p>

    <!-- Stats Cards - same as Mechanic (Pending, Completed, Payments, Active) -->
    <v-row class="mt-4" dense v-if="!loading && !loadError">
      <v-col v-for="card in statsCards" :key="card.title" cols="12" sm="6" md="3">
        <v-card :color="card.color" class="pa-4">
          <v-card-title class="text-h6 white--text">{{ card.title }}</v-card-title>
          <v-card-text class="text-h5 white--text">{{ card.value }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pending Booking Requests Table - with Accept/Decline actions like Mechanic -->
    <v-card class="mt-6" outlined v-if="!loading && !loadError">
      <TableComponent
        title="Pending Booking Requests"
        :headers="tableHeaders"
        :items="pendingBookings"
        :items-per-page="5"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <div class="d-flex justify-center">
            <v-btn color="green" small @click="updateBookingStatus(item, 'accepted')">Accept</v-btn>
            <v-btn color="red" small class="ml-2" @click="updateBookingStatus(item, 'declined')">Decline</v-btn>
          </div>
        </template>
      </TableComponent>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import TableComponent from "@/components/TableComponent.vue";
import apiService from "@/api/apiService";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import { COLORS } from "@/utils/constants";

const loading = ref(false);
const loadError = ref<string | null>(null);
const allBookings = ref<any[]>([]);
const payments = ref<any[]>([]);

const { formatCurrency } = useCurrency();

// Same card titles & colors as Mechanic Dashboard
const statsCards = computed(() => [
  { title: "Pending Requests", value: pendingRequestsCount.value, color: COLORS.SOFT_ORANGE },
  { title: "Completed Jobs", value: carsWashedCount.value, color: COLORS.SOFT_GREEN_DARK },
  { title: "Payments", value: formatCurrency(revenueTotal.value), color: COLORS.SOFT_BLUE },
  { title: "Active Requests", value: activeJobsCount.value, color: COLORS.SOFT_PURPLE },
]);

// Computed stats from bookings & payments
const pendingBookings = computed(() =>
  allBookings.value.filter(
    (b) =>
      !b?.carWashId &&
      String(b?.status ?? "").toLowerCase() === "pending"
  )
);
const pendingRequestsCount = computed(() => pendingBookings.value.length);

const profile = getSafeJson("userProfile", {});
const userId = computed(() => String(profile?.id || ""));
const activeJobsCount = computed(() =>
  allBookings.value.filter(
    (b) =>
      String(b?.carWashId ?? "") === userId.value &&
      String(b?.status ?? "").toLowerCase() !== "completed"
  ).length
);

const carsWashedCount = computed(() =>
  payments.value.filter(
    (p: any) => String(p?.carWashId ?? "") === userId.value
  ).length
);
const revenueTotal = computed(() =>
  payments.value
    .filter((p: any) => String(p?.carWashId ?? "") === userId.value)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
);

// Table headers - same structure as Mechanic (Client, Description, Price, Date, Location, Actions)
const formatPrice = (item: any) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";

const formatBookingDesc = (item: any) => {
  const parts: string[] = [];
  if (item?.carType) parts.push(item.carType);
  if (item?.carDescription) parts.push(item.carDescription);
  if (Array.isArray(item?.serviceTypes) && item.serviceTypes.length)
    parts.push(item.serviceTypes.join(", "));
  return parts.length ? parts.join(" · ") : "—";
};

const tableHeaders = [
  { title: "Client", value: "clientUsername" },
  { title: "Request Description", value: "desc", formatter: formatBookingDesc },
  { title: "Price", value: "price", formatter: formatPrice },
  { title: "Date", value: "date" },
  { title: "Location", value: "location" },
  { title: "Actions", value: "actions", sortable: false },
];

const updateBookingStatus = async (booking: any, status: string) => {
  const bookingId = booking?.id;
  if (!bookingId) return;
  loadError.value = null;
  const userProfile = getSafeJson("userProfile", {});
  try {
    const payload = {
      ...booking,
      status,
      carWashId: status === "accepted" ? userProfile?.id : null,
    };
    await apiService.updateCarWashBooking(bookingId, payload);
    await loadDashboardData();
  } catch (err: any) {
    // Error shown in toast by axios interceptor - don't set loadError
    console.error("Failed to update booking:", err);
  }
};

const loadDashboardData = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    const [paymentsRes, bookingsRes] = await Promise.all([
      apiService.getAllPayments(),
      apiService.getAllCarWashBookings(),
    ]);
    payments.value = paymentsRes?.data ?? [];
    allBookings.value = bookingsRes?.data ?? [];
  } catch (err) {
    loadError.value = "Failed to load dashboard data.";
    console.error("Failed to load dashboard data:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.text-error {
  color: red;
  font-weight: 500;
}
</style>
