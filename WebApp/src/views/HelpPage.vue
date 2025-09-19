<template>
  <PageContainer>
     <div>
      <h1 class="text-3xl font-bold">Help & Support</h1>
      <p class="text-gray-600">
        Find answers to common questions or reach out to us directly.
      </p>
    </div>
    <v-col cols="12" md="12">
      <v-card-title class="text-xl font-semibold">
        Frequently Asked Questions
      </v-card-title>
      <v-divider class="my-2"></v-divider>
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title>
            How do I book a service?
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            You can book a service by navigating to the booking section,
            selecting your preferred time and service, and confirming your
            details.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            Can I cancel or reschedule?
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            Yes, cancellations and rescheduling are allowed up to 24 hours
            before your scheduled appointment.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            How do payments work?
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            Payments can be made securely through the app using your
            preferred payment method.
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-col cols="12" md="12">
      <v-card-title class="text-xl font-semibold">
        Still Need Help?
      </v-card-title>
      <v-divider class="my-2"></v-divider>
      <v-card-text>
        <p class="mb-4 text-gray-700">
          Our support team is here to assist you.
        </p>

        <ul v-if="adminDetails" class="space-y-2">
          <li><strong>Email:</strong> {{ adminDetails.email }}</li>
          <li><strong>Phone:</strong> {{ adminDetails.phone }}</li>
          <li><strong>WhatsApp:</strong> {{ adminDetails.whatsapp }}</li>
          <li><strong>Working Hours:</strong> {{ adminDetails.workingHours }}</li>
        </ul>

        <p v-else class="text-gray-500">Loading contact details...</p>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-email"
          :href="`mailto:${adminDetails?.email}`"
        >
          Email Us
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-whatsapp"
          :href="`https://wa.me/${adminDetails?.whatsapp.replace(/\D/g,'')}`"
          target="_blank"
        >
          WhatsApp
        </v-btn>
      </v-card-actions>
    </v-col>
  </PageContainer>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";

const adminDetails = ref<null | {
  email: string;
  phone: string;
  whatsapp: string;
  workingHours: string;
}>(null);
const code = localStorage.getItem("phoneCountryCode");
const currencySymbols = localStorage.getItem("currencySymbol");
const fetchAdminDetails = async () => {
  try {
    const response = await apiService.getAllUsers();

    const admins = response?.data?.filter((u: any) =>
      u.roles?.includes("ADMIN")
    );

    if (admins && admins.length > 0) {
      const admin = admins[0];
      adminDetails.value = {
        email: admin.email || "pbhanina@gmail.comrfre",
        phone: code+admin.phoneNumber || code+" 78 214 1216",
        whatsapp: code+admin.phoneNumber || code+" 78 214 1216", 
        workingHours: "Mon - Fri, 8am - 6pm",
      };
    } else {
      adminDetails.value = {
        email: "pbhanina@gmail.com",
        phone: "+27 78 214 1216",
        whatsapp: "+27 78 214 1216",
        workingHours: "Mon - Fri, 8am - 6pm",
      };
    }
  } catch (err) {
    console.error("Failed to fetch admin details", err);
  }
};
onMounted(fetchAdminDetails);
</script>

<style scoped>
.text-error {
  color: red;
  font-weight: 500;
}
</style>



<!-- <template>
  <PageContainer>
   
  </PageContainer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.text-error {
  color: red;
  font-weight: 500;
}
</style> -->
