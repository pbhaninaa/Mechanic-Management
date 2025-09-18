<template>
  <PageContainer style="min-width: 100%;">
    <v-card-title>Client Dashboard</v-card-title>
    <p class="mb-6">Welcome Client, manage your requests and payments here.</p>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <p v-if="error" class="text-error text-center">{{ error }}</p>

    <!-- Summary Cards -->
    <v-row dense v-if="!loading && !error">
      <v-col cols="12" md="3" v-for="card in summaryCards" :key="card.title">
        <v-card outlined class="pa-4 text-center">
          <v-icon :color="card.color" size="36">{{ card.icon }}</v-icon>
          <h3 class="mt-2">{{ card.value }}</h3>
          <p class="text-subtitle-2">{{ card.title }}</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row dense v-if="!loading && !error">
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
          <h3>My Progress</h3>
          <v-divider class="mb-4" />
          <div class="chart-container">
            <canvas ref="progressChart"></canvas>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
          <h3>My Requests (Last 6 Months)</h3>
          <v-divider class="mb-4" />
          <div class="chart-container">
            <canvas ref="requestsChart"></canvas>
          </div>
        </div>
      </v-col>
    </v-row>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted, watchEffect } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import Chart from "chart.js/auto";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";

const summaryCards = ref([]);
const jobRequests = ref([]);
const loading = ref(false);
const error = ref(null);
const moneySpent = ref(0);

const requestsChart = ref(null);
const progressChart = ref(null);
let requestsChartInstance = null;
let progressChartInstance = null;

// Load job requests and payments
const loadJobRequests = async () => {
  loading.value = true;
  error.value = null;
  try {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    const username = profile.username || "";

    // Job requests
    const res = await apiService.getUserRequestHistory(username);
    jobRequests.value = res.data || [];

    // Payments
    const paymentRes = await apiService.getPaymentsByClient(username);
    const payments = paymentRes.data || [];
    moneySpent.value = payments.reduce((total, p) => total + (p.amount || 0), 0);
  } catch (err) {
    error.value = "Failed to load data.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Format currency
const formatCurrency = (amount) => `R ${amount.toLocaleString()}`;

// Update summary cards + charts reactively
watchEffect(() => {
  if (!jobRequests.value.length) return;

  const { total, completed, pending } = jobRequests.value.reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === JOB_STATUS.COMPLETED) acc.completed++;
      if (r.status === JOB_STATUS.PENDING) acc.pending++;
      return acc;
    },
    { total: 0, completed: 0, pending: 0 }
  );

  summaryCards.value = [
    { title: "My Requests", value: total, icon: "mdi-car-wrench", color: "blue" },
    { title: "Completed Jobs", value: completed, icon: "mdi-clipboard-check", color: "green" },
    { title: "Pending Payments", value: pending, icon: "mdi-credit-card", color: "orange" },
    { title: "Total Spent", value: formatCurrency(moneySpent.value), icon: "mdi-cash", color: "purple" },
  ];

  // Progress pie chart
  if (progressChart.value) {
    if (progressChartInstance) progressChartInstance.destroy();
    progressChartInstance = new Chart(progressChart.value.getContext("2d"), {
      type: "pie",
      data: {
        labels: [JOB_STATUS.COMPLETED, JOB_STATUS.PENDING, "Other"],
        datasets: [
          {
            data: [completed, pending, total - completed - pending],
            backgroundColor: ["#4caf50", "#ff9800", "#2196f3"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
    });
  }

  // Requests line chart (last 6 months)
  if (requestsChart.value) {
    if (requestsChartInstance) requestsChartInstance.destroy();

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return d.toLocaleString("default", { month: "short" });
    });

    const monthlyData = months.map((_, idx) => {
      const year = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1).getFullYear();
      return jobRequests.value.filter(req => {
        const d = new Date(req.date);
        return (
          d.getMonth() === (now.getMonth() - (5 - idx) + 12) % 12 &&
          d.getFullYear() === year
        );
      }).length;
    });

    requestsChartInstance = new Chart(requestsChart.value.getContext("2d"), {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Requests Made",
            data: monthlyData,
            borderColor: "rgba(54, 162, 235, 0.9)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
  }
});

// Initial load
onMounted(() => {
  loadJobRequests();
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 250px;
  margin: 0 auto;
}
.text-error {
  color: red;
  font-weight: 500;
}
</style>
