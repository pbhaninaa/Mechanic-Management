<template>
  <PageContainer>
    <v-alert v-if="jobStatusError" type="error" dismissible class="mb-4" @click:close="jobStatusError = ''">{{ jobStatusError }}</v-alert>
    <v-card-text>
      <TableComponent title="Job Requests" :headers="headers" :items="jobRequests" :loading="false">
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-tooltip text="Accept" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" class="mr-1"
                @click="onAcceptClick(item)" :disabled="!isAdmin() && isStatus(item, JOB_STATUS.ACCEPTED)">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Decline" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="red"
                @click="updateJobStatus(item, JOB_STATUS.DECLINED)" :disabled="!isAdmin() && isStatus(item, JOB_STATUS.DECLINED)">
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </TableComponent>
    </v-card-text>

    <!-- Admin: Select mechanic popup when accepting -->
    <v-dialog v-model="assignDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>Assign Mechanic</v-card-title>
        <v-card-text>
          <p class="mb-4">Select the mechanic who will work on this request:</p>
          <v-select
            v-model="selectedMechanicId"
            :items="mechanicOptions"
            item-title="label"
            item-value="id"
            label="Choose mechanic"
            variant="outlined"
            :loading="mechanicsLoading"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="assignDialog = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!selectedMechanicId" @click="confirmAssign">Assign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";
import { getStatusColor } from "@/utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import { getSafeJson } from "@/utils/storage";
interface JobRequest {
  id: number;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
  mechanicId: number;
  servicePrice?: number;
}

const jobRequests = ref<JobRequest[]>([]);
const jobStatusError = ref("");

const profile = getSafeJson("userProfile", {});
const isAdmin = () => (profile?.roles?.[0]?.toLowerCase?.() ?? "") === "admin";

const isStatus = (item: JobRequest, status: string) =>
  String(item?.status || "").toLowerCase() === String(status || "").toLowerCase();

// Admin assign mechanic dialog
const assignDialog = ref(false);
const jobToAssign = ref<JobRequest | null>(null);
const selectedMechanicId = ref<number | null>(null);
const mechanicsLoading = ref(false);
const mechanicOptions = ref<{ id: number; label: string }[]>([]);

const formatPrice = (item: JobRequest) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? `R ${Number(item.servicePrice).toFixed(2)}`
    : "—";

const headers = computed(() => {
  const base = [
    { title: "Client", value: "username" },
    { title: "Description", value: "description" },
    { title: "Price", value: "price", formatter: formatPrice },
    { title: "Date", value: "date" },
    { title: "Location", value: "location" },
    { title: "Status", value: "status" },
    { title: "Actions", value: "actions", sortable: false },
  ];
  if (isAdmin()) {
    base.splice(1, 0, {
      title: "Phone",
      value: "phoneNumber",
      formatter: (item: JobRequest) => item?.phoneNumber || "—",
    });
  }
  return base;
});





const fetchMechanics = async () => {
  mechanicsLoading.value = true;
  try {
    const res = await apiService.getProfilesByRole("MECHANIC");
    const profiles = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
    mechanicOptions.value = profiles
      .filter((p: any) => p?.id != null)
      .map((p: any) => ({
        id: p.id,
        label: `${p.firstName || ""} ${p.lastName || ""} (${p.username || p.email || "—"})`.trim() || `Mechanic #${p.id}`,
      }));
  } catch (err) {
    console.error("Failed to fetch mechanics:", err);
    mechanicOptions.value = [];
  } finally {
    mechanicsLoading.value = false;
  }
};

const onAcceptClick = (job: JobRequest) => {
  if (isAdmin()) {
    jobToAssign.value = job;
    selectedMechanicId.value = null;
    assignDialog.value = true;
    fetchMechanics();
  } else {
    updateJobStatus(job, JOB_STATUS.ACCEPTED);
  }
};

const confirmAssign = async () => {
  if (!jobToAssign.value || !selectedMechanicId.value) return;
  await updateJobStatus(jobToAssign.value, JOB_STATUS.ACCEPTED, selectedMechanicId.value);
  assignDialog.value = false;
  jobToAssign.value = null;
  selectedMechanicId.value = null;
};

const loadJobRequests = async () => {
  try {
    const res = await apiService.getAllRequestHistory();
    const allRequests = res?.data ?? [];

    const profile = getSafeJson("userProfile", {});
    const role = profile?.roles?.[0]?.toLowerCase?.() ?? "";

    // Admin sees all; mechanic (and others) see only pending
    if (role === "admin") {
      jobRequests.value = allRequests;
    } else {
      jobRequests.value = allRequests.filter(
        (r: JobRequest) => String(r?.status || "").toLowerCase() === "pending"
      );
    }
  } catch (err: any) {
    console.error("Failed to load job requests:", err);
  }
};
const updateJobStatus = async (job: JobRequest, status: string, mechanicIdOverride?: number) => {
  try {
    const profile = getSafeJson("userProfile", {});
    const mechanicId = mechanicIdOverride ?? profile?.id;
    const payload = { ...job, status, mechanicId };

    await apiService.updateRequestMechanic(payload);
    job.status = status;
  } catch (err: any) {
    console.error("Failed to update job status:", err);
    jobStatusError.value = err?.message || "Failed to update status. Please try again.";
  }
};

onMounted(() => {
  loadJobRequests();
});
</script>
