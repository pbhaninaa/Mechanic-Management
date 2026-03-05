<template>
  <PageContainer>
    <v-card-text>
      <v-alert v-if="tableError" type="error" density="compact" class="mb-3" closable @click:close="tableError = ''">
        {{ tableError }}
      </v-alert>

      <TableComponent
        title="Car Wash Bookings"
        :headers="headers"
        :items="bookings"
        :items-per-page="10"
        :loading="loading"
        no-data-message="No data."
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
          <template v-if="isAdmin()">
            <v-tooltip text="Edit" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="primary" icon
                  :disabled="!!actionLoadingId" @click="openEditBooking(item)">
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="error" icon
                  :disabled="!!actionLoadingId" @click="confirmDeleteBooking(item)">
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
        </template>
      </TableComponent>
    </v-card-text>

    <!-- Call-out confirmation: provider must confirm they can travel to the client -->
    <v-dialog v-model="calloutConfirmDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">Confirm you can fulfil this booking</v-card-title>
        <v-card-text>
          <p class="mb-2">This is a call-out booking. You will need to travel to the client's location.</p>
          <p class="text-medium-emphasis text-body2">Only accept if you have a vehicle and can travel to the client's location.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelCalloutConfirm">Cancel</v-btn>
          <v-btn color="primary" :loading="calloutConfirmLoading" @click="proceedAfterCalloutConfirm">Yes, I can do this</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin: Edit booking dialog -->
    <v-dialog v-model="editBookingDialog" max-width="560" persistent>
      <v-card>
        <v-card-title>Edit booking</v-card-title>
        <v-card-text>
          <InputField v-model="editForm.status" label="Status" />
          <InputField v-model="editForm.date" label="Date" type="date" />
          <InputField v-model="editForm.carPlate" label="Car plate" />
          <InputField v-model="editForm.carType" label="Car type" />
          <InputField v-model="editForm.location" label="Location" />
          <InputField v-model.number="editForm.servicePrice" label="Service price" type="number" min="0" step="0.01" />
          <v-checkbox v-model="editForm.callOutService" label="Call-out service" hide-details class="mt-2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editBookingDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="editSaveLoading" @click="saveEditBooking">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin: Delete booking confirmation -->
    <v-dialog v-model="deleteBookingDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>Delete booking?</v-card-title>
        <v-card-text>This cannot be undone. The booking will be removed.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteBookingDialog = false; bookingToDelete = null">Cancel</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="doDeleteBooking">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import InputField from "@/components/InputField.vue";
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
  callOutService?: boolean;
  createdAt: string;
}

const bookings = ref<Booking[]>([]);
const loading = ref(false);
const tableError = ref("");
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

// Admin: Edit booking
const editBookingDialog = ref(false);
const editSaveLoading = ref(false);
const editForm = ref({
  id: "" as string | number,
  status: "",
  date: "",
  carPlate: "",
  carType: "",
  location: "",
  servicePrice: 0,
  callOutService: false,
});

// Admin: Delete booking
const deleteBookingDialog = ref(false);
const deleteLoading = ref(false);
const bookingToDelete = ref<Booking | null>(null);

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

const needsCalloutConfirm = (booking: Booking) => !!booking?.callOutService;

const calloutConfirmDialog = ref(false);
const calloutConfirmLoading = ref(false);
const pendingAcceptBooking = ref<Booking | null>(null);
const pendingAssignCarWashId = ref<string | number | null>(null);

function cancelCalloutConfirm() {
  calloutConfirmDialog.value = false;
  pendingAcceptBooking.value = null;
  pendingAssignCarWashId.value = null;
}

async function proceedAfterCalloutConfirm() {
  const booking = pendingAcceptBooking.value;
  const carWashId = pendingAssignCarWashId.value;
  if (!booking) {
    cancelCalloutConfirm();
    return;
  }
  calloutConfirmLoading.value = true;
  try {
    await updateStatus(booking, JOB_STATUS.ACCEPTED, carWashId != null ? String(carWashId) : undefined);
    assignDialog.value = false;
    bookingToAssign.value = null;
    selectedCarWashId.value = null;
    fetchBookings();
  } finally {
    calloutConfirmLoading.value = false;
    cancelCalloutConfirm();
  }
}

const onAcceptClick = (booking: Booking) => {
  if (isAdmin()) {
    bookingToAssign.value = booking;
    selectedCarWashId.value = null;
    assignDialog.value = true;
    fetchCarWashes();
  } else {
    if (needsCalloutConfirm(booking)) {
      pendingAcceptBooking.value = booking;
      pendingAssignCarWashId.value = null;
      calloutConfirmDialog.value = true;
    } else {
      updateStatus(booking, JOB_STATUS.ACCEPTED);
    }
  }
};

const confirmAssign = async () => {
  if (!bookingToAssign.value || !selectedCarWashId.value) return;
  if (needsCalloutConfirm(bookingToAssign.value)) {
    pendingAcceptBooking.value = bookingToAssign.value;
    pendingAssignCarWashId.value = selectedCarWashId.value;
    calloutConfirmDialog.value = true;
    return;
  }
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
  tableError.value = "";
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
  } catch (err: any) {
    tableError.value = err?.message || "Failed to load bookings.";
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

function openEditBooking(booking: Booking) {
  editForm.value = {
    id: booking.id,
    status: booking.status ?? "",
    date: booking.date ?? "",
    carPlate: booking.carPlate ?? "",
    carType: booking.carType ?? "",
    location: booking.location ?? "",
    servicePrice: Number(booking.servicePrice) || 0,
    callOutService: !!booking.callOutService,
  };
  editBookingDialog.value = true;
}

async function saveEditBooking() {
  const id = editForm.value.id;
  const b = bookings.value.find((x) => String(x.id) === String(id));
  if (!b) return;
  editSaveLoading.value = true;
  try {
    const payload = {
      ...b,
      status: editForm.value.status,
      date: editForm.value.date,
      carPlate: editForm.value.carPlate,
      carType: editForm.value.carType,
      location: editForm.value.location,
      servicePrice: editForm.value.servicePrice,
      callOutService: editForm.value.callOutService,
    };
    await apiService.updateCarWashBooking(b.id, payload);
    Object.assign(b, payload);
    editBookingDialog.value = false;
    fetchBookings();
  } catch (err) {
    console.error("Failed to update booking:", err);
  } finally {
    editSaveLoading.value = false;
  }
}

function confirmDeleteBooking(booking: Booking) {
  bookingToDelete.value = booking;
  deleteBookingDialog.value = true;
}

async function doDeleteBooking() {
  const b = bookingToDelete.value;
  if (!b) return;
  deleteLoading.value = true;
  try {
    await apiService.deleteCarWashBooking(b.id);
    deleteBookingDialog.value = false;
    bookingToDelete.value = null;
    fetchBookings();
  } catch (err) {
    console.error("Failed to delete booking:", err);
  } finally {
    deleteLoading.value = false;
  }
}

onMounted(fetchBookings);
</script>
