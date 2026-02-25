<template>
  <PageContainer>
    <v-card-title>{{ isEditMode ? "Edit Profile" : "Create Profile" }}</v-card-title>
    <v-card-text>
      <InputField v-model="form.firstName" label="First Name" type="text" :disabled="loading" required />
      <InputField v-model="form.lastName" label="Last Name" type="text" :disabled="loading" required />
      <InputField v-model="form.username" label="Username" type="text" :disabled="true" required />
      <InputField v-model="form.email" label="Email" type="email" :disabled="loading || isEditMode" required />
      <PhoneNumberInput v-model="form.phoneNumber" :initial-value="form.phoneNumber" :initial-country-code="form.countryCode"
        @update:countryCode="form.countryCode = $event" @valid="isPhoneValid = $event" :disabled="loading" />
           
      <InputField v-model="form.address" label="Address" type="text"
        :disabled="loading || form.roles[0] === USER_ROLES.ADMIN" />
      <v-select v-model="form.roles" :items="roles" label="Role" chips :multiple="false"
        :disabled="loading || !canEditRole" required variant="outlined" />
      <Button :label="isEditMode ? 'Update' : 'Save'" color="primary" :disabled="
        loading ||
        !form.firstName ||
        !form.lastName ||
        !form.username ||
        !form.email ||
        !form.phoneNumber ||
        !isPhoneValid
      "
      :loading="loading" @click="saveProfile" />
      <v-alert v-if="message" :type="messageType" class="mt-3" closable @click:close="message = ''">
        {{ message }}
      </v-alert>
    </v-card-text>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import PageContainer from "@/components/PageContainer.vue";
import { USER_ROLES } from "@/utils/constants";
import PhoneNumberInput from "@/components/PhoneNumberInput.vue";
import { countries } from "@/utils/helper";
import { getSafeJson } from "@/utils/storage";

const route = useRoute();

const propsProfile = ref(
  route.query.profile
    ? (() => { try { return JSON.parse(route.query.profile); } catch { return {}; } })()
    : getSafeJson("profile", {})
);
const roles = [USER_ROLES.CLIENT, USER_ROLES.MECHANIC, USER_ROLES.CAR_WASH, USER_ROLES.ADMIN];
const isEditMode = computed(() => !!propsProfile.value?.firstName || !!propsProfile.value?.lastName);
const form = ref({
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  countryCode: localStorage.getItem("phoneCountryCode") || "+27",
  phoneNumber: "",
  address: "",
  roles: [USER_ROLES.CLIENT] // prepopulate with first role
});
const selectedCountry = computed(() =>
  countries.find(c => c.code === form.value.countryCode)
);

const requiredPhoneLength = computed(() =>
  selectedCountry.value?.maxLength ?? 9
);


const isPhoneValid = ref(false);


// Loading and feedback
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

// Current logged-in user
const currentUser = ref(getSafeJson("userProfile", {}));

// Determine if the logged-in user can edit roles
const canEditRole = computed(() => {
  // If creating profile → everyone can choose role
  if (!isEditMode.value) return true;

  // If editing → only ADMIN can edit role
  return currentUser.value.roles?.includes(USER_ROLES.ADMIN);
});


// Fill form if editing
onMounted(() => {
  if (!propsProfile.value) return;

  const profile = propsProfile.value;

  let phone = profile.phoneNumber || "";
  const countryCode = profile.countryCode || "+27";

  // Strip country code if backend stored full number
  if (phone.startsWith(countryCode)) {
    phone = phone.slice(countryCode.length);
  }

  form.value = {
    ...form.value,
    ...profile,
    phoneNumber: phone,
    countryCode,
    roles: profile.roles ? [...profile.roles] : []
  };

  // Mark phone as valid immediately if it matches length
  const digitsOnly = phone.replace(/\D/g, "");
  isPhoneValid.value = digitsOnly.length === requiredPhoneLength.value;
});



// Save or update profile
const saveProfile = async () => {
  if (!isPhoneValid.value) {
    message.value = "Please enter a valid phone number.";
    messageType.value = "error";
    return;
  }

  // Lock roles for non-admins
  if (!canEditRole.value) {
    form.value.roles = propsProfile.value.roles
      ? [...propsProfile.value.roles]
      : [];
  }

  loading.value = true;
  message.value = "";

  try {
    // Persist country + currency
    if (selectedCountry.value) {
      localStorage.setItem("phoneCountryCode", selectedCountry.value.code);
      localStorage.setItem("currencySymbol", selectedCountry.value.currency);
    }

    if (!Array.isArray(form.value.roles)) {
      form.value.roles = [form.value.roles];
    }

    const res = isEditMode.value
      ? await apiService.updateUserProfile(form.value)
      : await apiService.createUserProfile(form.value);

    localStorage.setItem("userProfile", JSON.stringify(res.data));
    message.value = isEditMode.value
      ? "Profile updated successfully!"
      : "Profile saved successfully!";

    messageType.value = "success";

    setTimeout(() => window.location.reload(), 200);
  } catch (err) {
    message.value =
      err.response?.data?.message ||
      err.message ||
      "Failed to save profile";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};

</script>
