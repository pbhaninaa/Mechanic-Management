<template>
  <PageContainer style="min-width: 100%;">
    <h1>Car Wash Dashboard</h1>
    <p>Welcome Car Wash, view your bookings and updates below.</p>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <p v-if="error" class="text-error text-center">{{ error }}</p>

    <!-- Stats Cards with colors -->
    <v-row class="mt-4" dense v-if="!loading && !error">
      <v-col v-for="card in statsCards" :key="card.title" cols="12" sm="6" md="3">
        <v-card :color="card.color" class="pa-4">
          <v-card-title class="text-h6 white--text">{{ card.title }}</v-card-title>
          <v-card-text class="text-h5 white--text">{{ card.value }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pending Booking Requests Table -->
    <v-card class="mt-6" outlined v-if="!loading && !error">
      <TableComponent
        title="Pending Booking Requests"
        :headers="tableHeaders"
        :items="pendingBookingRequests"
        :items-per-page="5"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <div class="d-flex justify-center">
            <v-btn
              color="green"
              small
              :loading="actionLoadingId === item.id"
              :disabled="!!actionLoadingId"
              @click="updateBookingStatus(item, JOB_STATUS.ACCEPTED)"
            >Accept</v-btn>
            <v-btn
              color="red"
              small
              class="ml-2"
              :loading="actionLoadingId === item.id"
              :disabled="!!actionLoadingId"
              @click="updateBookingStatus(item, JOB_STATUS.DECLINED)"
            >Decline</v-btn>
          </div>
        </template>
      </TableComponent>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS, COLORS, USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import { formatDate } from "@/composables/useDateFormat";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";

const loading = ref(false);
const error = ref<string | null>(null);
const actionLoadingId = ref<string | number | null>(null);
const bookings = ref<any[]>([]);
const payments = ref<any[]>([]);

interface Booking {
  id: string;
  clientUsername: string;
  carWashId: string | null;
  carPlate: string;
  carType: string;
  carDescription: string;
  serviceTypes?: string[];
  date: string;
  status: string;
  servicePrice?: number;
}

const { formatCurrency } = useCurrency();
const loggedInUser = getSafeJson("userProfile", {});
const carWashId = loggedInUser?.id;

// Stats cards data (same structure as Mechanic Dashboard)
const statsCards = computed(() => [
  { title: "Pending Bookings", value: pendingBookings.value, color: COLORS.SOFT_ORANGE },
  { title: "Completed Washes", value: completedWashes.value, color: COLORS.SOFT_GREEN_DARK },
  { title: "Payments", value: formatCurrency(totalPayments.value), color: COLORS.SOFT_BLUE },
  { title: "Active Bookings", value: activeBookings.value, color: COLORS.SOFT_PURPLE },
]);

// Table headers - same structure as Mechanic (Client, Description, Price, Date, Actions)
const profile = getSafeJson("userProfile", {});
const isAdmin = (profile?.roles || []).includes(USER_ROLES.ADMIN);

const formatPrice = (item: any) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";

const formatBookingDesc = (item: any) => {
  const parts = [
    item?.carType,
    item?.carPlate ? `Plate: ${item.carPlate}` : null,
    item?.carDescription,
    item?.serviceTypes?.length ? item.serviceTypes.join(", ") : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};

const tableHeaders = computed(() => {
  const base = [
    { title: "Client", value: "username" },
    { title: "Booking Description", value: "serviceDesc", formatter: formatBookingDesc },
    { title: "Price", value: "price", formatter: formatPrice },
    { title: "Date", value: "date", formatter: (item: any) => formatDate(item?.date) },
    { title: "Actions", value: "actions", sortable: false },
  ];
  if (isAdmin) {
    base.splice(4, 0, {
      title: "Phone",
      value: "phoneNumber",
      formatter: (item: any) => item?.phoneNumber || "—",
    });
  }
  return base;
});

// Computed stats - mirror Mechanic logic for car wash
const myBookings = computed(() =>
  bookings.value.filter((b) => b.carWashId === carWashId)
);
const pendingBookings = computed(() =>
  bookings.value.filter((b) => !b.carWashId && (b.status === JOB_STATUS.PENDING || !b.status)).length
);
const completedWashes = computed(() =>
  myBookings.value.filter((b) => b.status === JOB_STATUS.COMPLETED).length
);
const activeBookings = computed(() => myBookings.value.length);
const totalPayments = computed(() =>
  payments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
);

// Pending = unassigned (no carWashId), status pending - same pattern as Mechanic
const pendingBookingRequests = computed(() =>
  bookings.value
    .filter((b) => !b.carWashId && (b.status === JOB_STATUS.PENDING || !b.status))
    .map((b) => ({
      ...b,
      username: b.clientUsername,
    }))
    .slice(0, 5)
);

const updateBookingStatus = async (booking: Booking, status: string) => {
  if (actionLoadingId.value) return;
  actionLoadingId.value = booking.id;
  try {
    const payload = {
      ...booking,
      status,
      carWashId: status === JOB_STATUS.ACCEPTED ? carWashId : null,
    };
    await apiService.updateCarWashBooking(booking.id, payload);
    booking.status = status;
    booking.carWashId = status === JOB_STATUS.ACCEPTED ? carWashId : null;
  } catch (err: any) {
    console.error("Failed to update booking status:", err);
  } finally {
    actionLoadingId.value = null;
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const bookingsRes = await apiService.getAllCarWashBookings();
    const allBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
    bookings.value = allBookings;

    if (carWashId) {
      const paymentsRes = await apiService.getPaymentsByCarWash(carWashId);
      payments.value = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
    } else {
      payments.value = [];
    }
  } catch (err) {
    error.value = "Failed to load bookings.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.text-error {
  color: red;
  font-weight: 500;
}
</style>
