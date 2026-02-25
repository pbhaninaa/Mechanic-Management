import { computed } from 'vue';
import { countries } from '@/utils/helper';
import { getSafeJson } from '@/utils/storage';

const DEFAULT_CURRENCY = 'R'; // South Africa fallback

/**
 * Get currency symbol from country code (e.g. "+27" -> "R", "+1" -> "$")
 */
export function getCurrencyFromCountryCode(countryCode) {
  if (!countryCode) return DEFAULT_CURRENCY;
  const country = countries.find(c => c.code === countryCode);
  return country?.currency ?? DEFAULT_CURRENCY;
}

/**
 * Composable: returns currency symbol and format function based on logged-in user's profile country
 */
export function useCurrency() {
  const currencySymbol = computed(() => {
    const profile = getSafeJson('userProfile', {}) || getSafeJson('profile', {});
    const countryCode = profile?.countryCode || localStorage.getItem('phoneCountryCode') || '+27';
    return getCurrencyFromCountryCode(countryCode);
  });

  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '—';
    return `${currencySymbol.value} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { currencySymbol, formatCurrency, getCurrencyFromCountryCode };
}
