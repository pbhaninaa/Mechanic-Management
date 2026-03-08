<template>
  <PageContainer>
    <v-card>
      <v-card-title>Additional Fees</v-card-title>
      <v-card-subtitle>Manage call-out, towing, and other additional fees. Only admins can add, update, or delete.</v-card-subtitle>
      <v-card-text>
        
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
        <v-table v-else>
          <thead>
            <tr>
              <th>Fee key</th>
              <th>Amount (R)</th>
              <th>Description</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fee in fees" :key="fee.id">
              <td>{{ fee.feeKey }}</td>
              <td>{{ fee.amount }}</td>
              <td>{{ fee.description || '—' }}</td>
              <td class="text-right">
                <v-btn variant="text" size="small" color="primary" icon @click="openEdit(fee)" title="Edit">
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
                <v-btn variant="text" size="small" color="error" icon @click="confirmDelete(fee)" title="Delete">
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
            <tr v-if="!loading && fees.length === 0">
              <td colspan="4" class="text-center text-medium-emphasis py-4">No additional fees yet. Add one below.</td>
            </tr>
          </tbody>
        </v-table>
        <v-btn color="primary" class="mt-3" @click="openCreate">Add fee</v-btn>
      </v-card-text>
    </v-card>

    <!-- Create / Edit dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'Edit fee' : 'Add fee' }}</v-card-title>
        <v-card-text>
          <InputField v-model="form.feeKey" label="Fee key (e.g. callOut, towing)" :disabled="!!editingId" />
          <InputField v-model.number="form.amount" label="Amount (R)" type="number" min="0" step="0.01" />
          <InputField v-model="form.description" label="Description (optional)" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saveLoading" :disabled="!form.feeKey || (form.amount ?? '') === '' || (Number(form.amount) < 0)" @click="saveFee">
            {{ editingId ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>Delete fee?</v-card-title>
        <v-card-text>This will remove "{{ feeToDelete?.feeKey }}". Booking/request forms will no longer use this fee until you add it again.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="deleteFee">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageContainer from '@/components/PageContainer.vue';
import InputField from '@/components/InputField.vue';
import apiService from '@/api/apiService';

interface AdditionalFeeItem {
  id: string;
  feeKey: string;
  amount: number;
  description?: string;
}

const fees = ref<AdditionalFeeItem[]>([]);
const loading = ref(true);
const error = ref('');
const dialog = ref(false);
const deleteDialog = ref(false);
const saveLoading = ref(false);
const deleteLoading = ref(false);
const editingId = ref<string | null>(null);
const feeToDelete = ref<AdditionalFeeItem | null>(null);

const form = ref({ feeKey: '', amount: 0 as number, description: '' });

async function loadFees() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiService.getAdditionalFees();
    const data = res?.data ?? res ?? [];
    fees.value = Array.isArray(data) ? data : [];
  } catch (e: any) {
    error.value = e?.message || 'Failed to load additional fees.';
    fees.value = [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = { feeKey: '', amount: 0, description: '' };
  dialog.value = true;
}

function openEdit(fee: AdditionalFeeItem) {
  editingId.value = fee.id;
  form.value = { feeKey: fee.feeKey, amount: fee.amount, description: fee.description || '' };
  dialog.value = true;
}

async function saveFee() {
  if (!form.value.feeKey || (form.value.amount ?? '') === '' || Number(form.value.amount) < 0) return;
  saveLoading.value = true;
  error.value = '';
  try {
    if (editingId.value) {
      await apiService.updateAdditionalFee(editingId.value, {
        feeKey: form.value.feeKey,
        amount: Number(form.value.amount),
        description: form.value.description || undefined,
      });
    } else {
      await apiService.createAdditionalFee({
        feeKey: form.value.feeKey,
        amount: Number(form.value.amount),
        description: form.value.description || undefined,
      });
    }
    dialog.value = false;
    await loadFees();
  } catch (e: any) {
    error.value = e?.message || 'Failed to save.';
  } finally {
    saveLoading.value = false;
  }
}

function confirmDelete(fee: AdditionalFeeItem) {
  feeToDelete.value = fee;
  deleteDialog.value = true;
}

async function deleteFee() {
  if (!feeToDelete.value) return;
  deleteLoading.value = true;
  error.value = '';
  try {
    await apiService.deleteAdditionalFee(feeToDelete.value.id);
    deleteDialog.value = false;
    feeToDelete.value = null;
    await loadFees();
  } catch (e: any) {
    error.value = e?.message || 'Failed to delete.';
  } finally {
    deleteLoading.value = false;
  }
}

onMounted(loadFees);
</script>
