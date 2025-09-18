

<template>
  <PageContainer style="min-width: 100%;">
    <!-- Title -->
    <v-card-title>Car Wash Dashboard</v-card-title>
    <p class="mb-6">Welcome Car Wash</p>

    <!-- Summary Cards -->
    <v-row dense>
      <v-col
        v-for="card in summaryCards"
        :key="card.title"
        cols="12"
        md="3"
      >
        <v-card outlined class="pa-4 text-center">
          <v-icon :color="card.color" size="36">{{ card.icon }}</v-icon>
          <h3 class="mt-2">{{ card.value }}</h3>
          <p class="text-subtitle-2">{{ card.title }}</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Layout -->
    <v-row dense class="mt-2">
      <!-- Progress Donut Chart -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4 chart-card">
          <h3>Service Progress</h3>
          <v-divider class="mb-4" />
          <canvas ref="progressPieChart" class="mini-chart"></canvas>
        </div>
      </v-col>

      <!-- Monthly Earnings Line Chart -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4 chart-card">
          <h3>Monthly Earnings</h3>
          <v-divider class="mb-4" />
          <canvas ref="earningsChart" class="mini-chart"></canvas>
        </div>
      </v-col>
    </v-row>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import apiService from "@/api/apiService";

Chart.register(ChartDataLabels);

// Chart refs
const progressPieChart = ref<HTMLCanvasElement | null>(null);
const earningsChart = ref<HTMLCanvasElement | null>(null);

// Summary cards
const summaryCards = ref([
  { title: "Total Customers", value: 0, icon: "mdi-account", color: "blue" },
  { title: "Cars Washed", value: 0, icon: "mdi-car", color: "green" },
  { title: "Active Packages", value: 0, icon: "mdi-clipboard-check", color: "purple" },
  { title: "Revenue", value: "R 0", icon: "mdi-cash", color: "orange" },
]);

// Demo data (for charts)
const progressData = [
  { label: "Customer Growth", value: 70, color: "#2196f3" },
  { label: "Package Sales", value: 55, color: "#4caf50" },
  { label: "Car Washes", value: 85, color: "#9c27b0" },
  { label: "Revenue Target", value: 40, color: "#ff9800" },
];

const earningsData = [5000, 6200, 7100, 6900, 8500, 9200];
const earningsLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// Function to render charts
const renderCharts = () => {
  if (progressPieChart.value) {
    new Chart(progressPieChart.value.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: progressData.map(d => d.label),
        datasets: [{ data: progressData.map(d => d.value), backgroundColor: progressData.map(d => d.color) }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            color: "#fff",
            formatter: (value, context) => {
              const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
              return total ? `${((Number(value) /Number( total)) * 100).toFixed(1)}%` : "0%";
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

  if (earningsChart.value) {
    new Chart(earningsChart.value.getContext("2d"), {
      type: "line",
      data: {
        labels: earningsLabels,
        datasets: [
          {
            label: "Earnings (R)",
            data: earningsData,
            borderColor: "rgba(54, 162, 235, 0.9)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "rgba(54, 162, 235, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
};

// Example: Load API data for summary cards (optional)
const loadSummaryData = async () => {
  try {
    const usersRes = await apiService.getAllUsers();
    const paymentsRes = await apiService.getAllPayments();
    const loggeInUser = JSON.parse(localStorage.getItem("userProfile"))

    const clients = (usersRes.data || []).filter(u => u.roles.includes("CLIENT"));
    const carWashPayments = (paymentsRes.data || []).filter(p => p.carWashId == loggeInUser.id);

    summaryCards.value = [
      { title: "Total Customers", value: clients.length, icon: "mdi-account", color: "blue" },
      { title: "Cars Washed", value: carWashPayments.length, icon: "mdi-car", color: "green" },
      { title: "Active Packages", value: 230, icon: "mdi-clipboard-check", color: "purple" },
      { title: "Revenue", value: `R ${carWashPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}`, icon: "mdi-cash", color: "orange" },
    ];
  } catch (err) {
    console.error("Failed to load summary data:", err);
  }
};

onMounted(() => {
  renderCharts();
  loadSummaryData(); // optional: fetch real data
});
</script>

<style scoped>
h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mini-chart {
  max-height: 250px;
}
</style>


<style scoped>
h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mini-chart {
  max-height: 250px;
}
</style>
