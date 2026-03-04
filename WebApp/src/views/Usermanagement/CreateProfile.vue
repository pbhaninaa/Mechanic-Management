<template>
  <PageContainer>
    <v-card-title>{{ isEditMode ? "Edit Profile" : "Create Profile" }}</v-card-title>

    <v-card-text>
      <InputField v-model="form.firstName" label="First Name" type="text" :disabled="loading" required />
      <InputField v-model="form.lastName" label="Last Name" type="text" :disabled="loading" required />
      <InputField v-model="form.username" label="Username" type="text" :disabled="true" required />
      <InputField v-model="form.email" label="Email" type="email" :disabled="loading || isEditMode" required />

      <PhoneNumberInput
        v-model="form.phoneNumber"
        :initial-value="form.phoneNumber"
        :initial-country-code="form.countryCode"
        @update:countryCode="form.countryCode = $event"
        @valid="isPhoneValid = $event"
        :disabled="loading"
      />

      <!-- Address Section -->
      <div v-if="form.roles[0] !== USER_ROLES.ADMIN">
        <v-radio-group v-model="useCurrentLocation" row>
          <v-radio label="Use My Current Location" :value="true" />
          <v-radio label="Enter Address Manually" :value="false" />
        </v-radio-group>

        <v-alert v-if="locationError" type="warning" density="compact" class="mb-2">
          {{ locationError }}
        </v-alert>

        <InputField
          v-model="form.address"
          label="Address"
          type="text"
          :disabled="loading || useCurrentLocation"
          :readonly="useCurrentLocation"
        />
      </div>

      <InputField
        v-else
        v-model="form.address"
        label="Address"
        type="text"
        :disabled="true"
      />

      <v-select
        v-model="form.roles"
        :items="roles"
        label="Role"
        chips
        :multiple="false"
        :disabled="loading || !canEditRole"
        required
        variant="outlined"
      />

      <Button
        :label="isEditMode ? 'Update' : 'Save'"
        color="primary"
        :disabled="isSaveDisabled"
        :loading="loading"
        @click="saveProfile"
      />

      <v-alert
        v-if="message"
        :type="messageType"
        class="mt-3"
        closable
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>
    </v-card-text>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { emitAuthChanged, getCurrentLocationWithName, geocodeAddressToCoords, ensureLocationName } from "@/utils/helper";
import InputField from "@/components/InputField.vue";
import Button from "@/components/Button.vue";
import apiService from "@/api/apiService";
import PageContainer from "@/components/PageContainer.vue";
import { USER_ROLES } from "@/utils/constants";
import PhoneNumberInput from "@/components/PhoneNumberInput.vue";
import { getSafeJson } from "@/utils/storage";

const route = useRoute();
const router = useRouter();

/* =============================
   FORM STATE
============================= */

const form = ref({
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  countryCode: localStorage.getItem("phoneCountryCode") || "+27",
  phoneNumber: "",
  address: "",
  latitude: null,
  longitude: null,
  roles: [USER_ROLES.CLIENT]
});

const propsProfile = ref(
  route.query.profile
    ? JSON.parse(route.query.profile)
    : getSafeJson("profile", {})
);

// Edit mode only when we have a full existing profile (with id). Login sets "profile" to { username }
// for first-time create, which has no id — so that stays create mode.
const isEditMode = computed(() => !!propsProfile.value?.id);

const currentUser = ref(getSafeJson("userProfile", {}));

/** Number of user profiles in the system. Fetched in onMounted. If > 1, show only CLIENT/MECHANIC/CAR_WASH; else show only ADMIN (first user sets themselves as admin). */
const usersCount = ref(0);

/** Role options: if more than 1 user, show the three roles (or include Admin when editing the existing admin); else show only Admin so the first user can set themselves as admin. */
const roles = computed(() => {
  // If at least one profile already exists
  if (usersCount.value > 0) {
    return [
      USER_ROLES.CLIENT,
      USER_ROLES.MECHANIC,
      USER_ROLES.CAR_WASH
    ];
  }

  // No profiles exist → first user must be Admin
  return [USER_ROLES.ADMIN];
});

const canEditRole = computed(() => {
  if (!isEditMode.value) return true;
  return currentUser.value.roles?.includes(USER_ROLES.ADMIN) || isEditMode;
});

