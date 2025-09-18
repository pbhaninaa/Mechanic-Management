<template>
  <PageContainer>
    <v-card-title>User Profile</v-card-title>
    <v-card-text>
      <!-- Loading indicator -->
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>

      <!-- Error alert -->
      <v-alert
        v-if="error"
        type="error"
        closable
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>

      <!-- Profile details -->
      <div v-else-if="profile">
        <v-list>
          <v-list-item>
            <v-list-item-title>Full Name</v-list-item-title>
            <v-list-item-subtitle>
              {{ profile.firstName }} {{ profile.lastName }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Username</v-list-item-title>
            <v-list-item-subtitle>{{ profile.username }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Email</v-list-item-title>
            <v-list-item-subtitle>{{ profile.email }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Phone Number</v-list-item-title>
            <v-list-item-subtitle>
              {{ profile.phoneNumber || "N/A" }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Address</v-list-item-title>
            <v-list-item-subtitle>
              {{ profile.address || "No address available" }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Roles</v-list-item-title>
            <v-list-item-subtitle>
              <v-chip
                v-for="role in profile.roles"
                :key="role"
                color="primary"
                small
                class="ma-1"
              >
                {{ role }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Account Status</v-list-item-title>
            <v-list-item-subtitle>
              <div>
                <v-chip
                  :color="profile.enabled ? 'green' : 'red'"
                  small
                  class="ma-1"
                >
                  Enabled: {{ profile.enabled }}
                </v-chip>
                <v-chip
                  :color="profile.accountNonExpired ? 'green' : 'red'"
                  small
                  class="ma-1"
                >
                  Non-Expired: {{ profile.accountNonExpired }}
                </v-chip>
                <v-chip
                  :color="profile.accountNonLocked ? 'green' : 'red'"
                  small
                  class="ma-1"
                >
                  Non-Locked: {{ profile.accountNonLocked }}
                </v-chip>
                <v-chip
                  :color="profile.credentialsNonExpired ? 'green' : 'red'"
                  small
                  class="ma-1"
                >
                  Credentials Non-Expired: {{ profile.credentialsNonExpired }}
                </v-chip>
              </div>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Created At</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDate(profile.createdAt) }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Updated At</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatDate(profile.updatedAt) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>

      <!-- Edit button -->
      <v-card-actions v-if="profile">
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="goToEditProfile">
          <v-icon left>mdi-pencil</v-icon>
          Edit Profile
        </v-btn>
      </v-card-actions>
    </v-card-text>
  </PageContainer>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageContainer from "@/components/PageContainer.vue";

const router = useRouter();
const profile = ref(null);
const error = ref("");
const loading = ref(true);

// Navigate to edit profile
const goToEditProfile = () => {
  router.push({
    name: "CreateProfile",
    query: { profile: JSON.stringify(profile.value) }
  });
};

// Format date nicely
const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleString() : "N/A";
};

// Load profile on mount
onMounted(async () => {
  loading.value = true;
  try {
    const userProfile = localStorage.getItem("userProfile")
      ? JSON.parse(localStorage.getItem("userProfile"))
      : null;

    if (userProfile && userProfile) {
      profile.value = userProfile;
    } else {
      // If no profile, redirect to CreateProfile
      router.replace({ name: "CreateProfile" });
    }
  } catch (err) {
    console.error("Profile error:", err);
    error.value = err.message || "Profile not found or unauthorized";
    
    // Redirect to CreateProfile on error
    router.replace({ name: "CreateProfile" });
  } finally {
    loading.value = false;
  }
});
</script>
