<template>
  <v-navigation-drawer 
    v-model="drawer" 
    :rail="rail" 
    permanent 
    @click.stop="rail = false" 
    class="sidebar-nav"
    :style="sidebarStyle"
  >
    <!-- Brand Section -->
    <div class="brand-section">
      <v-list-item 
        :title="rail ? '' : appTitle" 
        :subtitle="rail ? '' : loggedInUser.firstName" 
        class="brand-item"
      >
        <template v-slot:append>
          <v-btn 
            variant="text" 
            icon="mdi-chevron-left" 
            @click.stop="rail = !rail" 
            class="rail-toggle" 
          />
        </template>
      </v-list-item>
      
      <!-- Profile completion alert -->
      <v-alert
        v-if="isNavigationDisabled"
        type="warning"
        variant="tonal"
        density="compact"
        class="profile-alert"
        :class="{ 'rail-alert': rail }"
      >
        <template v-if="!rail">
          <v-icon start>mdi-alert</v-icon>
          Complete your profile to access all features
        </template>
        <template v-else>
          <v-icon>mdi-alert</v-icon>
        </template>
        <v-tooltip v-if="rail" location="right" text="Complete your profile to access all features" />
      </v-alert>
    </div> 

    <v-divider />

    <!-- Navigation Items -->
    <v-list density="compact" nav>
      <v-list-item 
        v-for="item in filteredNavigationItems" 
        :key="item.title" 
        :prepend-icon="item.icon"
        :title="rail ? '' : item.title" 
        :to="isNavigationDisabled ? null : item.to" 
        link
        :active="router.currentRoute.value.path === item.to"
        class="nav-item"
        @click="handleNavClick"
        :disabled="isNavigationDisabled"
      >
        <v-tooltip v-if="rail && !isNavigationDisabled" location="right" :text="item.title" />
        <v-tooltip v-else-if="rail && isNavigationDisabled" location="right" text="Complete your profile to access this feature" />
      </v-list-item>
    </v-list>

    <!-- Bottom Actions -->
    <div class="bottom-actions">
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item 
          prepend-icon="mdi-logout" 
          :title="rail ? '' : 'Logout'" 
          @click="logoutUser" 
          class="logout-item"
          :disabled="false"
        >
          <v-tooltip v-if="rail" location="right" text="Logout" />
        </v-list-item>
      </v-list>
    </div>
  </v-navigation-drawer>

  <!-- Mobile overlay -->
  <v-overlay v-model="mobileOverlay" class="mobile-overlay" @click="closeMobileNav" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { logoutUser } from '@/utils/helper'
import apiService from '@/api/apiService'
import { useProfile } from '@/composables/useProfile'

// Router
const router = useRouter()

// Profile composable
const { profile, hasCompleteProfile, loadProfile } = useProfile()

// App title
const appTitle = 'MechConnect'

// Drawer state
const drawer = ref(true)
const rail = ref(false)
const mobileOverlay = ref(false)
const windowWidth = ref(window.innerWidth)

// User info
const loggedInUser = ref({}) 
const userRole = ref('')

// Check if role is valid and profile is complete
const isRoleValid = computed(() => {
  return !!userRole.value && userRole.value !== '' && hasCompleteProfile.value
})

// Check if navigation should be disabled
const isNavigationDisabled = computed(() => !hasCompleteProfile.value)

