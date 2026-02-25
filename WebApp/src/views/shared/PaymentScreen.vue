<template>
  <PageContainer>
    <v-card class="mx-auto my-6" max-width="500" outlined>
      <v-card-title class="text-h6">Payment</v-card-title>
      <v-card-text>
        <p class="mb-4">Complete your payment for the service below:</p>

        <v-alert type="info" density="compact" class="mb-4">
          Payment confirms your booking. For Card, Bank Transfer, and Mobile Money, details are for record-keeping only—no actual charge is processed. Complete payment to confirm your service.
        </v-alert>

        <!-- Payment Summary -->
        <v-card outlined class="pa-4 mb-4">
          <div class="d-flex justify-space-between mb-2">
            <span>Client Name:</span>
            <strong>{{ clientUsername }}</strong>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span>Booking ID:</span>
            <strong>{{ bookingId }}</strong>
          </div>
          <div class='d-flex justify-space-between mb-2'>
            <span>Job Description:</span>
            <strong>{{ jobDes }}</strong>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span>Amount:</span>
            <strong>R {{ amount.toFixed(2) }}</strong>
          </div>
        </v-card>

        <!-- Payment Method -->
        <v-select v-model="paymentMethod" :items="paymentMethods" label="Select Payment Method" outlined required />

        <!-- Card Info -->
        <div v-if="paymentMethod === 'Card'" class="mt-4">
          <InputField v-model="cardNumber" label="Card Number" type="text" required />
          <div class="d-flex mt-2">
            <InputField v-model="expiry" label="Expiry MM/YY" type="text" class="mr-2" required />
            <InputField v-model="cvv" label="CVV" type="password" required />
          </div>
          <InputField v-model="cardHolder" label="Cardholder Name" type="text" required class="mt-2" />
        </div>

      </v-card-text>

      <v-card-actions class="d-flex justify-center">
        <Button label="Confirm Payment" color="primary" :loading="loading" :disabled="!isFormValid || loading" @click="processPayment" />
      </v-card-actions>
    </v-card>

    <!-- Success Snackbar -->
    <v-snackbar v-model="paymentSuccess" timeout="4000" color="green">
      Payment successful!
      <template #action="{ attrs }">
        <v-btn text v-bind="attrs" @click="paymentSuccess = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Error Snackbar -->
    <v-snackbar v-model="paymentError" timeout="5000" color="red">
      {{ errorMessage || "Payment failed. Try again." }}
      <template #action="{ attrs }">
        <v-btn text v-bind="attrs" @click="paymentError = false">Close</v-btn>
      </template>
    </v-snackbar>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer.vue';
import InputField from '@/components/InputField.vue';
import Button from '@/components/Button.vue';
import apiService from '@/api/apiService';
import { JOB_STATUS } from '@/utils/constants';

// Router
const route = useRoute();
const router = useRouter();

// Query params
const bookingId = (route.query.bookingId as string) || '';
const jobDes = (route.query.jobDes as string) || '';
const amount = parseFloat((route.query.amount as string) || '0');
const clientUsername = (route.query.clientUsername as string) || '';
const mechanicId = Number(route.query.mechanicId) || 0;
const carWashId = Number(route.query.carWashId) || 0;

// Payment state
const paymentMethod = ref<'Card' | 'Bank Transfer' | 'Mobile Money'>('Card');
const paymentMethods = ['Card', 'Bank Transfer', 'Mobile Money'];
const cardNumber = ref('');
const expiry = ref('');
const cvv = ref('');
const cardHolder = ref('');

const loading = ref(false);
const paymentSuccess = ref(false);
const paymentError = ref(false);
const errorMessage = ref("");

// Form validation (card details optional—payment is confirmation only)
const isFormValid = computed(() => {
  if (!bookingId || !amount || !clientUsername || !paymentMethod.value) return false;
  return true;
});

// Process payment (double-submit protected via loading state)
const processPayment = async () => {
  if (loading.value) return;
  loading.value = true;
  paymentError.value = false;
  paymentSuccess.value = false;

  try {
    const paymentPayload: any = {
      jobId: Number(bookingId),
      amount: amount,
      clientUsername: clientUsername,
    };

    let job: any = null;

    if (jobDes.toLowerCase() !== "car wash service") {
      paymentPayload.mechanicId = mechanicId;
      const mechanicRes = await apiService.getMechanicRequestsById(bookingId);
      job = mechanicRes?.data ?? mechanicRes;
    } else {
      paymentPayload.carWashId = carWashId;
      const carWashRes = await apiService.getCarWashBookingById(bookingId);
      job = carWashRes?.data ?? carWashRes;
    }

    const res = await apiService.createPayment(paymentPayload);

    if (res && res.statusCode === 200) {
      job.status = JOB_STATUS.PAID;
      if (jobDes.toLowerCase() === "car wash service") {
        await apiService.updateCarWashBooking(job.id, job);
      } else {
        await apiService.updateRequestMechanic(job);
      }

      paymentSuccess.value = true;

      router.push({
        name: "Payments",
        query: { bookingId },
      });
    } else {
      throw new Error(res?.message || "Payment was not successful");
    }
  } catch (err: any) {
    const msg = err?.message || err?.response?.data?.message || "Payment failed. Please try again.";
    paymentError.value = true;
    errorMessage.value = msg;
  } finally {
    loading.value = false;
  }
};



</script>

<style scoped>
.v-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
