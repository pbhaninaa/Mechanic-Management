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

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { countries } from "@/utils/helper";

const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  initialValue: { type: String, default: "" } // for edit mode
});

const emit = defineEmits(["update:modelValue", "valid"]);

const selectedCountry = ref(countries[0]);
const phone = ref("");
const isTyping = ref(false);

// Function to set country and phone from full number
function setInitialPhone(value: string) {
  if (!value) return;
  const matchedCountry = countries.find(c => value.startsWith(c.code));
  if (matchedCountry) {
    selectedCountry.value = matchedCountry;
    phone.value = value.slice(matchedCountry.code.length);

    // Remove leading 0 for ZA
    if (matchedCountry.iso === "ZA" && phone.value.startsWith("0")) {
      phone.value = phone.value.slice(1);
    }
  }
}

// Run on mounted
onMounted(() => {
  setInitialPhone(props.initialValue);
});

// ✅ Watch for changes in initialValue (reactive update)
watch(
  () => props.initialValue,
  (newVal) => {
    setInitialPhone(newVal);
  },
  { immediate: true } // ensures it runs even if initialValue is already set
);

// Computed validations
const isValid = computed(() => phone.value.length === selectedCountry.value.maxLength);

const hint = computed(() =>
  selectedCountry.value.iso === "ZA"
    ? "Enter 9 digits (without leading 0)"
    : `Enter ${selectedCountry.value.maxLength} digits`
);

const showHint = computed(() => isTyping.value && !isValid.value);

// Input handler
function onInput() {
  phone.value = phone.value.replace(/\D/g, "");
  if (selectedCountry.value.iso === "ZA" && phone.value.startsWith("0")) {
    phone.value = phone.value.slice(1);
  }
  emitValue();
}

function emitValue() {
  const fullNumber = isValid.value ? `${selectedCountry.value.code}${phone.value}` : "";
  emit("update:modelValue", fullNumber);
  emit("valid", isValid.value);
}

// Reset phone if country changes
watch(selectedCountry, () => {
  phone.value = "";
  emitValue();
});
</script>


<style scoped>
.input-field-container {
  width: 100%;
  margin-bottom: 16px;
}
</style>