// Fetch user profile
onMounted(async () => {
  try {
    // Load profile using composable
    await loadProfile()
    
    // Update local refs
    loggedInUser.value = profile.value || {}
    userRole.value = profile.value?.roles?.[0]?.toLowerCase() || ''
    
    // Store role in localStorage for other components
    localStorage.setItem("role", userRole.value)
    
    // Set currency and phone code defaults
    localStorage.setItem("currencySymbol","R");
    localStorage.setItem("phoneCountryCode","+27")
    
    // Only navigate to dashboard if we have a complete profile
    if (hasCompleteProfile.value) {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
})

// Background images per role
const roleBackgrounds = {
  client: 'https://i.pinimg.com/736x/f9/59/7a/f9597a54166bbcdc9b9f593fbbe3cb35.jpg',
  mechanic: 'https://i.pinimg.com/1200x/98/37/dd/9837ddc4fd8a6ce78ffea7168fdd7380.jpg',
  admin: 'https://i.pinimg.com/736x/60/b7/c0/60b7c02ea75ac955b7a841b098725088.jpg',
  carwash: 'https://i.pinimg.com/736x/5b/a2/90/5ba29035f67d4454dce1710575ad0dc9.jpg',
  noRole: 'https://i.pinimg.com/736x/82/3e/28/823e2880c95e96a1a96448fb34fff3d0.jpg'
}

// Dynamic sidebar background
const sidebarStyle = computed(() => ({
  backgroundImage: `url(${roleBackgrounds[userRole.value] || roleBackgrounds.noRole})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

// Navigation items
const navigationItems = [
  { title: 'Home', icon: 'mdi-home', to: '/dashboard', roles: ['client','mechanic','admin','carwash','noRole'] },
  { title: 'Profile', icon: 'mdi-account', to: '/profile', roles: ['client','mechanic','admin','carwash'] },
  { title: 'Service Request', icon: 'mdi-car-wrench', to: '/request', roles: ['client'] }, 
  { title: 'Book Car Wash', icon: 'mdi-shower', to: '/book-wash', roles: ['client'] },
  { title: 'Service History', icon: 'mdi-history', to: '/history', roles: ['client'] },
  { title: 'Payments', icon: 'mdi-credit-card', to: '/payments', roles: ['client'] }, 
  { title: 'My Washes', icon: 'mdi-calendar-check', to: '/my-washes', roles: ['client'] },
  { title:'Help',icon:'mdi-help',to:'/help-page',roles:['client']},
  { title: 'Job Requests', icon: 'mdi-briefcase', to: '/jobs', roles: ['mechanic'] },
  { title: 'User Management', icon: 'mdi-account-multiple', to: '/users', roles: ['admin'] },
  { title: 'Bookings', icon: 'mdi-calendar-check', to: '/car-wash-bookings', roles: ['carwash'] },
  { title: 'Manage Washes', icon: 'mdi-shower', to: '/manage-washes', roles: ['carwash'] },
  { title: 'Earnings', icon: 'mdi-currency-usd', to: '/earnings', roles: ['carwash','mechanic'] }
]

// Filtered by role
const filteredNavigationItems = computed(() =>
  navigationItems.filter(item => item.roles.includes(userRole.value))
)

// Responsive behavior
const isMobile = computed(() => windowWidth.value < 960)
const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (isMobile.value) {
    drawer.value = false
    rail.value = false
  } else {
    drawer.value = true
  }
}
const handleNavClick = () => { if (isMobile.value) closeMobileNav() }
const openMobileNav = () => { if (isMobile.value) { drawer.value = true; mobileOverlay.value = true } }
const closeMobileNav = () => { drawer.value = false; mobileOverlay.value = false }


onUnmounted(() => { window.removeEventListener('resize', handleResize) })

defineExpose({ openMobileNav, closeMobileNav })
</script>

<style scoped>
.sidebar-nav {
  height: 100vh;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.bottom-actions {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: aliceblue;
}

.brand-section {
  padding: 10px 16px;
}

.nav-item {
  cursor: pointer;
}

.logout-item {
  cursor: pointer;
}

.profile-alert {
  margin: 8px 0;
  font-size: 0.75rem;
}

.rail-alert {
  text-align: center;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .sidebar-nav {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 256px;
  }
  
  .brand-section {
    padding: 8px 12px;
  }
  
  .profile-alert {
    font-size: 0.7rem;
    margin: 6px 0;
  }
}

@media (max-width: 600px) {
  .sidebar-nav {
    width: 100vw;
  }
  
  .brand-section {
    padding: 6px 8px;
  }
  
  .profile-alert {
    font-size: 0.65rem;
  }
}

/* Ensure proper scrolling on mobile */
@media (max-width: 960px) {
  .sidebar-nav {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
