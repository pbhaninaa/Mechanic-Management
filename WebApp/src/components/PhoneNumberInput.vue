<template>
  <v-row dense class="input-field-container">
    <!-- Country (searchable) -->
    <v-col cols="2">
      <v-autocomplete
        v-model="selectedCountry"
        :items="countries"
        item-title="label"
        return-object
        variant="outlined"
        label="Country"
        :disabled="disabled"
        hide-no-data
        hide-details
      />
    </v-col>

    <!-- Phone -->
    <v-col cols="10">
      <v-text-field
        v-model="phone"
        label="Phone Number"
        type="tel"
        variant="outlined"
        :maxlength="selectedCountry.maxLength"
        :disabled="disabled"
        :error="phone.length > 0 && !isValid"
        :hint="showHint ? hint : ''"
        :persistent-hint="false"
        @input="onInput"
        @focus="isTyping = true"
        @blur="isTyping = false"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { countries } from "@/utils/helper";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  initialValue: {
    type: String,
    default: ""
  },
  initialCountryCode: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "update:countryCode", "valid"]);

const selectedCountry = ref(countries[0]);
const phone = ref("");
const isTyping = ref(false); // track if user is typing
const hasInitialized = ref(false);

const isValid = computed(
  () => phone.value.length === selectedCountry.value.maxLength
);

const hint = computed(() =>
  selectedCountry.value.iso === "ZA"
    ? "Enter 9 digits (without leading 0)"
    : `Enter ${selectedCountry.value.maxLength} digits`
);

// show hint only while typing and input is not valid
const showHint = computed(() => isTyping.value && !isValid.value);

function parseInitialValue(value, countryCode) {
  if (!value || typeof value !== "string") return { country: countries[0], phone: "" };
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return { country: countries[0], phone: "" };

  const code = countryCode || "";
  let country = countries.find((c) => c.code === code);

  let localPhone = digitsOnly;
  if (country) {
    const codeDigits = country.code.replace(/\D/g, "");
    if (digitsOnly.startsWith(codeDigits)) {
      localPhone = digitsOnly.slice(codeDigits.length);
    }
  } else {
    // Try to detect country from full number (longest match first)
    const sortedByCodeLength = [...countries].sort(
      (a, b) => (b.code.replace(/\D/g, "").length - a.code.replace(/\D/g, "").length)
    );
    for (const c of sortedByCodeLength) {
      const codeDigits = c.code.replace(/\D/g, "");
      if (digitsOnly.startsWith(codeDigits)) {
        country = c;
        localPhone = digitsOnly.slice(codeDigits.length);
        break;
      }
    }
  }

  country = country || countries[0];
  if (country.iso === "ZA" && localPhone.startsWith("0")) {
    localPhone = localPhone.slice(1);
  }
  return { country, phone: localPhone };
}

function applyInitialValue() {
  const full = props.initialValue || props.modelValue;
  if (!full) {
    hasInitialized.value = true;
    return;
  }

  const { country, phone: localPhone } = parseInitialValue(
    full,
    props.initialCountryCode
  );
  hasInitialized.value = false; // temporarily so country watch doesn't clear phone
  selectedCountry.value = country;
  phone.value = localPhone;
  hasInitialized.value = true;
  emitValue();
}

function onInput() {
  // digits only
  phone.value = phone.value.replace(/\D/g, "");

  // SA rule: remove leading zero
  if (selectedCountry.value.iso === "ZA" && phone.value.startsWith("0")) {
    phone.value = phone.value.slice(1);
  }

  emitValue();
}

function emitValue() {
  const fullNumber = isValid.value
    ? `${selectedCountry.value.code}${phone.value}`
    : "";

  emit("update:modelValue", fullNumber);
  emit("update:countryCode", selectedCountry.value.code);
  emit("valid", isValid.value);
}

onMounted(() => {
  applyInitialValue();
});

watch(
  () => [props.initialValue, props.initialCountryCode],
  () => {
    if (!hasInitialized.value || props.initialValue || props.initialCountryCode) {
      applyInitialValue();
    }
  },
  { deep: true }
);

watch(selectedCountry, () => {
  // Only clear phone when user changes country (after init), not during applyInitialValue
  if (hasInitialized.value) {
    phone.value = "";
  }
  emitValue();
});
</script>

<style scoped>
.input-field-container {
  width: 100%;
  margin-bottom: 16px;
}
</style>
