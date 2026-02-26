<template>
  <PageContainer>
    <v-card-text>
      <TableComponent
        title="Manage Jobs"
        :headers="headers"
        :items="jobs"
        :items-per-page="10"
        :loading="loading"
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Actions: Start / Complete -->
        <template #item.actions="{ item }">
          <v-tooltip text="Start work (client has paid)" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                color="green"
                variant="text"
                class="mr-1"
                :loading="actionLoadingId === (item.id ?? item.requestId)"
                :disabled="!canStart(item) || !!actionLoadingId"
                @click="updateStatus(item, JOB_STATUS.IN_PROGRESS)"
              >
                <v-icon size="18">mdi-play</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Finish job - you have done the work" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                color="blue"
                variant="text"
                class="mr-1"
                :loading="actionLoadingId === (item.id ?? item.requestId)"
                :disabled="!canComplete(item) || !!actionLoadingId"
                @click="updateStatus(item, JOB_STATUS.COMPLETED)"
              >
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </TableComponent>
    </v-card-text>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import { getStatusColor, sortRequestsByStatus } from "@/utils/helper";
import apiService from "@/api/apiService";
import { JOB_STATUS, USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import { formatDate } from "@/composables/useDateFormat";
import { getSafeJson } from "@/utils/storage";
import { toast } from "@/utils/toast";
import { useCurrency } from "@/composables/useCurrency";

const loggedInUser = getSafeJson("userProfile", {});

interface MechanicJob {
  id?: string;
  requestId?: string;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
  mechanicId: string | null;
  servicePrice?: number;
}

const jobs = ref<MechanicJob[]>([]);
const loading = ref(false);
const actionLoadingId = ref<string | number | null>(null);

const isAdmin = (loggedInUser?.roles || []).includes(USER_ROLES.ADMIN);
const { formatCurrency } = useCurrency();
const formatPrice = (item: MechanicJob) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";

const headers = computed(() => {
  const base = [
    { title: "Client", value: "username" },
    { title: "Description", value: "description" },
    { title: "Price", value: "price", formatter: formatPrice },
    { title: "Date", value: "date", formatter: (item) => formatDate(item?.date) },
    { title: "Status", value: "status" },
    { title: "Actions", value: "actions", sortable: false },
  ];
  if (isAdmin) {
    base.splice(1, 0, {
      title: "Phone",
      value: "phoneNumber",
      formatter: (item: MechanicJob) => item?.phoneNumber || "—",
    });
  }
  return base;
});

const isStatus = (item: MechanicJob, status: string) =>
  String(item?.status || "").toLowerCase() === String(status || "").toLowerCase();

/** No actions when completed */
const isCompleted = (item: MechanicJob) => isStatus(item, JOB_STATUS.COMPLETED);

/** Start button: enabled only when paid (payment required before starting) */
const canStart = (item: MechanicJob) => !isCompleted(item) && isStatus(item, JOB_STATUS.PAID);

/** Complete button: enabled when in progress */
const canComplete = (item: MechanicJob) => !isCompleted(item) && isStatus(item, JOB_STATUS.IN_PROGRESS);

const updateStatus = async (job: MechanicJob, newStatus: string) => {
  const jobId = job?.id ?? job?.requestId;
  if (!jobId) {
    toast.error("Cannot update: job has no ID. Please refresh the page.");
    return;
  }
  if (actionLoadingId.value) return;
  actionLoadingId.value = jobId;
  try {
    const previousStatus = job.status;
    const role = (loggedInUser?.roles?.[0] ?? "").toString().toLowerCase();
    const mechanicId = role === "admin" ? job.mechanicId : (loggedInUser?.id ?? job.mechanicId);
    const payload = {
      ...job,
      id: String(jobId),
      status: newStatus,
      mechanicId: mechanicId ?? job.mechanicId,
    };

    await apiService.updateRequestMechanic(payload);

    job.status = newStatus;
  } catch (error) {
    console.error(`Failed to update job status for job ${job.id}`, error);
    job.status = previousStatus;
  } finally {
    actionLoadingId.value = null;
  }
};

const fetchJobs = async () => {
  loading.value = true;
  try {
    const role = (loggedInUser?.roles?.[0] ?? "").toString().toLowerCase();
    const isAdmin = role === "admin";

    let data: MechanicJob[] = [];
    if (isAdmin) {
      const res = await apiService.getAllRequestHistory();
      data = Array.isArray(res?.data) ? res.data : [];
    } else {
      const mechanicId = loggedInUser?.id;
      if (!mechanicId) {
        jobs.value = [];
        return;
      }
      const res = await apiService.getRequestHistoryByMechanicId(mechanicId);
      data = Array.isArray(res?.data) ? res.data : [];
      // Service provider: hide completed jobs, show only active ones
      data = data.filter((j) => !isStatus(j, JOB_STATUS.COMPLETED));
    }
    jobs.value = sortRequestsByStatus(data, "manage");
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    jobs.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchJobs);
</script>
