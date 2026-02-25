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
import { ref, computed, watch } from "vue";
import { countries } from "@/utils/helper";

defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:modelValue", "valid"]);

const selectedCountry = ref(countries[0]);
const phone = ref("");
const isTyping = ref(false); // track if user is typing

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
  emit("valid", isValid.value);
}

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
