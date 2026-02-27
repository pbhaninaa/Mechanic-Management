<template>
  <PageContainer>

    <v-card-text>
      <TableComponent title="My Car Wash History" :headers="headers" :items="bookings" 
        :items-per-page="10" :loading="loading">


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
import { ref, onMounted } from "vue";
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
const loggedInUser = getSafeJson("userProfile", {});

// Fetch client bookings
const fetchBookings = async () => {
  loading.value = true;
  try {
    const response = await apiService.getCarWashBookingsByClient(loggedInUser.username);
    const data = Array.isArray(response.data) ? response.data : [];
    bookings.value = sortRequestsByStatus(data);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};
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
