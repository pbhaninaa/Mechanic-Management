<template>
  <PageContainer>
    <v-card class="mx-auto my-6" max-width="500" outlined>
      <v-card-title class="text-h6">Payment</v-card-title>
      <v-card-text>
        <p class="mb-4">Complete your payment for the service below:</p>

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
        <v-select
          v-model="paymentMethod"
          :items="paymentMethods"
          label="Select Payment Method"
          outlined
          required
        />

        <!-- Card Info -->
        <div v-if="paymentMethod === 'Card'" class="mt-4">
          <InputField v-model="cardNumber" label="Card Number" type="text" required />
          <div class="d-flex mt-2">
            <InputField v-model="expiry" label="Expiry MM/YY" type="text" class="mr-2" required />
            <InputField v-model="cvv" label="CVV" type="password" required />
          </div>
          <InputField v-model="cardHolder" label="Cardholder Name" type="text" required class="mt-2"/>
        </div>

      </v-card-text>

      <v-card-actions class="d-flex justify-center">
        <Button
          label="Pay Now"
          color="primary"
          :loading="loading"
          :disabled="!isFormValid"
          @click="processPayment"
        />
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
    <v-snackbar v-model="paymentError" timeout="4000" color="red">
      Payment failed. Try again.
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

// Form validation
const isFormValid = computed(() => {
  if (!bookingId || !amount || !clientUsername || !paymentMethod.value) return false;
  if (paymentMethod.value === 'Card') {
    return !!(cardNumber.value && expiry.value && cvv.value && cardHolder.value);
  }
  return true;
});

// Process payment
const processPayment = async () => {
  loading.value = true;

  try {
    const paymentPayload: any = {
      jobId: Number(bookingId),
      amount: amount,
      clientUsername: clientUsername,
    };

    // Assign mechanicId or carWashId based on job description
    if (jobDes.toLowerCase() !== "car wash service") {
      paymentPayload.mechanicId = mechanicId;
    } else {
      paymentPayload.carWashId = carWashId;
    }

    console.log("Payment payload being sent:", paymentPayload);

    // Send request
    const res = await apiService.createPayment(paymentPayload);

    console.log("Payment response:", res);

    paymentSuccess.value = true;

    router.push({
      name: "Payments",
      query: { bookingId }
    });
  } catch (err: any) {
    console.error("Payment failed:", err.response || err.message || err);
    paymentError.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
</style>
