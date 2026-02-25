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
  { title: "Total Users", value: 0, icon: "mdi-account", color: "blue" },
  { title: "Clients", value: 0, icon: "mdi-account-group", color: "teal" },
  { title: "Mechanics", value: 0, icon: "mdi-wrench", color: "green" },
  { title: "Carwashes", value: 0, icon: "mdi-car-wash", color: "indigo" },
  { title: "Jobs Completed", value: 0, icon: "mdi-clipboard-check", color: "purple" },
  { title: "Revenue", value: "R 0", icon: "mdi-cash", color: "orange" },
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
    const resPayments = await apiService.getAllPayments();
    payments.value = resPayments.data || [];

    jobsCompleted.value = payments.value.length;
    revenue.value = payments.value.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Update Summary Cards
    summaryCards.value = [
      { title: "Total Users", value: users.value.length, icon: "mdi-account", color: "blue" },
      { title: "Clients", value: clients.value.length, icon: "mdi-account-group", color: "teal" },
      { title: "Mechanics", value: mechanics.value.length, icon: "mdi-wrench", color: "green" },
      { title: "Carwashes", value: carwashes.value.length, icon: "mdi-car-wash", color: "indigo" },
      { title: "Jobs Completed", value: jobsCompleted.value, icon: "mdi-clipboard-check", color: "purple" },
      { title: "Revenue", value: `R ${revenue.value.toLocaleString()}`, icon: "mdi-cash", color: "orange" },
    ];
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }
};

// Charts
const renderCharts = () => {
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
            backgroundColor: ["#2196f3", "#4caf50", "#9c27b0", "#ff9800"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            color: "#fff",
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

  // Earnings Line Chart
  if (earningsChart.value && payments.value.length > 0) {
    const sortedPayments = [...payments.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstDate = new Date(sortedPayments[0].date);
    const lastDate = new Date(sortedPayments[sortedPayments.length - 1].date);

    // Build monthly buckets
    const monthlyTotals: Record<string, number> = {};
    const cursor = new Date(firstDate);

    while (
      cursor.getFullYear() < lastDate.getFullYear() ||
      (cursor.getFullYear() === lastDate.getFullYear() && cursor.getMonth() <= lastDate.getMonth())
    ) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals[key] = 0;
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Fill buckets with payments
    payments.value.forEach((p: any) => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyTotals[key] !== undefined) {
        monthlyTotals[key] += p.amount || 0;
      }
    });

    // Labels & Values
    const labels = Object.keys(monthlyTotals).map(key => {
      const [y, m] = key.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    });

    const values = Object.values(monthlyTotals);

    new Chart(earningsChart.value.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Earnings (R)",
            data: values,
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
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#000",
            anchor: "end",
            align: "top",
            formatter: (val: number) => `R ${val.toLocaleString()}`,
          },
        },
        scales: { y: { beginAtZero: true } },
      },
      plugins: [ChartDataLabels],
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
