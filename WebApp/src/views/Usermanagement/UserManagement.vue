<template>
  <PageContainer>
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-3" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <TableComponent
          title="Users Management"
          :headers="headers"
          :items="users"
          :loading="loading"
          no-data-message="No data."
          show-search
          search-placeholder="Search name, email, username..."
          @update:search-value="onSearch"
        >
          <template #item.fullName="{ item }">
            {{ item.firstName }} {{ item.lastName }}
          </template>

          <template #item.roles="{ item }">
            <v-chip v-for="role in item.roles" :key="role" class="ma-1" color="primary" dark small>
              {{ role }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-tooltip text="Edit" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="primary" icon class="mr-1"
                  :disabled="loading || createLoading || deleteAllLoading"
                  @click="editUser(item)">
                  <v-icon size="18">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="error" icon
                  :disabled="loading || createLoading || deleteAllLoading"
                  @click="confirmDelete(item)">
                  <v-icon size="18">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </template>
        </TableComponent>
      </v-card-text>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editDialog" max-width="900px">
      <v-card>
        <v-card-title>Edit User</v-card-title>
        <v-card-text>
          <InputField v-model="selectedUser.firstName" label="First Name" required />
          <InputField v-model="selectedUser.lastName" label="Last Name" required />
          <InputField v-model="selectedUser.username" label="Username" required disabled />
          <InputField v-model="selectedUser.email" label="Email" type="email" required />
          <PhoneNumberInput v-model="selectedUser.phoneNumber" :initial-value="selectedUser.phoneNumber"
            :initial-country-code="selectedUser.countryCode" @update:countryCode="selectedUser.countryCode = $event"
            @valid="isPhoneValid = $event" :disabled="loading" />


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


    <!-- Create User Dialog (User + Profile in one form) -->
    <v-dialog v-model="createUserDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title>Create User</v-card-title>
        <v-card-text>
          <p class="text-subtitle-2 mb-2 text-grey">Create user account and profile. Username and password are for login.</p>
          <InputField v-model="createForm.username" label="Username" type="text" required :disabled="createLoading" />
          <InputField v-model="createForm.password" label="Password" type="password" required :disabled="createLoading" />
          <v-divider class="my-4" />
          <InputField v-model="createForm.firstName" label="First Name" required :disabled="createLoading" />
          <InputField v-model="createForm.lastName" label="Last Name" required :disabled="createLoading" />
          <InputField v-model="createForm.email" label="Email" type="email" required :disabled="createLoading" />
          <PhoneNumberInput v-model="createForm.phoneNumber" :initial-value="createForm.phoneNumber"
            :initial-country-code="createForm.countryCode" @update:countryCode="createForm.countryCode = $event"
            @valid="isCreatePhoneValid = $event" :disabled="createLoading" />
          <InputField v-model="createForm.address" label="Address" type="text" :disabled="createLoading" />
          <v-select v-model="createForm.roles" :items="availableRoles" label="Role" chips :multiple="false"
            variant="outlined" required :disabled="createLoading" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <Button text label="Cancel" @click="closeCreateDialog" :disabled="createLoading" />
          <Button color="primary" label="Save" :loading="createLoading" :disabled="!isCreateFormValid"
            @click="saveCreateUser" />
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
    <v-spacer />
    <Button max-width="120px" color="primary" label="Add User" @click="openCreateUserDialog()" :disabled="loading" />
    <Button max-width="120px" color="error" label="Delete All" class="ml-2" @click="confirmDeleteAll"
      :disabled="loading || users.length === 0" />

    <!-- Delete All Confirmation Dialog -->
    <v-dialog v-model="deleteAllDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline red--text">Confirm Delete All</v-card-title>
        <v-card-text>
          This will permanently delete all users. This action cannot be undone. Continue?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <Button text label="Cancel" @click="deleteAllDialog = false" />
          <Button color="error" label="Delete All" @click="deleteAllConfirmed" :loading="deleteAllLoading" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import PageContainer from '@/components/PageContainer.vue';
import InputField from '@/components/InputField.vue';
import Button from '@/components/Button.vue';
import apiService from '@/api/apiService';
import PhoneNumberInput from '@/components/PhoneNumberInput.vue';
import { USER_ROLES } from '@/utils/constants';
import { logoutUser } from '@/utils/helper';
import TableComponent from '@/components/TableComponent.vue';
import { getSafeJson } from "@/utils/storage";
import { toast } from "@/utils/toast";

const users = ref([]);
const loading = ref(false);
const error = ref<string | null>(null);

const loggedInUser = getSafeJson("userProfile", {});
const isAdmin = computed(() => (loggedInUser?.roles || []).includes(USER_ROLES.ADMIN));

const headers = computed(() => {
  const base = [
    { title: 'Username', value: 'username' },
    { title: 'Full Name', value: 'fullName' },
    { title: 'Email', value: 'email' },
    { title: 'Roles', value: 'roles', sortable: false },
    { title: 'Actions', value: 'actions', sortable: false }
  ];
  if (isAdmin.value) {
    base.splice(3, 0, {
      title: 'Phone',
      value: 'phoneNumber',
      formatter: (item) => item?.phoneNumber || "—"
    });
  }
  return base;
});

// Edit dialog
const editDialog = ref(false);
const selectedUser = ref<any>({});

// Delete confirmation dialog
const deleteDialog = ref(false);
const userToDelete = ref<any>(null);

// Delete all dialog
const deleteAllDialog = ref(false);
const deleteAllLoading = ref(false);

// Create User dialog
const createUserDialog = ref(false);
const createLoading = ref(false);
const isCreatePhoneValid = ref(false);
const createForm = ref({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  countryCode: '+27',
  address: '',
  roles: 'CLIENT',
});

const isCreateFormValid = computed(() => (
  createForm.value.username?.trim() &&
  createForm.value.password?.trim() &&
  createForm.value.firstName?.trim() &&
  createForm.value.lastName?.trim() &&
  createForm.value.email?.trim() &&
  isCreatePhoneValid.value &&
  createForm.value.roles
));

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

const getDefaultCreateForm = () => ({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  countryCode: '+27',
  address: '',
  roles: 'CLIENT',
});

const openCreateUserDialog = () => {
  createForm.value = getDefaultCreateForm();
  isCreatePhoneValid.value = false;
  createUserDialog.value = true;
};

const closeCreateDialog = () => {
  if (!createLoading.value) {
    createUserDialog.value = false;
  }
};

const getErrorMessage = (err: any) =>
  err?.response?.data?.message || err?.message || 'Unknown error';

const runCreateProfile = async () => {
  const rolesVal = createForm.value.roles;
  const profileData = {
    username: createForm.value.username.trim(),
    firstName: createForm.value.firstName.trim(),
    lastName: createForm.value.lastName.trim(),
    email: createForm.value.email.trim(),
    phoneNumber: createForm.value.phoneNumber,
    countryCode: createForm.value.countryCode,
    address: createForm.value.address?.trim() || '',
    roles: Array.isArray(rolesVal) ? rolesVal : [rolesVal],
  };
  await apiService.createUserProfile(profileData, { skipGlobalToast: true });
};

const saveCreateUser = async () => {
  if (!isCreateFormValid.value) return;
  createLoading.value = true;
  error.value = null;
  const skipToast = { skipGlobalToast: true };
  try {
    // Step 1: Try create User (username + password)
    try {
      await apiService.registerUser(
        {
          username: createForm.value.username.trim(),
          password: createForm.value.password,
        },
        skipToast
      );
    } catch (userErr: any) {
      const status = userErr?.response?.status;
      const msg = getErrorMessage(userErr);
      if (status === 409 && msg?.toLowerCase().includes('username') && msg?.toLowerCase().includes('exist')) {
        // User already exists — try adding profile only (user may have no profile)
        try {
          await runCreateProfile();
          createUserDialog.value = false;
          await loadUsers();
          toast.success('Profile added for existing user account.');
          return;
        } catch (profileErr: any) {
          toast.error(`Profile creation failed: ${getErrorMessage(profileErr)}`);
          return;
        }
      }
      toast.error(`User creation failed: ${msg}`);
      return;
    }
    // Step 2: Create Profile (user was created successfully)
    try {
      await runCreateProfile();
      createUserDialog.value = false;
      await loadUsers();
      toast.success('User account and profile created successfully.');
    } catch (profileErr: any) {
      const profileMsg = getErrorMessage(profileErr);
      toast.error(
        `User account created successfully, but profile creation failed: ${profileMsg}. The user can log in but has no profile yet.`
      );
    }
  } finally {
    createLoading.value = false;
  }
};

// Load all users
const searchQuery = ref("");
function onSearch(q) {
  searchQuery.value = q;
}
const loadUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {};
    const res = await apiService.getAllUsers(params);
    users.value = res.data || [];
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch users';
  } finally {
    loading.value = false;
  }
};
watch(searchQuery, () => loadUsers());

// Edit user
const editUser = (user: any) => {
  selectedUser.value = {
    ...user,
    phoneNumber: user.phoneNumber || "",
    countryCode: user.countryCode || "+27"
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

  } catch (err: any) {
    error.value = err.message || 'Failed to delete user';
  } finally {
    loading.value = false;
    await loadUsers();
  }
};

// Confirm delete all users
const confirmDeleteAll = () => {
  deleteAllDialog.value = true;
};

const deleteAllConfirmed = async () => {
  if (!users.value.length) return;
  deleteAllLoading.value = true;
  try {
    // Call the backend DELETE endpoint
    await apiService.deleteAllUsers();
    deleteAllDialog.value = false;

  } catch (err: any) {
    error.value = err.message || 'Failed to delete all users';
  } finally {
    deleteAllLoading.value = false;
    await logoutUser();
  }
};


onMounted(loadUsers);
</script>
