<template>
  <PageContainer>
    <div>
      <v-card-title>Users Management</v-card-title>
      <v-card-text>
        <v-data-table :headers="headers" :items="users" :loading="loading" class="elevation-1">
          <!-- Full Name Column -->
          <template #item.fullName="{ item }">
            {{ item.firstName }} {{ item.lastName }}
          </template>

          <!-- Roles Column -->
          <template #item.roles="{ item }">
            <v-chip v-for="role in item.roles" :key="role" class="ma-1" color="primary" dark small>
              {{ role }}
            </v-chip>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <v-btn class="mr-4" color="primary" small @click="editUser(item)">Edit</v-btn>
            <v-btn color="error" small @click="confirmDelete(item)">Delete</v-btn>
          </template>
        </v-data-table>

        <!-- Error Alert -->
        <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
    </div>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editDialog" max-width="900px">
      <v-card>
        <v-card-title>Edit User</v-card-title>
        <v-card-text>
          <InputField v-model="selectedUser.firstName" label="First Name" required />
          <InputField v-model="selectedUser.lastName" label="Last Name" required />
          <InputField v-model="selectedUser.username" label="Username" required disabled />
          <InputField v-model="selectedUser.email" label="Email" type="email" required />
          <PhoneNumberInput v-model="selectedUser.phoneNumber" @valid="isPhoneValid = $event" :disabled="loading" />

          <!-- Editable Roles Multi-Select -->
          <v-select v-model="selectedUser.roles" :items="availableRoles" label="Roles" :multiple="false" chips
            variant="outlined" required />
        </v-card-text>

        <!-- Centered Buttons -->
        <v-card-actions class="justify-center">
          <!-- <Button text label="Cancel" class="mx-2" @click="editDialog = false" /> -->
          <Button color="primary" label="Save" class="mx-2" :loading="loading" :disabled="!isFormValid"
            @click="updateUser" />
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline red--text">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ userToDelete?.username }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <Button text label="Cancel" @click="deleteDialog = false" />
          <Button color="error" label="Delete" @click="deleteUserConfirmed" :loading="loading" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer.vue';
import InputField from '@/components/InputField.vue';
import Button from '@/components/Button.vue';
import apiService from '@/api/apiService';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
const router = useRouter();

const users = ref([]);
const loading = ref(false);
const error = ref<string | null>(null);

const headers = [
  { title: 'Username', value: 'username' },
  { title: 'Full Name', value: 'fullName' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phoneNumber' },
  { title: 'Roles', value: 'roles', sortable: false },
  { title: 'Actions', value: 'actions', sortable: false }
];

// Edit dialog
const editDialog = ref(false);
const selectedUser = ref<any>({});

// Delete confirmation dialog
const deleteDialog = ref(false);
const userToDelete = ref<any>(null);

// Available roles
const availableRoles = ['CLIENT', 'MECHANIC', 'ADMIN', 'CARWASH'];

// Form validation
const isFormValid = computed(() => {
  return (
    selectedUser.value.firstName &&
    selectedUser.value.lastName &&
    selectedUser.value.username &&
    selectedUser.value.email &&
    isPhoneValid.value &&
    selectedUser.value.roles?.length > 0
  );
});



// Load all users
const loadUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await apiService.getAllUsers();
    users.value = res.data || [];
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch users';
  } finally {
    loading.value = false;
  }
};

// Edit user
const editUser = (user: any) => {
  selectedUser.value = {
    ...user,
    phoneNumber: user.phoneNumber || ""
  };
  editDialog.value = true;
};


// Update user
const updateUser = async () => {
  if (!isFormValid.value) return;
  loading.value = true;
  try {

    await apiService.updateUserProfile(selectedUser.value);


    editDialog.value = false;
    await loadUsers();
  } catch (err: any) {
    error.value = err.message || 'Failed to update user';
  } finally {
    loading.value = false;
  }
};

async function sendEmailToUser(user: any) {
  const emailPayload = {
    to: user.email,
    from: 'job.application.software@gmail.com',
    subject: 'Profile Updated',
    body: `Hi ${user.firstName}, your profile has been successfully updated.`
  };

  try {
    const response = await apiService.sendEmail(emailPayload);
    console.log('Email sent successfully to', user.email, response);
  } catch (error) {
    console.error('Error sending email to', user.email, error);
  }
}
const countryOptions = [
  { label: "South Africa (ZAR)", code: "+27", currency: "R", length: 9 },
  { label: "United States (USD)", code: "+1", currency: "$", length: 10 },
  { label: "United Kingdom (GBP)", code: "+44", currency: "£", length: 10 },
];

const requiredPhoneLength = computed(() => {
  const found = countryOptions.find(c => c.code === selectedUser.value.countryCode);
  return found?.length ?? 9;
});

const isPhoneValid = ref(true);

// Delete confirmation
const confirmDelete = (user: any) => {
  userToDelete.value = user;
  deleteDialog.value = true;
};

// Delete user
const deleteUserConfirmed = async () => {
  if (!userToDelete.value) return;
  loading.value = true;
  try {
    await apiService.deleteUserByUsername(userToDelete.value.username);
    deleteDialog.value = false;
    userToDelete.value = null;
    await loadUsers();
  } catch (err: any) {
    error.value = err.message || 'Failed to delete user';
  } finally {
    loading.value = false;
  }
};

onMounted(loadUsers);
</script>
