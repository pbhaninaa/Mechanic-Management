<template>
  <PageContainer>

    <v-card-text>
      <TableComponent title="My Car Wash History" :headers="headers" :items="bookings" 
        :items-per-page="5" :loading="loading">


        <template #item.serviceTypes="{ item }">
          {{ item.serviceTypes.join(", ") }}
        </template>

        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        <template #item.price="{ item }">
          ${{ item.servicePrice.toFixed(2) }}
        </template>
        <template #item.location="{ item }">
          {{ truncateLocation(item.location) }}
        </template>
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn small color="green" :disabled="item.status.toLowerCase() !== 'accepted'" @click="payForRequest(item)">
            Pay
          </v-btn>
          <v-btn v-if="false" small color="blue" :disabled="item.status.toLowerCase() !== 'accepted'"
            @click="goToDirections(item)">
            Directions
          </v-btn>
        </template>

        <template #no-data>
          You have no past car washes.
        </template>
      </TableComponent>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { format } from "date-fns";
import apiService from "@/api/apiService";
import { getStatusColor } from "@/utils/helper";
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
  { title: "Location", value: "location" },
  { title: "Status", value: "status" },
  { title: "Actions", value: "actions", sortable: false }
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
const truncateLocation = (location: string) => {
  const parts = location.split(",");
  if (parts.length > 3) {
    return parts.slice(0, 3).join(",") + ", ...";
  }
  return location;
};
// Format date for table
const formatDate = (dateStr: string) => format(new Date(dateStr), "dd MMM yyyy");

// Redirect to payment

const payForRequest = async (request) => {

  router.push({
    name: "PaymentScreen",
    query: {
      bookingId: request.id,
      amount: request.servicePrice,
      clientUsername: JSON.parse(localStorage.getItem("userProfile") || "{}").username || "",
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
