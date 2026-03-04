<template>
  <PageContainer>
   
    <v-alert v-if="!providerType" type="info" class="mb-3">
      This page is for service providers (Mechanic or Car Wash). Your role could not be determined.
    </v-alert>
    <template v-else>
        <v-card-title class="d-flex align-center flex-nowrap">
          <span>My Services & Prices</span>
          <v-spacer />
          
          <Button label="Add Service" color="primary" size="default" :loading="loading" @click="openAddDialog" />
        </v-card-title>
        <v-card-text class="my-services-card-text">
          <TableComponent
            title=""
            :headers="headers"
            :items="offerings"
            :loading="loading"
            :no-data-message="noDataMessage"
          >
            <template #item.serviceName="{ item }">
              {{ item.serviceName }}
            </template>
            <template #item.price="{ item }">
              {{ formatCurrency(item.price) }}
            </template>
            <template #item.carTypesDisplay="{ item }">
              {{ formatCarTypes(item.supportedCarTypes) }}
            </template>
            <template #item.actions="{ item }">
              <v-tooltip text="Edit" location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" variant="text" size="small" color="primary" icon class="mr-1"
                    :disabled="loading" @click="openEditDialog(item)">
                    <v-icon size="18">mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip text="Delete" location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" variant="text" size="small" color="error" icon
                    :disabled="loading" @click="confirmDelete(item)">
                    <v-icon size="18">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </template>
          </TableComponent>
        </v-card-text>
    </template>

    <!-- Add / Edit dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'Edit Service' : 'Add Service' }}</v-card-title>
        <v-card-text>
          <InputField v-model="form.serviceName" label="Service name" outlined :disabled="loading"  />
          <InputField v-model.number="form.price" label="Price" type="number" :disabled="loading" outlined />
          <p class="text-caption text-medium-emphasis mt-2 mb-1">Car types for this service (optional)</p>
          <v-select
            v-model="form.supportedCarTypes"
            :items="CAR_TYPES"
            label="Leave empty for all car types"
            multiple
            chips
            closable-chips
            :disabled="loading"
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <Button label="Cancel" variant="text" @click="dialog = false" />
          <Button :label="editingId ? 'Update' : 'Add'" color="primary" :loading="loading" @click="saveOffering" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>Delete service?</v-card-title>
        <v-card-text>
          Remove "{{ itemToDelete?.serviceName }}" from your offerings? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <Button label="Cancel" variant="text" @click="deleteDialog = false" />
          <Button label="Delete" color="error" :loading="loading" @click="doDelete" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import PageContainer from '@/components/PageContainer.vue';
import TableComponent from '@/components/TableComponent.vue';
import InputField from '@/components/InputField.vue';
import Button from '@/components/Button.vue';
import apiService from '@/api/apiService';
import { getSafeJson } from '@/utils/storage';
import { useCurrency } from '@/composables/useCurrency';
import { CAR_TYPES } from '@/utils/constants';

const { formatCurrency } = useCurrency();

const userProfile = ref<Record<string, any>>(getSafeJson('userProfile', {}));
const providerType = computed(() => {
  const role = userProfile.value?.roles?.[0];
  const r = (typeof role === 'string' ? role : '').toLowerCase();
  if (r === 'mechanic') return 'mechanic';
  if (r === 'carwash') return 'carwash';
  return null;
});

const offerings = ref<any[]>([]);
const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const noDataMessage = computed(() =>
  messageType.value === 'error' && message.value
    ? 'Could not load services. You can still try adding one.'
    : "No services yet. Click 'Add Service' to add your first offering."
);

const headers = [
  { title: 'Service Name', value: 'serviceName' },
  { title: 'Price', value: 'price' },
  { title: 'Car types', value: 'carTypesDisplay' },
  { title: 'Actions', value: 'actions', sortable: false },
];

const dialog = ref(false);
const deleteDialog = ref(false);
const editingId = ref<string | null>(null);
const itemToDelete = ref<any>(null);

const form = ref<{ serviceName: string; price: number; supportedCarTypes: string[] }>({
  serviceName: '',
  price: 0,
  supportedCarTypes: []
});

