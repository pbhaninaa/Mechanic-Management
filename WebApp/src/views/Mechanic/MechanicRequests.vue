<template>
  <PageContainer>
    <v-card-text>
      <v-alert v-if="tableError || jobStatusError" type="error" density="compact" class="mb-3" closable @click:close="tableError = ''; jobStatusError = ''">
        {{ tableError || jobStatusError }}
      </v-alert>

      <TableComponent title="Job Requests" :headers="headers" :items="jobRequests" :loading="tableLoading" no-data-message="No data.">
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-tooltip text="Accept" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" color="green" icon
                :loading="actionLoadingId === item.id"
                :disabled="isCompleted(item) || (!isAdmin() && isStatus(item, JOB_STATUS.ACCEPTED)) || !!actionLoadingId"
                @click="onAcceptClick(item)">
                <v-icon size="18">mdi-check</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <template v-if="isAdmin()">
            <v-tooltip text="Edit" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="primary" icon
                  :disabled="!!actionLoadingId" @click="openEditJob(item)">
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="error" icon
                  :disabled="!!actionLoadingId" @click="confirmDeleteJob(item)">
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
        </template>
      </TableComponent>
    </v-card-text>

    <!-- Call-out / towing confirmation: service provider must confirm they can fulfil -->
    <v-dialog v-model="calloutConfirmDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">Confirm you can fulfil this request</v-card-title>
        <v-card-text>
          <p class="mb-2">{{ calloutConfirmMessage }}</p>
          <p class="text-medium-emphasis text-body2">{{ calloutConfirmSubtext }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelCalloutConfirm">Cancel</v-btn>
          <v-btn color="primary" :loading="calloutConfirmLoading" @click="proceedAfterCalloutConfirm">Yes, I can do this</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin: Edit job request dialog -->
    <v-dialog v-model="editJobDialog" max-width="560" persistent>
      <v-card>
        <v-card-title>Edit job request</v-card-title>
        <v-card-text>
          <InputField v-model="editForm.status" label="Status" />
          <InputField v-model="editForm.date" label="Date" type="date" />
          <InputField v-model="editForm.description" label="Description" />
          <InputField v-model="editForm.location" label="Location" />
          <InputField v-model.number="editForm.servicePrice" label="Service price" type="number" min="0" step="0.01" />
          <v-checkbox v-model="editForm.callOutService" label="Call-out service" hide-details class="mt-2" />
          <v-checkbox v-model="editForm.towing" label="Towing" hide-details />
          <InputField v-model="editForm.carType" label="Car type" />
          <InputField v-model="editForm.carPlate" label="Car plate" />
          <InputField v-model="editForm.vinNumber" label="VIN number" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editJobDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="editSaveLoading" @click="saveEditJob">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin: Delete job request confirmation -->
    <v-dialog v-model="deleteJobDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>Delete job request?</v-card-title>
        <v-card-text>This cannot be undone. The request will be removed.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteJobDialog = false; jobToDelete = null">Cancel</v-btn>
          <v-btn color="error" :loading="deleteJobLoading" @click="doDeleteJob">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
          <v-btn color="primary" :loading="assignLoading" :disabled="!selectedMechanicId" @click="confirmAssign">Assign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import InputField from "@/components/InputField.vue";
import apiService from "@/api/apiService";
import { JOB_STATUS } from "@/utils/constants";
import { getStatusColor, sortRequestsByStatus } from "@/utils/helper";
import TableComponent from "@/components/TableComponent.vue";
import { formatDate } from "@/composables/useDateFormat";
import { getSafeJson } from "@/utils/storage";
import { useCurrency } from "@/composables/useCurrency";
import { useNotificationSound } from "@/composables/useNotificationSound";
interface JobRequest {
  id: string;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
  mechanicId: string;
  servicePrice?: number;
  callOutService?: boolean;
  towing?: boolean;
  carType?: string;
  carPlate?: string;
  vinNumber?: string;
}

const jobRequests = ref<JobRequest[]>([]);
const tableLoading = ref(false);
const tableError = ref("");
const jobStatusError = ref("");
const actionLoadingId = ref<string | null>(null);
const assignLoading = ref(false);

// Track request IDs we've already seen so we only play sound for *new* requests
const previousRequestIds = ref<Set<string>>(new Set());
const pollIntervalMs = 20000; // 20 seconds
let pollTimerId: ReturnType<typeof setInterval> | null = null;
const { playNewRequestSound } = useNotificationSound();

const profile = getSafeJson("userProfile", {});
const isAdmin = () => (profile?.roles?.[0]?.toLowerCase?.() ?? "") === "admin";

const isStatus = (item: JobRequest, status: string) =>
  String(item?.status || "").toLowerCase() === String(status || "").toLowerCase();
const isCompleted = (item: JobRequest) => isStatus(item, JOB_STATUS.COMPLETED);

// Admin assign mechanic dialog
const assignDialog = ref(false);
const jobToAssign = ref<JobRequest | null>(null);
const selectedMechanicId = ref<string | null>(null);
const mechanicsLoading = ref(false);
const mechanicOptions = ref<{ id: string; label: string }[]>([]);

// Admin: Edit job request
const editJobDialog = ref(false);
const editSaveLoading = ref(false);
const editForm = ref({
  id: "",
  status: "",
  date: "",
  description: "",
  location: "",
  servicePrice: 0,
  callOutService: false,
  towing: false,
  carType: "",
  carPlate: "",
  vinNumber: "",
});

// Admin: Delete job request
const deleteJobDialog = ref(false);
const deleteJobLoading = ref(false);
const jobToDelete = ref<JobRequest | null>(null);

const { formatCurrency } = useCurrency();
const formatPrice = (item: JobRequest) =>
  item?.servicePrice != null && !isNaN(item.servicePrice)
    ? formatCurrency(item.servicePrice)
    : "—";

const headers = computed(() => {
  const base = [
    { title: "Client", value: "username" },
    { title: "Description", value: "description" },
    { title: "Price", value: "price", formatter: formatPrice },

    { title: "Date", value: "date", formatter: (item) => formatDate(item?.date) },
    
      {title:"Call Out Service",color: "primary", value:"callOut", formatter: (item: any) => item?.callOutService ? "Yes" : "No"},
    {title:"Includes Towing", value:"towing", formatter: (item: any) => item?.towing ? "Yes" : "No"},
 { title: "Status", value: "status" },     { title: "Actions", value: "actions", sortable: false },
  ];
  if (isAdmin()) {
    base.splice(1, 0, {
      title: "Phone",
      value: "phoneNumber",
      formatter: (item: any) => item?.phoneNumber || "—",
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
        id: String(p.id),
        label: `${p.firstName || ""} ${p.lastName || ""} (${p.username || p.email || "—"})`.trim() || `Mechanic #${p.id}`,
      }));
  } catch (err) {
    console.error("Failed to fetch mechanics:", err);
    mechanicOptions.value = [];
  } finally {
    mechanicsLoading.value = false;
  }
};

const needsCalloutConfirm = (job: JobRequest) =>
  !!(job?.callOutService || job?.towing);

const calloutConfirmDialog = ref(false);
const calloutConfirmLoading = ref(false);
const pendingAcceptJob = ref<JobRequest | null>(null);
const pendingAssignMechanicId = ref<string | null>(null);

const calloutConfirmMessage = computed(() => {
  const j = pendingAcceptJob.value;
  if (!j) return "";
  if (j.towing) return "This request requires towing.";
  if (j.callOutService) return "This is a call-out job. You will need to travel to the client's location.";
  return "Confirm you can fulfil this request.";
});

const calloutConfirmSubtext = computed(() => {
  const j = pendingAcceptJob.value;
  if (!j) return "";
  if (j.towing) return "Only accept if you have a towing truck or the means to tow the vehicle.";
  if (j.callOutService) return "Only accept if you have a vehicle and can travel to the client's location.";
  return "";
});

function cancelCalloutConfirm() {
  calloutConfirmDialog.value = false;
  pendingAcceptJob.value = null;
  pendingAssignMechanicId.value = null;
}

async function proceedAfterCalloutConfirm() {
  const job = pendingAcceptJob.value;
  const mechanicId = pendingAssignMechanicId.value;
  if (!job) {
    cancelCalloutConfirm();
    return;
  }
  calloutConfirmLoading.value = true;
  try {
    if (mechanicId) {
      await updateJobStatus(job, JOB_STATUS.ACCEPTED, mechanicId);
      assignDialog.value = false;
      jobToAssign.value = null;
      selectedMechanicId.value = null;
    } else {
      await updateJobStatus(job, JOB_STATUS.ACCEPTED);
    }
    loadJobRequests();
  } finally {
    calloutConfirmLoading.value = false;
    cancelCalloutConfirm();
  }
}

const onAcceptClick = (job: JobRequest) => {
  if (isAdmin()) {
    jobToAssign.value = job;
    selectedMechanicId.value = null;
    assignDialog.value = true;
    fetchMechanics();
  } else {
    if (needsCalloutConfirm(job)) {
      pendingAcceptJob.value = job;
      pendingAssignMechanicId.value = null;
      calloutConfirmDialog.value = true;
    } else {
      updateJobStatus(job, JOB_STATUS.ACCEPTED);
    }
  }
};

const confirmAssign = async () => {
  if (!jobToAssign.value || !selectedMechanicId.value) return;
  if (needsCalloutConfirm(jobToAssign.value)) {
    pendingAcceptJob.value = jobToAssign.value;
    pendingAssignMechanicId.value = selectedMechanicId.value;
    calloutConfirmDialog.value = true;
    return;
  }
  assignLoading.value = true;
  try {
    await updateJobStatus(jobToAssign.value, JOB_STATUS.ACCEPTED, selectedMechanicId.value);
    assignDialog.value = false;
    jobToAssign.value = null;
    selectedMechanicId.value = null;
  } finally {
    assignLoading.value = false;
  }
};

/** @param background - if true, don't show loading spinner (e.g. when returning to cached page or polling) */
const loadJobRequests = async (background = false) => {
  if (!background) tableLoading.value = true;
  tableError.value = "";
  try {
    const res = await apiService.getAllRequestHistory();
    const allRequests = res?.data ?? [];

    const profile = getSafeJson("userProfile", {});
    const role = profile?.roles?.[0]?.toLowerCase?.() ?? "";

    // Admin sees all; mechanic (and others) see only pending
    let list = role === "admin" ? allRequests : allRequests.filter(
      (r: JobRequest) => String(r?.status || "").toLowerCase() === "pending"
    );
    const sorted = sortRequestsByStatus(list);
    const currentIds = new Set((sorted as JobRequest[]).map((r) => String(r?.id ?? "")).filter(Boolean));

    // If we have a previous set (not first load), check for new requests and play sound
    if (previousRequestIds.value.size > 0) {
      const hasNewRequest = [...currentIds].some((id) => !previousRequestIds.value.has(id));
      if (hasNewRequest) {
        playNewRequestSound();
      }
    }
    previousRequestIds.value = currentIds;
    jobRequests.value = sorted;
  } catch (err: any) {
    tableError.value = err?.message || "Failed to load job requests.";
    if (!background) jobRequests.value = [];
  } finally {
    if (!background) tableLoading.value = false;
  }
};
const updateJobStatus = async (job: JobRequest, status: string, mechanicIdOverride?: string) => {
  if (actionLoadingId.value && !mechanicIdOverride) return;
  if (!mechanicIdOverride) actionLoadingId.value = job.id;
  try {
    const profile = getSafeJson("userProfile", {});
    const mechanicId = mechanicIdOverride ?? profile?.id;
    const payload = { ...job, status, mechanicId };

    await apiService.updateRequestMechanic(payload);
    job.status = status;
  } catch (err: any) {
    console.error("Failed to update job status:", err);
    jobStatusError.value = err?.message || "Failed to update status. Please try again.";
  } finally {
    if (!mechanicIdOverride) actionLoadingId.value = null;
  }
};

function openEditJob(job: JobRequest) {
  editForm.value = {
    id: job.id,
    status: job.status ?? "",
    date: job.date ?? "",
    description: job.description ?? "",
    location: job.location ?? "",
    servicePrice: Number(job.servicePrice) || 0,
    callOutService: !!job.callOutService,
    towing: !!job.towing,
    carType: job.carType ?? "",
    carPlate: job.carPlate ?? "",
    vinNumber: job.vinNumber ?? "",
  };
  editJobDialog.value = true;
}

async function saveEditJob() {
  const j = jobRequests.value.find((x) => x.id === editForm.value.id);
  if (!j) return;
  editSaveLoading.value = true;
  try {
    const payload = {
      ...j,
      status: editForm.value.status,
      date: editForm.value.date,
      description: editForm.value.description,
      location: editForm.value.location,
      servicePrice: editForm.value.servicePrice,
      callOutService: editForm.value.callOutService,
      towing: editForm.value.towing,
      carType: editForm.value.carType,
      carPlate: editForm.value.carPlate,
      vinNumber: editForm.value.vinNumber,
    };
    await apiService.updateRequestMechanic(payload);
    Object.assign(j, payload);
    editJobDialog.value = false;
    loadJobRequests();
  } catch (err: any) {
    console.error("Failed to update job:", err);
    jobStatusError.value = err?.message || "Failed to update.";
  } finally {
    editSaveLoading.value = false;
  }
}

function confirmDeleteJob(job: JobRequest) {
  jobToDelete.value = job;
  deleteJobDialog.value = true;
}

async function doDeleteJob() {
  const j = jobToDelete.value;
  if (!j) return;
  deleteJobLoading.value = true;
  try {
    await apiService.deleteMechanicRequestById(j.id);
    deleteJobDialog.value = false;
    jobToDelete.value = null;
    loadJobRequests();
  } catch (err: any) {
    console.error("Failed to delete job:", err);
    jobStatusError.value = err?.message || "Failed to delete.";
  } finally {
    deleteJobLoading.value = false;
  }
}

onMounted(() => {
  tableLoading.value = true;
  loadJobRequests();
  pollTimerId = setInterval(() => loadJobRequests(true), pollIntervalMs);
});

// With keep-alive, component is cached when navigating away; refresh data and restart poll when shown
onActivated(() => {
  loadJobRequests(true); // background refresh so DB changes appear
  if (pollTimerId == null) {
    pollTimerId = setInterval(() => loadJobRequests(true), pollIntervalMs);
  }
});

onDeactivated(() => {
  if (pollTimerId != null) {
    clearInterval(pollTimerId);
    pollTimerId = null;
  }
});

onUnmounted(() => {
  if (pollTimerId != null) {
    clearInterval(pollTimerId);
    pollTimerId = null;
  }
});
</script>
