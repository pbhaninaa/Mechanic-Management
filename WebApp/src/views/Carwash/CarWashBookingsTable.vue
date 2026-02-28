<template>
  <PageContainer>
    <v-card-text>
      <TableComponent
        title="Car Wash Bookings"
        :headers="headers"
        :items="bookings"
        :items-per-page="10"
        :loading="loading"
        show-search
        search-placeholder="Search plate, client, status..."
        @update:search-value="onSearch"
      >
        <!-- Service Types as comma-separated string -->
        <template #item.serviceTypes="{ item }">
          {{ item.serviceTypes.join(", ") }}
        </template>

        <!-- Date formatting -->
        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <!-- Status column with colored chips -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Minimal action buttons -->
        <template #item.actions="{ item }">
          <v-tooltip text="Accept" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" icon
                :loading="actionLoadingId === item.id"
                :disabled="item.status === JOB_STATUS.COMPLETED || item.status === JOB_STATUS.ACCEPTED || !!actionLoadingId"
                @click="onAcceptClick(item)">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </TableComponent>
    </v-card-text>

    <!-- Admin: Select car wash popup when accepting -->
    <v-dialog v-model="assignDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>Assign Car Wash</v-card-title>
        <v-card-text>
          <p class="mb-4">Select the car wash operator who will handle this booking:</p>
          <v-select
            v-model="selectedCarWashId"
            :items="carWashOptions"
            item-title="label"
            item-value="id"
            label="Choose car wash"
            variant="outlined"
            :loading="carWashesLoading"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="assignDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="assignLoading" :disabled="!selectedCarWashId" @click="confirmAssign">Assign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { getStatusColor, sortRequestsByStatus } from "@/utils/helper";
import { JOB_STATUS } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import { getSafeJson } from "@/utils/storage";
import { formatDate } from "@/composables/useDateFormat";
import { useCurrency } from "@/composables/useCurrency";
interface Booking {
  id: number;
  clientUsername: string;
  carWashId: number | string | null;
  carPlate: string;
  carType: string;
  carDescription: string;
  location: string;
  date: string;
  status: string;
  servicePrice: number;
  serviceTypes: string[];
  createdAt: string;
}

const bookings = ref<Booking[]>([]);
const loading = ref(false);
const actionLoadingId = ref<string | number | null>(null);
const assignLoading = ref(false);
const loggedInUser = getSafeJson("userProfile", {});
const isAdmin = () => (loggedInUser?.roles?.[0]?.toLowerCase?.() ?? "") === "admin";

// Admin assign car wash dialog
const assignDialog = ref(false);
const bookingToAssign = ref<Booking | null>(null);
const selectedCarWashId = ref<string | number | null>(null);
const carWashesLoading = ref(false);
const carWashOptions = ref<{ id: string; label: string }[]>([]);
const { formatCurrency } = useCurrency();
const formatPrice = (item: any) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";
const headers = [
  { title: "Client Username", value: "clientUsername" },
  { title: "Car Plate", value: "carPlate" },
  { title: "Car Type", value: "carType" },
  { title: "Car Description", value: "carDescription" },
{title:"Price", value:"servicePrice",formatter: formatPrice},
  { title: "Service Types", value: "serviceTypes" },
  { title: "Date", value: "date" },
  { title: "Call Out Service", value: "callOut", formatter: (item: any) => item?.callOutService ? "Yes" : "No" },
  { title: "Status", value: "status" },  { title: "Actions", value: "actions", sortable: false },
];

const fetchCarWashes = async () => {
  carWashesLoading.value = true;
  try {
    const res = await apiService.getProfilesByRole("CARWASH");
    const profiles = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
    carWashOptions.value = profiles
      .filter((p: any) => p?.id != null)
      .map((p: any) => ({
        id: String(p.id),
        label: `${p.firstName || ""} ${p.lastName || ""} (${p.username || p.email || "—"})`.trim() || `Car Wash #${p.id}`,
      }));
  } catch (err) {
    console.error("Failed to fetch car washes:", err);
    carWashOptions.value = [];
  } finally {
    carWashesLoading.value = false;
  }
};

const onAcceptClick = (booking: Booking) => {
  if (isAdmin()) {
    bookingToAssign.value = booking;
    selectedCarWashId.value = null;
    assignDialog.value = true;
    fetchCarWashes();
  } else {
    updateStatus(booking, JOB_STATUS.ACCEPTED);
  }
};

const confirmAssign = async () => {
  if (!bookingToAssign.value || !selectedCarWashId.value) return;
  assignLoading.value = true;
  try {
    await updateStatus(bookingToAssign.value, JOB_STATUS.ACCEPTED, String(selectedCarWashId.value));
    assignDialog.value = false;
    bookingToAssign.value = null;
    selectedCarWashId.value = null;
    fetchBookings();
  } finally {
    assignLoading.value = false;
  }
};

const searchQuery = ref("");
function onSearch(q) {
  searchQuery.value = q;
}
const fetchBookings = async () => {
  loading.value = true;
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {};
    const res = await apiService.getAllCarWashBookings(params);
    const allBookings = Array.isArray(res.data) ? res.data : [];

    let list;
    if (isAdmin()) {
      list = allBookings;
    } else {
      const userId = String(loggedInUser.id);
      list = allBookings.filter(booking => {
        const bookingCarWashId = String(booking.carWashId ?? "");
        if (booking.status === JOB_STATUS.ACCEPTED) {
          return bookingCarWashId === userId;
        }
        
        return bookingCarWashId !== userId;
      });
    }
    bookings.value = sortRequestsByStatus(list);
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};
watch(searchQuery, () => fetchBookings());

const updateStatus = async (booking: Booking, status: string, carWashIdOverride?: string) => {
  if (actionLoadingId.value && !carWashIdOverride) return;
  if (!carWashIdOverride) actionLoadingId.value = booking.id;

  const previousStatus = booking.status;
  const previousCarWashId = booking.carWashId;
  booking.status = status;
  booking.carWashId = carWashIdOverride ?? String(loggedInUser.id);

  try {
    await apiService.updateCarWashBooking(booking.id, booking);
  } catch (err) {
    console.error("Failed to update status:", err);
    booking.status = previousStatus;
    booking.carWashId = previousCarWashId;
  } finally {
    if (!carWashIdOverride) actionLoadingId.value = null;
  }
};



onMounted(fetchBookings);
</script>
