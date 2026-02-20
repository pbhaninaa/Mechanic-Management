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
      
      <!-- User Distribution -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
          <h3>User Distribution</h3>
          <v-divider class="mb-4" />
          <canvas ref="progressPieChart" class="mini-chart"></canvas>
        </div>
      </v-col>

      <!-- Revenue vs Target -->
      <v-col cols="12" md="6">
        <div class="mt-6 pa-4">
          <h3>Revenue vs Target</h3>
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
import Chart, { Colors } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import apiService from "@/api/apiService";
import { COLORS } from "@/utils/constants";

Chart.register(ChartDataLabels);

/* -------------------- STATE -------------------- */

const users = ref<any[]>([]);
const clients = ref<any[]>([]);
const adminUsers = ref<any[]>([]);
const mechanics = ref<any[]>([]);
const carwashes = ref<any[]>([]);
const payments = ref<any[]>([]);
const jobsCompleted = ref<number>(0);
const revenue = ref<number>(0);

const summaryCards = ref<any[]>([]);

/* -------------------- CHART REFS -------------------- */

const progressPieChart = ref<HTMLCanvasElement | null>(null);
const earningsChart = ref<HTMLCanvasElement | null>(null);

let progressChartInstance: Chart | null = null;
let earningsChartInstance: Chart | null = null;

/* -------------------- LOAD DATA -------------------- */

const loadDashboardData = async () => {
  try {
    const resUsers = await apiService.getAllUsers();
    users.value = resUsers.data || [];

    clients.value = users.value.filter((u:any) => u.roles.includes("CLIENT"));
    mechanics.value = users.value.filter((u:any) => u.roles.includes("MECHANIC"));
    carwashes.value = users.value.filter((u:any) => u.roles.includes("CARWASH"));
    adminUsers.value = users.value.filter((u:any) => u.roles.includes("ADMIN"));

    const resPayments = await apiService.getPaymentsByClients();
    payments.value = resPayments.data || [];

    jobsCompleted.value = payments.value.length;
    revenue.value = payments.value.reduce((sum:number, p:any) => sum + (p.amount || 0), 0);

    summaryCards.value = [
      { title:"Admin Users", value: adminUsers.value.length, icon:"mdi-account-cog", color:COLORS.CARD_BLUE },
      { title:"Clients", value: clients.value.length, icon:"mdi-account-group", color:COLORS.CARD_TEAL },
      { title:"Mechanics", value: mechanics.value.length, icon:"mdi-wrench", color:COLORS.CARD_GREEN },
      { title:"Carwashes", value: carwashes.value.length, icon:"mdi-car-wash", color:COLORS.CARD_INDIGO },
      { title:"Jobs Completed", value: jobsCompleted.value, icon:"mdi-clipboard-check", color:COLORS.CARD_PURPLE },
      { title:"Revenue", value:`R ${revenue.value.toLocaleString()}`, icon:"mdi-cash", color:COLORS.CARD_ORANGE }
    ];

  } catch (error) {
    console.error("Dashboard load error", error);
  }
};

/* -------------------- CENTER TEXT PLUGIN -------------------- */

const centerTextPlugin = (param: any) => (  {
  id: "centerText",
  beforeDraw(chart: any) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);

    if (!meta || !meta.data || !meta.data.length) return;

    const centerX = meta.data[0].x;
    const centerY = meta.data[0].y;
    const innerRadius = meta.data[0].innerRadius;

    ctx.save();

    /* Fill donut hole background */
    ctx.beginPath();
    ctx.fillStyle = param.includes("progressPieChart")? COLORS.SOFT_GREEN_DARK:COLORS.SOFT_PURPLE;
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    /* Draw text */
    const text = param.includes("progressPieChart")? `Total Users: ${users.value.length}`:`Total Jobs: ${jobsCompleted.value}`;
                 "";

    ctx.fillStyle = COLORS.TEXT_BLACK;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY);

    ctx.restore();
  }
});




/* -------------------- RENDER CHARTS -------------------- */

const renderCharts = () => {

  /* destroy existing charts */
  if (progressChartInstance) progressChartInstance.destroy();
  if (earningsChartInstance) earningsChartInstance.destroy();

  /* USER DISTRIBUTION */
  if (progressPieChart.value) {
    progressChartInstance = new Chart(
      progressPieChart.value,
      {
        type: "doughnut",
        data: {
          labels: ["Admin Users","Clients","Mechanics","Carwashes"],
          datasets: [{
            data: [
              adminUsers.value.length,
              clients.value.length,
              mechanics.value.length,
              carwashes.value.length
            ],
            backgroundColor: [
              COLORS.CHART_BLUE,
              COLORS.CHART_TEAL,
              COLORS.CHART_GREEN,
              COLORS.CHART_INDIGO
            ]
          }]
        },
        options: {
          responsive: true,
          cutout: "45%",
          plugins:{
            legend:{ position:"bottom" },
            datalabels:{
              color: COLORS.TEXT_WHITE,
              formatter:(value:any, ctx:any)=>{
                const total = ctx.dataset.data.reduce((a:number,b:number)=>a+b,0);
                return `${((value/total)*100).toFixed(1)}%`;
              }
            }
          }
        },
        plugins:[ChartDataLabels, centerTextPlugin("progressPieChart")]
      }
    );
  }

  /* REVENUE vs TARGET */
 if (earningsChart.value) {

  const TARGET = 1000;
  const earned = revenue.value;
  const remaining = Math.max(TARGET - earned, 0);

  earningsChartInstance = new Chart(
    earningsChart.value,
    {
      type: "pie", // keep pie if you want
      data: {
        labels: ["Earned", "Remaining"],
        datasets: [{
          data: [earned, remaining],
          backgroundColor: [
            COLORS.CARD_ORANGE,
            COLORS.BORDER_LIGHT_GREY
          ]
        }]
      },
      options: {
        responsive: true,
        cutout: "45%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw; // raw value of slice
                return new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR"
                }).format(value); // R 800.00
              }
            }
          },
          datalabels: {
            color: COLORS.TEXT_BLACK,
            formatter: (value: number, ctx: any) => {
              const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
              return `${((value / total) * 100).toFixed(1)}%`; // keep percentages on chart
            }
          }
        }
      },
      plugins: [ChartDataLabels, centerTextPlugin("earningsChart")] // keep center text plugin if needed
    }
  );
}

};

/* -------------------- INIT -------------------- */

onMounted(async () => {
  await loadDashboardData();
  renderCharts();
});
</script>

<style scoped>
h3{
  font-weight:600;
}

.mini-chart{
  max-height:260px;
}
</style>
