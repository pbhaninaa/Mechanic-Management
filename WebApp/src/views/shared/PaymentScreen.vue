<template>
  <PageContainer>
    <v-card class="mx-auto my-6" max-width="500" outlined>
      <v-card-title class="text-h6">Payment</v-card-title>
      <v-card-text>
        <p class="mb-4">Complete your payment for the service below:</p>

        <v-alert type="info" density="compact" class="mb-4">
          <span v-if="paymentMethod === 'Card' && stripeEnabled">Card payments use Stripe (test mode). Use 4242 4242 4242 4242 to test.</span>
          <span v-else>Bank Transfer and Mobile Money are for record-keeping. Card payments process via Stripe when configured.</span>
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
            <strong>{{ formatCurrency(amount) }}</strong>
          </div>
        </v-card>

        <!-- Payment Method -->
        <v-select v-model="paymentMethod" :items="paymentMethods" label="Select Payment Method" outlined required />

        <!-- Stripe Card Element (secure - PCI compliant) -->
        <div v-if="paymentMethod === 'Card' && stripeEnabled" class="mt-4">
          <label class="v-label mb-2 d-block">Card details</label>
          <div ref="cardElementRef" class="stripe-card-element" />
        </div>

      </v-card-text>

      <v-card-actions class="d-flex justify-center">
        <Button label="Confirm Payment" color="primary" :loading="loading" :disabled="!isFormValid || loading" @click="processPayment" />
      </v-card-actions>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer.vue';
import Button from '@/components/Button.vue';
import apiService from '@/api/apiService';
import { JOB_STATUS } from '@/utils/constants';
import { useCurrency } from '@/composables/useCurrency';

const { formatCurrency } = useCurrency();

// Router
const route = useRoute();
const router = useRouter();

// Query params
const bookingId = (route.query.bookingId as string) || '';
const jobDes = (route.query.jobDes as string) || '';
const amount = parseFloat((route.query.amount as string) || '0');
const clientUsername = (route.query.clientUsername as string) || '';
const mechanicId = String(route.query.mechanicId || '');
const carWashId = String(route.query.carWashId || '');

// Payment state
const paymentMethod = ref<'Card' | 'Bank Transfer' | 'Mobile Money'>('Card');
const paymentMethods = ['Card', 'Bank Transfer', 'Mobile Money'];
const loading = ref(false);
const cardElementRef = ref<HTMLDivElement | null>(null);

const stripePk = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) || '';
const stripeEnabled = computed(() => !!stripePk && stripePk.startsWith('pk_'));

const stripeRef = ref<any>(null);
const cardElementRefVal = ref<any>(null);
const cardElementReady = ref(false);

async function mountStripeCard() {
  if (!stripeRef.value || !cardElementRef.value) return;
  if (cardElementRefVal.value) return; // already mounted
  const elements = stripeRef.value.elements();
  const card = elements.create('card', { style: { base: { fontSize: '16px' } } });
  card.mount(cardElementRef.value);
  cardElementRefVal.value = card;
  cardElementReady.value = true;
}

onMounted(async () => {
  if (stripeEnabled.value && stripePk) {
    const { loadStripe } = await import('@stripe/stripe-js');
    stripeRef.value = await loadStripe(stripePk);
    await nextTick(); // wait for v-if to render the card container
    if (paymentMethod.value === 'Card') await mountStripeCard();
  }
});

watch(paymentMethod, async (method) => {
  if (method === 'Card' && stripeEnabled.value && stripeRef.value) {
    await nextTick();
    await mountStripeCard();
  } else {
    cardElementRefVal.value = null;
    cardElementReady.value = false;
  }
});

const isFormValid = computed(() => {
  if (!bookingId || !amount || !clientUsername || !paymentMethod.value) return false;
  if (paymentMethod.value === 'Card' && stripeEnabled.value) return cardElementReady.value;
  return true;
});

const completePaymentAndUpdateJob = async (paymentPayload: any, paymentIntentId?: string) => {
  if (paymentIntentId) paymentPayload.paymentIntentId = paymentIntentId;

  const res = await apiService.createPayment(paymentPayload);
  if (res && res.statusCode === 200) {
    let job: any = null;
    if (jobDes.toLowerCase() !== "car wash service") {
      const mechanicRes = await apiService.getMechanicRequestsById(bookingId);
      job = mechanicRes?.data ?? mechanicRes;
    } else {
      const carWashRes = await apiService.getCarWashBookingById(bookingId);
      job = carWashRes?.data ?? carWashRes;
    }
    if (job) {
      job.status = JOB_STATUS.PAID;
      if (jobDes.toLowerCase() === "car wash service") {
        await apiService.updateCarWashBooking(job.id, job);
      } else {
        await apiService.updateRequestMechanic(job);
      }
    }
    router.push({ name: "Payments", query: { bookingId } });
  } else {
    throw new Error(res?.message || "Payment was not successful");
  }
};

const processPayment = async () => {
  if (loading.value) return;
  loading.value = true;

  try {
    const paymentPayload: any = {
      jobId: bookingId,
      amount: amount,
      clientUsername: clientUsername,
    };
    if (mechanicId) paymentPayload.mechanicId = mechanicId;
    if (carWashId) paymentPayload.carWashId = carWashId;

    if (paymentMethod.value === 'Card' && stripeEnabled.value && stripeRef.value && cardElementRefVal.value) {
      const intentRes = await apiService.createPaymentIntent(paymentPayload);
      const clientSecret = intentRes?.data?.clientSecret || intentRes?.clientSecret;
      const paymentIntentId = intentRes?.data?.paymentIntentId || intentRes?.paymentIntentId;

      if (!clientSecret) throw new Error(intentRes?.message || "Failed to create payment intent");

      const { error } = await stripeRef.value.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElementRefVal.value },
      });

      if (error) throw new Error(error.message || "Payment failed");
      await completePaymentAndUpdateJob(paymentPayload, paymentIntentId);
    } else {
      await completePaymentAndUpdateJob(paymentPayload);
    }
  } catch (err: any) {
    // Error toast shown by global axios interceptor
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
.stripe-card-element {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  min-height: 40px;
}
</style>
