<template>
  <PageContainer>
    <v-card-title>Job Requests</v-card-title>
    <v-card-text>
      <p>See all job requests from clients.</p>

      <!-- Job requests table -->
      <v-data-table :headers="headers" :items="jobRequests" class="elevation-1" :items-per-page="5">
        <!-- Location column with truncation -->
        <template #item.location="{ item }">
          <TooltipText :text="item.location" :maxLength="80" />
        </template>


        <!-- Status column with colored chips -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" dark>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Minimal icon-only action buttons -->
        <template #item.actions="{ item }">
          <v-btn variant="text" size="small" color="green" class="mr-1" @click="updateJobStatus(item, JOB_STATUS.ACCEPTED)"
            :disabled="item.status === JOB_STATUS.ACCEPTED">
            <v-icon size="18">mdi-check</v-icon>
          </v-btn>

          <v-btn variant="text" size="small" color="red" @click="updateJobStatus(item, JOB_STATUS.DECLINED)"
            :disabled="item.status === JOB_STATUS.DECLINED">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <div v-if="jobRequests.length === 0" class="mt-3">
        No job requests found.
      </div>
    </v-card-text>
  </PageContainer>
</template>


<script setup lang="ts">
import { ref, onMounted } from "vue";
import PageContainer from "@/components/PageContainer.vue";
import apiService from "@/api/apiService";
import TooltipText from "@/components/TooltipText.vue";
import { JOB_STATUS } from "@/utils/constants";
import { getStatusColor } from "@/utils/helper";
interface JobRequest {
  id: number;
  username: string;
  description: string;
  date: string;
  location: string;
  status: string;
  mechanicId: number;
}

const jobRequests = ref<JobRequest[]>([]);

const headers = [
  { text: "Client", value: "username" },
  { text: "Description", value: "description" },
  { text: "Date", value: "date" },
  { text: "Location", value: "location" },
  { text: "Status", value: "status" },
  { text: "Actions", value: "actions", sortable: false },
];





const loadJobRequests = async () => {
  try {
    const res = await apiService.getAllRequestHistory();
    jobRequests.value = res.data;
  } catch (err: any) {
    console.error("Failed to load job requests:", err);
  }
};
const updateJobStatus = async (job: JobRequest, status: string) => {
  try {
 
    const payload = { ...job, status, mechanicId:JSON.parse(localStorage.getItem("userProfile")).id };

    await apiService.updateRequestMechanic(payload);
    job.status = status;
  } catch (err: any) {
    console.error("Failed to update job status:", err);
  }
};

onMounted(() => {
  loadJobRequests();
});
</script>
