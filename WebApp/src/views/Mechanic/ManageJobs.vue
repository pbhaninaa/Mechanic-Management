<template>
  <PageContainer>
    <v-card-text>
      <TableComponent
        title="Manage Jobs"
        :headers="headers"
        :items="jobs"
        :items-per-page="5"
        :loading="loading"
      >
        <template #item.location="{ item }">
          <TooltipText :text="item.location" :maxLength="80" />
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Actions: Start / Complete -->
        <template #item.actions="{ item }">
          <v-tooltip text="Mark as In Progress" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                color="green"
                variant="text"
                class="mr-1"
                @click="updateStatus(item, JOB_STATUS.IN_PROGRESS)"
                :disabled="!canStart(item)"
              >
                <v-icon size="18">mdi-play</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Mark as Completed" location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                color="blue"
                variant="text"
                class="mr-1"
                @click="updateStatus(item, JOB_STATUS.COMPLETED)"
                :disabled="!canComplete(item)"
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
import TooltipText from "@/components/TooltipText.vue";
import { getStatusColor } from "@/utils/helper";
import apiService from "@/api/apiService";
import { JOB_STATUS, USER_ROLES } from "@/utils/constants";
import TableComponent from "@/components/TableComponent.vue";
import { getSafeJson } from "@/utils/storage";

const loggedInUser = getSafeJson("userProfile", {});

interface MechanicJob {
  id: number;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
  mechanicId: number | null;
}

const jobs = ref<MechanicJob[]>([]);
const loading = ref(false);

const isAdmin = (loggedInUser?.roles || []).includes(USER_ROLES.ADMIN);
const headers = computed(() => {
  const base = [
    { title: "Client", value: "username" },
    { title: "Description", value: "description" },
    { title: "Date", value: "date" },
    { title: "Location", value: "location" },
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

/** Start button: enabled only when paid (payment required before starting) */
const canStart = (item: MechanicJob) => isStatus(item, JOB_STATUS.PAID);

/** Complete button: enabled when in progress */
const canComplete = (item: MechanicJob) => isStatus(item, JOB_STATUS.IN_PROGRESS);

const updateStatus = async (job: MechanicJob, newStatus: string) => {
  try {
    loading.value = true;
    const previousStatus = job.status;
    const role = (loggedInUser?.roles?.[0] ?? "").toString().toLowerCase();
    const mechanicId = role === "admin" ? job.mechanicId : (loggedInUser?.id ?? job.mechanicId);
    const payload = { ...job, status: newStatus, mechanicId };

    await apiService.updateRequestMechanic(payload);

    job.status = newStatus;
  } catch (error) {
    console.error(`Failed to update job status for job ${job.id}`, error);
    job.status = previousStatus;
  } finally {
    loading.value = false;
  }
};

const fetchJobs = async () => {
  loading.value = true;
  try {
    const role = (loggedInUser?.roles?.[0] ?? "").toString().toLowerCase();
    const isAdmin = role === "admin";

    if (isAdmin) {
      const res = await apiService.getAllRequestHistory();
      const data = res?.data;
      jobs.value = Array.isArray(data) ? data : [];
    } else {
      const mechanicId = loggedInUser?.id;
      if (!mechanicId) {
        jobs.value = [];
        return;
      }
      const res = await apiService.getRequestHistoryByMechanicId(mechanicId);
      const data = res?.data;
      jobs.value = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    jobs.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchJobs);
</script>
