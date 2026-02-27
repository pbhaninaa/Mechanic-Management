<template>
  <PageContainer>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>My Services & Prices</span>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Service
        </v-btn>
      </v-card-title>
      <v-card-text>
        
        <v-alert v-if="!providerType" type="info">
          This page is for service providers (Mechanic or Car Wash). Your role could not be determined.
        </v-alert>
        <v-table v-else>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Price</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in offerings" :key="item.id">
              <td>{{ item.serviceName }}</td>
              <td>{{ formatCurrency(item.price) }}</td>
              <td class="text-right">
                <v-btn size="small" variant="text" icon @click="openEditDialog(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" icon color="error" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
            <tr v-if="offerings.length === 0 && !loading && !message">
              <td colspan="3" class="text-center text-medium-emphasis py-4">
                No services yet. Click "Add Service" to add your first offering.
              </td>
            </tr>
            <tr v-if="offerings.length === 0 && !loading && message && messageType === 'error'">
              <td colspan="3" class="text-center py-4">
                <v-alert type="warning" density="compact" class="mx-auto" style="max-width: 400px;">
                  Could not load your services. Check the message above. You can still try adding a service.
                </v-alert>
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mt-2" />
      </v-card-text>
    </v-card>

    <!-- Add / Edit dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'Edit Service' : 'Add Service' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.serviceName"
            label="Service name"
            outlined
            dense
            :disabled="loading"
          />
          <v-text-field
            v-model.number="form.price"
            label="Price"
            type="number"
            min="0"
            step="0.01"
            outlined
            dense
            :disabled="loading"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="loading" @click="saveOffering">
            {{ editingId ? 'Update' : 'Add' }}
          </v-btn>
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
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="loading" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import PageContainer from '@/components/PageContainer.vue';
import apiService from '@/api/apiService';
import { getSafeJson } from '@/utils/storage';
import { useCurrency } from '@/composables/useCurrency';

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

const dialog = ref(false);
const deleteDialog = ref(false);
const editingId = ref<string | null>(null);
const itemToDelete = ref<any>(null);

const form = ref({ serviceName: '', price: 0 });

function openAddDialog() {
  editingId.value = null;
  form.value = { serviceName: '', price: 0 };
  dialog.value = true;
}

function openEditDialog(item: any) {
  editingId.value = item.id;
  form.value = { serviceName: item.serviceName, price: item.price ?? 0 };
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
  try {
    if (editingId.value) {
      await apiService.updateServiceOffering(editingId.value, { serviceName: name, price });
      message.value = 'Service updated.';
    } else {
      await apiService.createServiceOffering(providerType.value!, { serviceName: name, price });
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