function parseSupportedCarTypes(val: string | string[] | null | undefined): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function formatCarTypes(supportedCarTypes: string | string[] | null | undefined): string {
  const arr = parseSupportedCarTypes(supportedCarTypes);
  return arr.length === 0 ? 'All' : arr.join(', ');
}

function openAddDialog() {
  editingId.value = null;
  form.value = { serviceName: '', price: 0, supportedCarTypes: [] };
  dialog.value = true;
}

function openEditDialog(item: any) {
  editingId.value = item.id;
  form.value = {
    serviceName: item.serviceName,
    price: item.price ?? 0,
    supportedCarTypes: parseSupportedCarTypes(item.supportedCarTypes)
  };
  dialog.value = true;
}

function confirmDelete(item: any) {
  itemToDelete.value = item;
  deleteDialog.value = true;
}

async function fetchOfferings() {
  if (!providerType.value) return;
  loading.value = true;
  message.value = '';
  try {
    const res = await apiService.getMyServiceOfferings(providerType.value, { skipGlobalToast: true });
    offerings.value = Array.isArray(res?.data) ? res.data : [];
  } catch (err: any) {
    const status = err?.status ?? err?.responseData?.statusCode;
    if (status === 401) {
      message.value = 'Session expired or not logged in. Please log in again.';
    } else {
      message.value = err?.message || 'Failed to load services. Please try again.';
    }
    messageType.value = 'error';
    offerings.value = [];
  } finally {
    loading.value = false;
  }
}

async function saveOffering() {
  const name = (form.value.serviceName || '').trim();
  const price = Number(form.value.price);
  if (!name) {
    message.value = 'Service name is required';
    messageType.value = 'error';
    return;
  }
  if (price < 0 || isNaN(price)) {
    message.value = 'Please enter a valid price';
    messageType.value = 'error';
    return;
  }
  loading.value = true;
  message.value = '';
  const supportedCarTypes = (form.value.supportedCarTypes?.length ?? 0) > 0
    ? form.value.supportedCarTypes.join(',')
    : null;
  const payload = { serviceName: name, price, supportedCarTypes };
  try {
    if (editingId.value) {
      await apiService.updateServiceOffering(editingId.value, payload);
      message.value = 'Service updated.';
    } else {
      await apiService.createServiceOffering(providerType.value!, payload);
      message.value = 'Service added.';
    }
    messageType.value = 'success';
    dialog.value = false;
    await fetchOfferings();
  } catch (err: any) {
    message.value = err?.message || 'Failed to save';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
}

async function doDelete() {
  if (!itemToDelete.value?.id) return;
  loading.value = true;
  message.value = '';
  try {
    await apiService.deleteServiceOffering(itemToDelete.value.id);
    message.value = 'Service removed.';
    messageType.value = 'success';
    deleteDialog.value = false;
    itemToDelete.value = null;
    await fetchOfferings();
  } catch (err: any) {
    message.value = err?.message || 'Failed to delete';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  userProfile.value = getSafeJson('userProfile', {});
  fetchOfferings();
});
</script>

<style scoped>
/* Hide empty title row from TableComponent when title is blank */
.my-services-card-text > div:first-child {
  display: none;
}
/* Fixed column widths: Service Name 50%, Price 30%, Actions 20% */
.my-services-card-text :deep(.v-data-table table) {
  table-layout: fixed;
  width: 100%;
}
.my-services-card-text :deep(.v-data-table th:nth-child(1)),
.my-services-card-text :deep(.v-data-table td:nth-child(1)) {
  width: 35%;
}
.my-services-card-text :deep(.v-data-table th:nth-child(2)),
.my-services-card-text :deep(.v-data-table td:nth-child(2)) {
  width: 15%;
}
.my-services-card-text :deep(.v-data-table th:nth-child(3)),
.my-services-card-text :deep(.v-data-table td:nth-child(3)) {
  width: 25%;
}
.my-services-card-text :deep(.v-data-table th:nth-child(4)),
.my-services-card-text :deep(.v-data-table td:nth-child(4)) {
  width: 25%;
  min-width: 90px;
}
</style>