/* =============================
   LOCATION HANDLING
============================= */

const useCurrentLocation = ref(true);
const locationError = ref("");

const fetchCurrentLocation = async () => {
  locationError.value = "";
  const result = await getCurrentLocationWithName();

  if (!result.success) {
    locationError.value = result.message || "Location failed.";
    useCurrentLocation.value = false;
    return;
  }

  form.value.address = ensureLocationName(result.locationName) || "Current location";
  form.value.latitude = result.latitude;
  form.value.longitude = result.longitude;
};

watch(useCurrentLocation, async (val) => {
  if (val) {
    await fetchCurrentLocation();
  } else {
    form.value.address = "";
    form.value.latitude = null;
    form.value.longitude = null;
  }
});

// When address is entered manually and role needs coords, geocode so Save can enable
watch(
  () => [form.value.address, useCurrentLocation.value, form.value.roles?.[0]],
  async ([address, useCurrent, role]) => {
    if (useCurrent || !address?.trim()) return;
    if (role !== USER_ROLES.MECHANIC && role !== USER_ROLES.CAR_WASH) return;
    const coords = await geocodeAddressToCoords(address.trim());
    if (coords) {
      form.value.latitude = String(coords.latitude);
      form.value.longitude = String(coords.longitude);
      locationError.value = "";
    } else {
      locationError.value = "Could not find coordinates for this address. Try a more specific address or use current location.";
    }
  },
);

/* =============================
   VALIDATION
============================= */

const isPhoneValid = ref(false);

const requiresCoordinates = computed(() => {
  const role = form.value.roles?.[0];
  return role === USER_ROLES.MECHANIC || role === USER_ROLES.CAR_WASH;
});

// Phone is acceptable if component says valid, or if we have at least 9 digits (avoids strict length blocking save)
const isPhoneAcceptable = computed(() => {
  if (isPhoneValid.value) return true;
  const digits = (form.value.phoneNumber || "").replace(/\D/g, "");
  return digits.length >= 9;
});

const isSaveDisabled = computed(() => {
  return (
    loading.value ||
    !form.value.firstName?.trim() ||
    !form.value.lastName?.trim() ||
    !form.value.username?.trim() ||
    !form.value.email?.trim() ||
    !form.value.phoneNumber?.trim() ||
    !isPhoneAcceptable.value ||
    (requiresCoordinates.value &&
      (!form.value.latitude || !form.value.longitude))
  );
});

/* =============================
   LOAD EDIT DATA
============================= */

onMounted(async () => {
  if (propsProfile.value?.username) {
    form.value = {
      ...form.value,
      ...propsProfile.value,
      latitude: propsProfile.value.latitude ?? null,
      longitude: propsProfile.value.longitude ?? null,
      roles: propsProfile.value.roles ?? []
    };

    if (propsProfile.value.address) {
      useCurrentLocation.value = false;
    }
  }

  if (useCurrentLocation.value) {
    await fetchCurrentLocation();
  }

  // Count users: if > 1, show only CLIENT/MECHANIC/CAR_WASH; else show only ADMIN (first user can set themselves as admin).
  try {
    const res = await apiService.getAllUsers();
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
   console.log('count: %d', list.length);
    usersCount.value = list.length;
  } catch {
    usersCount.value = 0;
  }
});

/* =============================
   SAVE PROFILE
============================= */

const loading = ref(false);
const message = ref("");
const messageType = ref("success");

const saveProfile = async () => {
  if (!isPhoneAcceptable.value) {
    message.value = "Please enter a valid phone number (at least 9 digits).";
    messageType.value = "error";
    return;
  }

  loading.value = true;

  try {
    if (!Array.isArray(form.value.roles)) {
      form.value.roles = [form.value.roles];
    }

    const res = isEditMode.value
      ? await apiService.updateUserProfile(form.value)
      : await apiService.createUserProfile(form.value);

    const profileData = res?.data ?? res;

    localStorage.setItem("userProfile", JSON.stringify(profileData));
    localStorage.setItem("role", profileData.roles[0].toLowerCase());

    emitAuthChanged();
    router.push("/dashboard");
  } catch (err) {
    message.value = "Failed to save profile.";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
};
</script>