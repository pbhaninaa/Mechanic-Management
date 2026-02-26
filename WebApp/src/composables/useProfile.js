import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '@/api/apiService'

export function useProfile() {
  const router = useRouter()
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Check if user has a complete profile
  const hasCompleteProfile = computed(() => {
    if (!profile.value) return false

    // Base required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'roles']
    const baseOk = requiredFields.every(field => {
      const value = profile.value[field]
      return value !== null && value !== undefined && value !== '' &&
             (Array.isArray(value) ? value.length > 0 : true)
    })
    if (!baseOk) return false

    // MECHANIC and CAR_WASH need address for collection directions
    const role = profile.value.roles?.[0]
    if (role === 'MECHANIC' || role === 'CARWASH') {
      const addr = profile.value.address
      return !!addr && typeof addr === 'string' && addr.trim().length > 0
    }
    return true
  })

  // Check if user has any profile at all
  const hasProfile = computed(() => {
    return profile.value !== null && profile.value !== undefined
  })

  // Get profile from localStorage or API
  const loadProfile = async () => {
    loading.value = true
    error.value = null

    try {
      // First try localStorage
      const stored = localStorage.getItem('userProfile')
      if (stored) {
        profile.value = JSON.parse(stored)
        return profile.value
      }

      // Fallback to API — ApiResponse wraps profile in .data
      const response = await apiService.getUserProfile()
      profile.value = response?.data ?? response
      localStorage.setItem('userProfile', JSON.stringify(profile.value))
      return profile.value
    } catch (err) {
      console.error('Failed to load profile:', err)
      error.value = err.message || 'Failed to load profile'
      profile.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  // Clear profile data
  const clearProfile = () => {
    profile.value = null
    localStorage.removeItem('userProfile')
    localStorage.removeItem('role')
  }

  // Refresh profile from API — ApiResponse wraps profile in .data
  const refreshProfile = async () => {
    try {
      const response = await apiService.getUserProfile()
      profile.value = response?.data ?? response
      localStorage.setItem('userProfile', JSON.stringify(profile.value))
      
      // Also store role in localStorage for immediate access
      if (profile.value?.roles?.[0]) {
        localStorage.setItem('role', profile.value.roles[0].toLowerCase())
      }
      
      return profile.value
    } catch (err) {
      console.error('Failed to refresh profile:', err)
      error.value = err.message || 'Failed to refresh profile'
      return null
    }
  }

  // Check profile and redirect if needed
  const checkProfileAndRedirect = async (redirectToProfileCreation = true) => {
    await loadProfile()
    
    if (!hasCompleteProfile.value && redirectToProfileCreation) {
      router.push({ name: 'CreateProfile' })
      return false
    }
    
    return hasCompleteProfile.value
  }

  return {
    profile,
    loading,
    error,
    hasProfile,
    hasCompleteProfile,
    loadProfile,
    clearProfile,
    refreshProfile,
    checkProfileAndRedirect
  }
}
