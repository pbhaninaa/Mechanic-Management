<template>
  <PageContainer style="min-width: 100%;">
    <v-card-title>Admin Dashboard</v-card-title>
    <p class="mb-6">Welcome Admin, manage the whole system here.</p>

    <!-- Summary Cards -->
    <v-row dense>
      <v-col
        cols="12"
        md="2"
        v-for="card in summaryCards"
        :key="card.title"
      >
        <v-card
          outlined
          class="pa-4 text-center d-flex flex-column align-center justify-center"
        >
          <v-icon :color="card.color" size="36">{{ card.icon }}</v-icon>
          <h3 class="mt-2">
            {{ card.value }}
            <span class="text-subtitle-2">{{ card.title }}</span>
          </h3>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row dense class="mt-2" justify="space-between">
      <!-- Progress Chart -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
          <h3>System Progress</h3>
          <v-divider class="mb-4" />
          <canvas ref="progressPieChart" class="mini-chart"></canvas>
        </div>
      </v-col>

      <!-- Earnings Chart -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
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
import { COLORS } from "@/utils/constants";

// Register Chart.js plugin
Chart.register(ChartDataLabels);

// State
const users = ref<any[]>([]);
const clients = ref<any[]>([]);
const mechanics = ref<any[]>([]);
const carwashes = ref<any[]>([]);
const payments = ref<any[]>([]);
const jobsCompleted = ref<number>(0);
const revenue = ref<number>(0);

// Summary Cards
const summaryCards = ref([
  { title: "Total Users", value: 0, icon: "mdi-account", color: COLORS.CARD_BLUE },
  { title: "Clients", value: 0, icon: "mdi-account-group", color: COLORS.CARD_TEAL },
  { title: "Mechanics", value: 0, icon: "mdi-wrench", color: COLORS.CARD_GREEN },
  { title: "Carwashes", value: 0, icon: "mdi-car-wash", color: COLORS.CARD_INDIGO },
  { title: "Jobs Completed", value: 0, icon: "mdi-clipboard-check", color: COLORS.CARD_PURPLE },
  { title: "Revenue", value: "R 0", icon: "mdi-cash", color: COLORS.CARD_ORANGE },
]);

// Chart Refs
const progressPieChart = ref<HTMLCanvasElement | null>(null);
const earningsChart = ref<HTMLCanvasElement | null>(null);

// Load Data
const loadDashboardData = async () => {
  try {
    // Users
    const resUsers = await apiService.getAllUsers();
    users.value = resUsers.data || [];

    clients.value = users.value.filter((u: any) => u.roles.includes("CLIENT"));
    mechanics.value = users.value.filter((u: any) => u.roles.includes("MECHANIC"));
    carwashes.value = users.value.filter((u: any) => u.roles.includes("CARWASH"));

    // Payments
    const resPayments = await apiService.getPaymentsByClients();
    payments.value = resPayments.data || [];

    jobsCompleted.value = payments.value.length;
    revenue.value = payments.value.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Update Summary Cards
    summaryCards.value = [
      { title: "Total Users", value: users.value.length, icon: "mdi-account", color: COLORS.CARD_BLUE },
      { title: "Clients", value: clients.value.length, icon: "mdi-account-group", color: COLORS.CARD_TEAL },
      { title: "Mechanics", value: mechanics.value.length, icon: "mdi-wrench", color: COLORS.CARD_GREEN },
      { title: "Carwashes", value: carwashes.value.length, icon: "mdi-car-wash", color: COLORS.CARD_INDIGO },
      { title: "Jobs Completed", value: jobsCompleted.value, icon: "mdi-clipboard-check", color: COLORS.CARD_PURPLE },
      { title: "Revenue", value: `R ${revenue.value.toLocaleString()}`, icon: "mdi-cash", color: COLORS.CARD_ORANGE },
    ];
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }
};

// Charts
const renderCharts = () => {
  let earningsChartInstance: Chart | null = null;
  // Progress Pie Chart
  if (progressPieChart.value) {
    new Chart(progressPieChart.value.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Clients", "Mechanics", "Carwashes", "Jobs"],
        datasets: [
          {
            data: [
              clients.value.length,
              mechanics.value.length,
              carwashes.value.length,
              jobsCompleted.value,
            ],
            backgroundColor: [COLORS.CHART_TEAL, COLORS.CHART_GREEN, COLORS.CHART_INDIGO, COLORS.CHART_PURPLE],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            color: COLORS.TEXT_WHITE,
            formatter: (value, context) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              return `${((value /Number( total)) * 100).toFixed(1)}%`;
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

if (earningsChart.value) {
  const TARGET = 1_000;
  const earned = revenue.value;
  const remaining = Math.max(TARGET - earned, 0);

  earningsChartInstance = new Chart(earningsChart.value, {
    type: "pie",
    data: {
      labels: ["Earned", "Remaining"],
      datasets: [
        {
          data: [earned, remaining],
          backgroundColor: [COLORS.CARD_ORANGE, COLORS.BORDER_LIGHT_GREY],
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "1%", // makes it look modern
      plugins: {
        legend: { position: "bottom" },
        datalabels: {
          color: COLORS.TEXT_BLACK,
          formatter: (value: number, context) => {
            const total:any = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percent = ((value / total) * 100).toFixed(1);
            return `${percent}%`;
          },
        },
      },
    },
  });
}
};

// Init
onMounted(async () => {
  await loadDashboardData();
  renderCharts();
});
</script>

<style scoped>
h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chart-card {
  max-height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.mini-chart {
  max-height: 250px;
}
</style>
