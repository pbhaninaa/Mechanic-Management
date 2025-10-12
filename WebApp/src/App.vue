<template>
  <v-app class="app-container">
    <!-- Sidebar Navigation -->
    <SidebarNav
      v-if="isAuthenticated"
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
import SidebarNav from "./components/SidebarNav.vue";

const isAuthenticated = ref(false);
const sidebarNav = ref(null);
const windowWidth = ref(window.innerWidth);

// Sidebar width
const sidebarWidth = 256; 

// Responsive
const isMobile = computed(() => windowWidth.value < 960);
const mainClasses = computed(() => {
  if (!isAuthenticated.value) return "main-unauth";
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
