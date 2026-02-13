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
        md="4"
      >
        <v-card outlined class="pa-4 text-center">
          <v-icon :color="card.color" size="36">{{ card.icon }}</v-icon>
          <h3 class="mt-2">{{ card.value }}</h3>
          <p class="text-subtitle-2">{{ card.title }}</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row dense class="mt-2">
      <!-- Doughnut -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4 chart-card">
          <h3>Service Progress</h3>
          <v-divider class="mb-4" />
          <canvas ref="progressPieChart" class="mini-chart"></canvas>
        </div>
      </v-col>

      <!-- Line -->
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
import { ref, onMounted, nextTick } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import apiService from "@/api/apiService";
import { COLORS } from "@/utils/constants";

Chart.register(ChartDataLabels);

// Canvas refs
const progressPieChart = ref<HTMLCanvasElement | null>(null);
const earningsChart = ref<HTMLCanvasElement | null>(null);

// Chart instances
let progressChartInstance: Chart | null = null;
let earningsChartInstance: Chart | null = null;

// Summary cards
const summaryCards = ref([
  { title: "Total Customers", value: 0, icon: "mdi-account", color: COLORS.CARD_BLUE, chartColor: COLORS.CHART_BLUE },
  { title: "Cars Washed", value: 0, icon: "mdi-car", color: COLORS.CARD_GREEN, chartColor: COLORS.CHART_GREEN },
  { title: "Revenue", value: "R 0.00", icon: "mdi-cash", color: COLORS.CARD_ORANGE, chartColor: COLORS.CHART_ORANGE },
]);

// Monthly earnings
const monthlyEarnings = ref<number[]>(Array(12).fill(0));
const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* -------------------------
   Render Charts
-------------------------- */
const renderCharts = () => {
  // Destroy old charts
  if (progressChartInstance) {
    progressChartInstance.destroy();
  }
  if (earningsChartInstance) {
    earningsChartInstance.destroy();
  }

  /* Doughnut Chart */
  if (progressPieChart.value) {
    progressChartInstance = new Chart(progressPieChart.value, {
      type: "doughnut",
      data: {
        labels: summaryCards.value.map(c => c.title),
        datasets: [{
          data: summaryCards.value.map(c =>
            Number(String(c.value).replace(/[^0-9.-]+/g, ""))
          ),
          backgroundColor: summaryCards.value.map(c => c.chartColor),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            color: "#fff",
            formatter: (value: any, context: any) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              return total ? `${((value / total) * 100).toFixed(1)}%` : "0%";
            },
          },
        },
      },
    });
  }

  /* Line Chart */
  if (earningsChart.value) {
    earningsChartInstance = new Chart(earningsChart.value, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [{
          label: "Earnings (R)",
          data: monthlyEarnings.value,
          borderColor: COLORS.BORDER_BLUE,
          backgroundColor: COLORS.OVERLAY_BLUE,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: COLORS.POINT_BLUE,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true }
        },
      },
    });
  }
};

/* -------------------------
   Load Data
-------------------------- */
const loadSummaryData = async () => {
  try {
    const usersRes = await apiService.getAllUsers();
    const paymentsRes = await apiService.getPaymentsByClients();
    const loggedInUser = JSON.parse(localStorage.getItem("userProfile") || "{}");

    const clients = (usersRes.data || []).filter(u =>
      u.roles?.includes("CLIENT")
    );

    const carWashPayments = (paymentsRes.data || []).filter(p =>
      p.carWashId == loggedInUser.id
    );

    const totalRevenue = carWashPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    summaryCards.value = [
      { title: "Total Customers", value: clients.length, icon: "mdi-account", color: COLORS.CARD_BLUE, chartColor: COLORS.CHART_BLUE },
      { title: "Cars Washed", value: carWashPayments.length, icon: "mdi-car", color: COLORS.CARD_GREEN, chartColor: COLORS.CHART_GREEN },
      { title: "Revenue", value: `R ${totalRevenue.toFixed(2)}`, icon: "mdi-cash", color: COLORS.CARD_ORANGE, chartColor: COLORS.CHART_ORANGE },
    ];

    const monthTotals: number[] = Array(12).fill(0);
    carWashPayments.forEach(p => {
      if (p.paidAt) {
        const month = new Date(p.paidAt).getMonth();
        monthTotals[month] += p.amount || 0;
      }
    });

    monthlyEarnings.value = monthTotals;

    // WAIT for DOM update before rendering charts
    await nextTick();
    renderCharts();

  } catch (err) {
    console.error("Failed to load summary data:", err);
  }
};

onMounted(async () => {
  await loadSummaryData();
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
