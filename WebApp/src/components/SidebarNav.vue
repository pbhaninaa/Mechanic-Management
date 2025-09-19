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
    </div> 

    <v-divider />

    <!-- Navigation Items -->
    <v-list density="compact" nav>
      <v-list-item 
        v-for="item in filteredNavigationItems" 
        :key="item.title" 
        :prepend-icon="item.icon"
        :title="rail ? '' : item.title" 
        :to="item.to" 
        link
        :active="router.currentRoute.value.path === item.to"
        class="nav-item"
        @click="handleNavClick"
      >
        <v-tooltip v-if="rail" location="right" :text="item.title" />
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


// Router
const router = useRouter()

// App title
const appTitle = 'MechConnect'

// Drawer state
const drawer = ref(true)
const rail = ref(false)
const mobileOverlay = ref(false)
const windowWidth = ref(window.innerWidth)

// User info
const loggedInUser = ref(JSON.parse(localStorage.getItem('userProfile') || '{}')) 
const userRole = ref(localStorage.getItem('role') || 'client')

// Fetch user profile
onMounted(async () => {
  try {
    const res = await apiService.getUserProfile()
    localStorage.setItem('userProfile', JSON.stringify(res.data || {}))
    loggedInUser.value = res.data || {}
    userRole.value = res.data?.roles?.[0]?.toLowerCase() || 'client'
    localStorage.setItem("currencySymbol","R");
    localStorage.setItem("phoneCountryCode","+27")
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
  noRole: 'https://i.pinimg.com/736x/5b/a2/90/5ba29035f67d4454dce1710575ad0dc9.jpg'

}

// Dynamic sidebar background
const sidebarStyle = computed(() => ({
  backgroundImage: `url(${roleBackgrounds[userRole.value] || roleBackgrounds.client})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

// Navigation items
const navigationItems = [
  // Common
  { title: 'Home', icon: 'mdi-home', to: '/dashboard', roles: ['client','mechanic','admin','carwash','noRole'] },
  { title: 'Profile', icon: 'mdi-account', to: '/profile', roles: ['client','mechanic','admin','carwash'] },
  

  // Client
  { title: 'Service Request', icon: 'mdi-car-wrench', to: '/request', roles: ['client'] }, 
  { title: 'Book Car Wash', icon: 'mdi-shower', to: '/book-wash', roles: ['client'] },
  { title: 'Service History', icon: 'mdi-history', to: '/history', roles: ['client'] },
  { title: 'Payments', icon: 'mdi-credit-card', to: '/payments', roles: ['client'] }, 
  { title: 'My Washes', icon: 'mdi-calendar-check', to: '/my-washes', roles: ['client'] },
  {title:'Help',icon:'mdi-help',to:'/help-page',roles:['client']},

  // Mechanic
  { title: 'Job Requests', icon: 'mdi-briefcase', to: '/jobs', roles: ['mechanic'] },

  // Admin
  { title: 'User Management', icon: 'mdi-account-multiple', to: '/users', roles: ['admin'] },

  // CarWash
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

onMounted(() => { window.addEventListener('resize', handleResize); handleResize() })
onUnmounted(() => { window.removeEventListener('resize', handleResize) })

defineExpose({ openMobileNav, closeMobileNav })
</script>

<style scoped>
.sidebar-nav {
  height: 100vh;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
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
</style>
