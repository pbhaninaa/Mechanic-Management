<template>
  <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click.stop="rail = false" class="sidebar-nav"
    :style="sidebarStyle">
    <!-- Brand Section - click 5x to reset db (dev) -->
    <div class="brand-section" @click="onBrandClick">
      <v-list-item :title="rail ? '' : appTitle" :subtitle="rail ? '' : loggedInUser.firstName" class="brand-item">
        <template v-slot:append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail" class="rail-toggle" />
        </template>
      </v-list-item>
    </div>

    <v-divider />

    <!-- Navigation Items -->
    <v-list density="compact" nav>
      <template v-for="item in filteredNavigationItems" :key="item.title">
        <!-- Grouped items (nested) -->
        <v-list-group v-if="item.children && item.children.length" :value="item.title" class="nav-item"
          :disabled="!isRoleValid">
          <template #activator="{ props }">
            <v-list-item v-bind="props" :prepend-icon="item.icon" :title="rail ? '' : item.title"
              :disabled="!isRoleValid">
              <v-tooltip v-if="rail && isRoleValid" location="right" :text="item.title" />
            </v-list-item>
          </template>

          <v-list-item v-for="child in item.children" :key="child.title" :prepend-icon="child.icon"
            :title="rail ? '' : child.title" :to="child.to" link :active="router.currentRoute.value.path === child.to"
            class="nav-item" @click="handleNavClick" :disabled="!isRoleValid">
            <v-tooltip v-if="rail && isRoleValid" location="left" :text="child.title" />
          </v-list-item>
        </v-list-group>

        <!-- Regular single items -->
        <v-list-item v-else :prepend-icon="item.icon" :title="rail ? '' : item.title" :to="item.to" link
          :active="router.currentRoute.value.path === item.to" class="nav-item" @click="handleNavClick"
          :disabled="!isRoleValid">
          <v-tooltip v-if="rail && isRoleValid" location="right" :text="item.title" />
        </v-list-item>
      </template>
    </v-list>

    <!-- Bottom Actions -->
    <div class="bottom-actions">
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-logout" :title="rail ? '' : 'Logout'" @click="logoutUser" class="logout-item"
          :disabled="!isRoleValid">
          <v-tooltip v-if="rail && isRoleValid" location="right" text="Logout" />
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
import { COLORS } from '@/utils/constants'

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
import { getSafeJson } from "@/utils/storage";
import { toast } from "@/utils/toast";
const loggedInUser = ref(getSafeJson("userProfile", {}) || {})
const userRole = ref(localStorage.getItem('role') || '')

// Dev: 5 clicks on brand triggers db reset (admin only)
const brandClickCount = ref(0)
const brandClickTimer = ref(null)
const onBrandClick = async () => {
  if (userRole.value !== 'admin') return
  brandClickCount.value++
  clearTimeout(brandClickTimer.value)
  brandClickTimer.value = setTimeout(() => { brandClickCount.value = 0 }, 2000)
  if (brandClickCount.value >= 5) {
    brandClickCount.value = 0
    try {
      await apiService.resetDb()
      window.dispatchEvent(new Event('authChanged'))
    } catch (err) {
      toast.error(err?.message || 'Failed to reset database')
    }
  }
}

// Check if role is valid
const isRoleValid = computed(() => !!userRole.value && userRole.value !== '')

const loadProfile = async () => {
  try {
    const res = await apiService.getUserProfile()
    localStorage.setItem('userProfile', JSON.stringify(res.data || {}))
    loggedInUser.value = res.data || {}
    userRole.value = res.data?.roles?.[0]?.toLowerCase() || ''
    return { ok: true }
  } catch (error) {
    const status = error.status || error.response?.status
    const message = error.data?.message || error.response?.data?.message || error.message
    if (status === 404 && message?.includes?.('Profile does not exist')) {
      router.push('/create-profile')
      return { ok: false, needsProfile: true }
    }
    console.error('Failed to load user profile:', error)
    return { ok: false }
  }
}

const onAuthChanged = () => {
  if (!localStorage.getItem('token')) return
  const stored = getSafeJson('userProfile', {})
  if (stored?.firstName) {
    loggedInUser.value = stored
    userRole.value = stored?.roles?.[0]?.toLowerCase() || ''
    return
  }
  loadProfile()
}

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
  { title: 'Home', icon: 'mdi-home', to: '/dashboard', roles: ['client', 'mechanic', 'admin', 'carwash', 'noRole'] },
  { title: 'Profile', icon: 'mdi-account', to: '/profile', roles: ['client', 'mechanic', 'admin', 'carwash'] },
  { title: 'Service Request', icon: 'mdi-car-wrench', to: '/request', roles: ['client'] },
  { title: 'Book Car Wash', icon: 'mdi-shower', to: '/book-wash', roles: ['client'] },
  { title: 'Service History', icon: 'mdi-history', to: '/history', roles: ['client'] },  
  { title: 'My Washes', icon: 'mdi-calendar-check', to: '/my-washes', roles: ['client'] },
  { title: 'Payments', icon: 'mdi-credit-card', to: '/payments', roles: ['client'] },
  { title: 'Help', icon: 'mdi-help', to: '/help-page', roles: ['client'] },
  { title: 'Job Requests', icon: 'mdi-briefcase', to: '/jobs', roles: ['mechanic'] },
  { title: 'Manage Jobs', icon: 'mdi-wrench', to: '/manage-jobs', roles: ['mechanic'] },

  { title: 'User Management', icon: 'mdi-account-multiple', to: '/users', roles: ['admin'] },
  { title: 'Additional Fees', icon: 'mdi-cash-plus', to: '/additional-fees', roles: ['admin'] },
  {
    title: 'Manage Payments',
    icon: 'mdi-credit-card',
    roles: ['admin'],
    children: [
      { title: 'Payments', icon: 'mdi-credit-card', to: '/payments' },
      { title: 'Earnings', icon: 'mdi-currency-usd', to: '/earnings' }
    ]
  }, {
    title: 'Manage Requests',
    icon: 'mdi-clipboard-list',
    roles: ['admin'],
    children: [
      { title: 'Carwash management', icon: 'mdi-car-wash', to: '/car-wash-bookings' },
      { title: 'Mechanic management', icon: 'mdi-car-wrench', to: '/jobs' }
    ]
  },



  { title: 'Bookings', icon: 'mdi-calendar-check', to: '/car-wash-bookings', roles: ['carwash'] },
  { title: 'Manage Washes', icon: 'mdi-car-wash', to: '/manage-washes', roles: ['carwash'] },
  { title: 'Earnings', icon: 'mdi-currency-usd', to: '/earnings', roles: ['carwash', 'mechanic'] },
    { title: 'My Services', icon: 'mdi-format-list-bulleted-type', to: '/my-services', roles: ['mechanic', 'carwash'] }
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

onMounted(() => {
  loadProfile()
  window.addEventListener('resize', handleResize)
  window.addEventListener('authChanged', onAuthChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('authChanged', onAuthChanged)
})

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
