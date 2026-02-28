<template>
  <PageContainer style="min-width: 100%;">
    <h1>{{ config.title }}</h1>
    <p>{{ config.welcomeMsg }}</p>

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

    <!-- Pending Requests Table -->
    <v-card class="mt-6" outlined v-if="!loading && !error">
      <TableComponent
        :title="config.pendingTableTitle"
        :headers="tableHeaders"
        :items="pendingItems"
        :items-per-page="5"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <v-tooltip text="Accept" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" icon
                :loading="actionLoadingId === item.id"
                :disabled="!!actionLoadingId"
                @click="updateStatus(item, JOB_STATUS.ACCEPTED)">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
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
import { sortRequestsByStatus } from "@/utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import { formatDate } from "@/composables/useDateFormat";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";

const props = defineProps<{
  profile?: any;
  role?: string;
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const actionLoadingId = ref<string | number | null>(null);
const rawItems = ref<any[]>([]);
const payments = ref<any[]>([]);

const loggedInUser = getSafeJson("userProfile", {}) || props.profile || {};
const providerId = loggedInUser?.id;
const role = computed(() => props.role || loggedInUser?.roles?.[0] || "");

// Role-specific config
const config = computed(() => {
  const isMechanic = role.value === USER_ROLES.MECHANIC;
  return {
    title: isMechanic ? "Mechanic Dashboard" : "Car Wash Dashboard",
    welcomeMsg: isMechanic
      ? "Welcome Mechanic, view your jobs and updates below."
      : "Welcome Car Wash, view your bookings and updates below.",
    pendingTableTitle: isMechanic ? "Pending Job Requests" : "Pending Booking Requests",
    pendingLabel: isMechanic ? "Pending Jobs" : "Pending Bookings",
    completedLabel: isMechanic ? "Completed Jobs" : "Completed Washes",
    activeLabel: isMechanic ? "Active Requests" : "Active Bookings",
    revenueLabel: isMechanic ? "Total Earnings" : "Total Revenue",
  };
});

const { formatCurrency } = useCurrency();

// Normalized items (common shape: id, username, serviceDesc, date, servicePrice, status, providerId)
const normalizedItems = computed(() => {
  const isMechanic = role.value === USER_ROLES.MECHANIC;
  if (isMechanic) {
    return (rawItems.value || []).map((j) => ({
      ...j,
      username: j.username,
      providerId: j.mechanicId,
    }));
  }
  return (rawItems.value || []).map((b) => ({
    ...b,
    username: b.clientUsername,
    providerId: b.carWashId,
  }));
});

// Stats - unified logic
const myItems = computed(() =>
  normalizedItems.value.filter((i) => i.providerId === providerId)
);
const pendingCount = computed(() => {
  const isMechanic = role.value === USER_ROLES.MECHANIC;
  return normalizedItems.value.filter((i) => {
    if (isMechanic) return i.status === JOB_STATUS.PENDING;
    return !i.providerId && (i.status === JOB_STATUS.PENDING || !i.status);
  }).length;
});
const completedCount = computed(() =>
  myItems.value.filter((i) => i.status === JOB_STATUS.COMPLETED).length
);
const activeCount = computed(() => myItems.value.length);
const totalPaymentsAmount = computed(() =>
  payments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
);

const statsCards = computed(() => [
  { title: config.value.pendingLabel, value: pendingCount.value, color: COLORS.SOFT_ORANGE },
  { title: config.value.completedLabel, value: completedCount.value, color: COLORS.SOFT_GREEN_DARK },
  { title: config.value.revenueLabel, value: formatCurrency(totalPaymentsAmount.value), color: COLORS.SOFT_BLUE },
  { title: config.value.activeLabel, value: activeCount.value, color: COLORS.SOFT_PURPLE },
]);

// Table headers
const profile = getSafeJson("userProfile", {});
const isAdmin = (profile?.roles || []).includes(USER_ROLES.ADMIN);

const formatPrice = (item: any) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";

const formatServiceDesc = (item: any) => {
  const isMechanic = role.value === USER_ROLES.MECHANIC;
  if (isMechanic) {
    const parts = [item?.title, item?.category, item?.description].filter(Boolean);
    return parts.length ? parts.join(" · ") : (item?.description || "—");
  }
  const parts = [
    item?.carType,
    item?.carPlate ? `Plate: ${item.carPlate}` : null,
    item?.carDescription,
    item?.serviceTypes?.length ? item.serviceTypes.join(", ") : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};

const tableHeaders = computed(() => {
  const descTitle = role.value === USER_ROLES.MECHANIC
  ? "Request Description"
  : "Booking Description";

const base = [
  { title: "Client", value: "username" },
  { title: descTitle, value: "serviceDesc", formatter: formatServiceDesc },
  { title: "Price", value: "price", formatter: formatPrice },  
  { title: "Car Type", value: "carType" },
  { title: "Car Plate", value: "carPlate" },
  { title: "Date", value: "date", formatter: (item: any) => formatDate(item?.date) },
  { title: "Call Out Service",     value: "callOut",     formatter: (item: any) => item?.callOutService ? "Yes" : "No"   },
  role.value === USER_ROLES.MECHANIC ? {title:"Includes Towing",value:"towing",formatter: (item: any) => item?.towing ? "Yes" : "No"} : null,
  { title: "Actions", value: "actions", sortable: false },
].filter(Boolean); // removes the null for non-mechanic roles
  if (isAdmin) {
    base.splice(4, 0, {
      title: "Phone",
      value: "phoneNumber",
      formatter: (item: any) => item?.phoneNumber || "—",
    });
  }
  return base;
});

// Pending items for table
const pendingItems = computed(() => {
  const isMechanic = role.value === USER_ROLES.MECHANIC;
  const filtered = normalizedItems.value.filter((i) => {
    if (isMechanic) return i.status === JOB_STATUS.PENDING;
    return !i.providerId && (i.status === JOB_STATUS.PENDING || !i.status);
  });
  return filtered.slice(0, 5);
});

const updateStatus = async (item: any, status: string) => {
  if (actionLoadingId.value) return;
  actionLoadingId.value = item.id;
  try {
    const isMechanic = role.value === USER_ROLES.MECHANIC;
    if (isMechanic) {
      const payload = {
        ...item,
        status,
        mechanicId: status === JOB_STATUS.ACCEPTED ? providerId : null,
      };
      await apiService.updateRequestMechanic(payload);
    } else {
      const payload = {
        ...item,
        status,
        carWashId: status === JOB_STATUS.ACCEPTED ? providerId : null,
      };
      await apiService.updateCarWashBooking(item.id, payload);
    }
    item.status = status;
    item.providerId = status === JOB_STATUS.ACCEPTED ? providerId : null;
  } catch (err: any) {
    console.error("Failed to update status:", err);
  } finally {
    actionLoadingId.value = null;
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const isMechanic = role.value === USER_ROLES.MECHANIC;
    if (isMechanic) {
      const [res, payRes] = await Promise.all([
        apiService.getAllRequestHistory(),
        providerId ? apiService.getPaymentsByMechanic(providerId) : Promise.resolve({ data: [] }),
      ]);
      const data = Array.isArray(res.data) ? res.data : [];
      rawItems.value = sortRequestsByStatus(data);
      payments.value = Array.isArray(payRes.data) ? payRes.data : [];
    } else {
      const [bookingsRes, paymentsRes] = await Promise.all([
        apiService.getAllCarWashBookings(),
        providerId ? apiService.getPaymentsByCarWash(providerId) : Promise.resolve({ data: [] }),
      ]);
      const data = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      rawItems.value = sortRequestsByStatus(data);
      payments.value = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
    }
  } catch (err) {
    error.value = "Failed to load data.";
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
