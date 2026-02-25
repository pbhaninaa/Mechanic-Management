<template>
  <v-app class="app-container">
    <!-- Global success toast -->
    <v-snackbar v-model="toastSuccessVisible" :timeout="4000" color="green" location="top" class="toast-snackbar">
      <div class="toast-content toast-success">
        <v-icon size="18" class="toast-star toast-star-1">mdi-star</v-icon>
        <v-icon size="22" class="toast-star toast-star-2">mdi-star</v-icon>
        <v-icon size="40" class="toast-icon">mdi-emoticon-happy-outline</v-icon>
        <v-icon size="22" class="toast-star toast-star-3">mdi-star</v-icon>
        <v-icon size="18" class="toast-star toast-star-4">mdi-star</v-icon>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
      <template #action>
        <v-btn variant="text" @click="toastSuccessVisible = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Global error toast -->
    <v-snackbar v-model="toastErrorVisible" :timeout="5000" color="red" location="top" class="toast-snackbar">
      <div class="toast-content">
        <v-icon size="40" class="toast-icon">mdi-emoticon-sad-outline</v-icon>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
      <template #action>
        <v-btn variant="text" @click="toastErrorVisible = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Sidebar Navigation (never on Login/SignUp) -->
    <SidebarNav
      v-if="showSidebar"
      ref="sidebarNav"
    />

    <!-- Main content reacts to sidebar -->
    <v-main
      :class="mainClasses"
      class="main-content"
    >
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import SidebarNav from "./components/SidebarNav.vue";
import { toast } from "./utils/toast";

const route = useRoute();
const isAuthenticated = ref(false);

const showSidebar = computed(
  () => isAuthenticated.value && !route.meta.requiresGuest
);
const toastSuccessVisible = ref(false);
const toastErrorVisible = ref(false);
const toastMessage = ref("");

toast.subscribe(({ type, message }) => {
  toastMessage.value = message;
  // Ensure only one toast visible at a time — hide the other before showing
  if (type === "success") {
    toastErrorVisible.value = false;
    toastSuccessVisible.value = true;
  } else {
    toastSuccessVisible.value = false;
    toastErrorVisible.value = true;
  }
});
const sidebarNav = ref(null);
const windowWidth = ref(window.innerWidth);

// Sidebar width
const sidebarWidth = 256; 

// Responsive
const isMobile = computed(() => windowWidth.value < 960);
const mainClasses = computed(() => {
  if (!showSidebar.value) return "main-unauth";
  return isMobile.value ? "main-mobile" : "main-with-sidebar";
});

// Check authentication
const checkAuth = () => {
  const token = localStorage.getItem("token");
  const userProfile = localStorage.getItem("userProfile");
  
  // User is authenticated if they have a token (profile may not exist yet)
  // The router will handle redirecting to CreateProfile if needed
  isAuthenticated.value = !!token;
};

// Update window width
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  checkAuth();
  handleResize();
  window.addEventListener("storage", checkAuth);
  window.addEventListener("resize", handleResize);
  
  // Listen for custom events when profile is updated
  window.addEventListener("profileUpdated", checkAuth);
});

onUnmounted(() => {
  window.removeEventListener("storage", checkAuth);
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("profileUpdated", checkAuth);
});
</script>

<style scoped>
.main-content {
  background-color: rgb(255, 255, 255);  
  transition: margin-left 0.3s ease;
  width: 100%;
  min-height: 100vh;
  padding: 1%;
  box-sizing: border-box;
  background-image: url('https://i.pinimg.com/1200x/10/c0/6e/10c06ea7c9c177984e865384ce512d05.jpg');
  background-repeat: no-repeat;
  background-size: cover;  
  background-position: center; 
}

.main-unauth {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
}

.main-with-sidebar {
  margin-left: 256px; 
}

.main-mobile {
  margin-left: 0;
  padding: 0.5%;
}

/* Responsive breakpoints */
@media (max-width: 960px) {
  .main-content {
    padding: 0.5%;
  }
  
  .main-with-sidebar {
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .main-content {
    padding: 0;
  }
  
  .main-unauth {
    padding: 16px;
  }
}

@media (max-width: 400px) {
  .main-content {
    padding: 0;
  }
  
  .main-unauth {
    padding: 8px;
  }
}
</style>

<style>
/* Toast content - not scoped so it works with v-snackbar teleport */
.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toast-content .toast-icon {
  flex-shrink: 0;
}
.toast-content .toast-message {
  flex: 1;
}
/* Happy booming stars */
.toast-star {
  flex-shrink: 0;
  color: #FFD700;
  animation: star-boom 0.6s ease-out both;
}
.toast-star-1 { animation-delay: 0s; }
.toast-star-2 { animation-delay: 0.1s; }
.toast-star-3 { animation-delay: 0.2s; }
.toast-star-4 { animation-delay: 0.3s; }
@keyframes star-boom {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}
</style>
