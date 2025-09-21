<template>
  <PageContainer>
    <v-card-title>My Car Wash History</v-card-title>

    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="bookings"
        :loading="loading"
        class="elevation-1"
      >
        <!-- Services column with chips and tooltip -->
        <template #item.serviceTypes="{ item }">
          <div class="d-flex align-center">
            <v-chip v-if="item.serviceTypes.length" small outlined class="ma-1">
              {{ item.serviceTypes[0] }}
            </v-chip>

            <div v-if="item.serviceTypes.length > 1">
              <v-tooltip bottom>
                <template #activator="{ props }">
                  <v-chip v-bind="props" small outlined class="ma-1">
                    +{{ item.serviceTypes.length - 1 }} more
                  </v-chip>
                </template>
                <div class="pa-2" style="max-width: 250px; white-space: pre-line;">
                  {{ item.serviceTypes.slice(1).join('\n') }}
                </div>
              </v-tooltip>
            </div>
          </div>
        </template>

        <!-- Date formatting -->
        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <!-- Price formatting -->
        <template #item.price="{ item }">
          R {{ (item.servicePrice || 0).toFixed(2) }}
        </template>

        <!-- Status with Pay & Directions buttons -->
        <template #item.status="{ item }">
          <div class="d-flex align-center">
        <!-- Status column -->
            <v-chip class="mr-4" :color="getStatusColor(item.status)" dark>
              {{ item.status }}
            </v-chip>

            <!-- Pay button if status is accepted             -->
            <v-btn 
             v-if="item.status === JOB_STATUS.ACCEPTED"
              color="primary"
              size="small"
              class="mr-2"
              @click="payForRequest(item)"
            >
              Pay
            </v-btn>

            <!-- Directions button -->
            <v-btn
              color="green"
              size="small"
              @click="goToDirections(item)"
            >
              Directions
            </v-btn>
          </div>
        </template>

        <template #no-data>
          No bookings found.
        </template>
      </v-data-table>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { format } from "date-fns";
import apiService from "@/api/apiService";
import { getStatusColor } from "@/utils/helper";
import {useRouter} from 'vue-router'
import { JOB_STATUS } from "@/utils/constants";

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
  { text: "Car Plate", value: "carPlate" },
  { text: "Car Type", value: "carType" },
  { text: "Services", value: "serviceTypes" },
  { text: "Date", value: "date" },
  { text: "Price", value: "price" },
  { text: "Location", value: "location" },
  { text: "Status", value: "status" },
];

// Reactive states
const bookings = ref<Booking[]>([]);
const loading = ref(false);
const router = useRouter();

// Get logged-in username from localStorage
const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");

// Fetch client bookings
const fetchBookings = async () => {
  loading.value = true;
  try {
    const response = await apiService.getCarWashBookingsByClient(loggedInUser.username);
    bookings.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};

// Format date for table
const formatDate = (dateStr: string) => format(new Date(dateStr), "dd MMM yyyy");

// Redirect to payment

const payForRequest = async (request) => {

  router.push({
    name:"PaymentScreen",
    query:{
      bookingId:request.id,
      amount:request.servicePrice,
      clientUsername:JSON.parse(localStorage.getItem("userProfile")||"{}").username||"",
      carWashId:request.carWashId,
      jobDes:"Car wash service"
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

<style scoped>
.v-data-table th {
  font-weight: 600;
}
</style>
