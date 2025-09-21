<template>
  <PageContainer>
      <v-card-title>Car Wash Bookings</v-card-title>
      <v-card-text>
        <p>See all booking requests from clients.</p>

        <v-data-table
          :headers="headers"
          :items="bookings"
          class="elevation-1"
          :items-per-page="5"
          :loading="loading"
        >
          <!-- Location column with truncation -->
          <template #item.location="{ item }">
            <TooltipText :text="item.location" :maxLength="50" />
          </template>

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
            <v-btn
              variant="text"
              size="small"
              color="green"
              class="mr-1"
              @click="updateStatus(item, JOB_STATUS.ACCEPTED)"
              :disabled="item.status === JOB_STATUS.ACCEPTED"
            >
              <v-icon size="18">mdi-check</v-icon>
            </v-btn>

            <v-btn
            v-if="false"
              variant="text"
              size="small"
              color="red"
              @click="updateStatus(item, JOB_STATUS.DECLINED)"
              :disabled="item.status === JOB_STATUS.DECLINED"
            >
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <div v-if="bookings.length === 0 && !loading" class="mt-3">
          No bookings found.
        </div>
      </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import TooltipText from "@/components/TooltipText.vue";
import apiService from "@/api/apiService";
import { getStatusColor } from "@/utils/helper";
import { JOB_STATUS } from "@/utils/constants";

interface Booking {
  id: number;
  clientUsername: string;
  carWashId: number | null;
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

const headers = [
  { text: "Client Username", value: "clientUsername" },
  { text: "Car Plate", value: "carPlate" },
  { text: "Car Type", value: "carType" },
  { text: "Car Description", value: "carDescription" },
  { text: "Service Types", value: "serviceTypes" },
  { text: "Date", value: "date" },
  { text: "Location", value: "location" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false },
];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleString();
};

const fetchBookings = async () => {
  loading.value = true;
  try {
    const res = await apiService.getAllCarWashBookings();
    const allBookings = Array.isArray(res.data) ? res.data : [];

    const userId = String(loggedInUser.id);

    bookings.value = allBookings.filter(booking => {
      const bookingCarWashId = String(booking.carWashId);

      if (booking.status === JOB_STATUS.ACCEPTED) {
        // Only include if carWashId matches logged-in user
        return bookingCarWashId === userId;
      } else {
        // Include all other statuses only if carWashId is not the logged-in user
        return bookingCarWashId !== userId;
      }
    });
  } catch (err) {
    console.error("Failed to fetch bookings:", err);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};


const loggedInUser =JSON.parse( localStorage.getItem("userProfile"))
const updateStatus = async (booking: Booking, status: string) => {
  const previousStatus = booking.status;
  booking.status = status; 
  booking.carWashId= loggedInUser.id

  try {
    await apiService.updateCarWashBooking(booking.id, booking);
    console.log(`Booking ${booking.id} status updated to ${status}`);
  } catch (err) {
    console.error("Failed to update status:", err);
    booking.status = previousStatus; 
  }
};



onMounted(fetchBookings);
</script>
