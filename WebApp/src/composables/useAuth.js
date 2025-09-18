import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null);
const token = ref(localStorage.getItem('token'));

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!token.value);

  const login = (userData, authToken) => {
    user.value = userData;
    token.value = authToken;
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  };

  const checkAuth = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken !== token.value) {
      token.value = storedToken;
      if (!storedToken) {
        user.value = null;
      }
    }
  };

  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated,
    login,
    logout,
    checkAuth
  };
}
