<template>
  <div class="input-field-container">
    <label class="input-label font-weight-bold">{{ label }}</label>
    <v-text-field
      v-model="internalValue"
      :type="inputTypeComputed"
      :placeholder="computedPlaceholder"
      :disabled="disabled"
      :required="required"
      :rules="computedRules"
      :prefix="computedPrefix"
      :error-messages="errorMessages"
      :success="success"
      :success-messages="successMessages"
      :hint="hint"
      :persistent-hint="persistentHint"
      :clearable="clearable"
      :readonly="readonly"
      :outlined="outlined"
      :filled="filled"
      :solo="solo"
      :dense="dense"
      :hide-details="hideDetails"
      :class="fieldClass"
      variant="outlined"
      @update:model-value="onInput"
    >
      <!-- Append icon (eye for password, others for info) -->
      <template #append-inner>
        <v-icon
          v-if="computedAppendIcon"
          class="append-icon"
          @click="handleAppendClick"
        >
          {{ computedAppendIcon }}
        </v-icon>
      </template>

      <!-- Optional prepend slot -->
      <template #prepend-inner>
        <slot name="prepend"></slot>
      </template>
    </v-text-field>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'




// Props
const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  extraRules: { type: Array, default: () => [] },
  currencySymbol: { type: String, default: "R" },
  countryCode: { type: String, default: "+27" },
  disabled: { type: Boolean, default: false },
  errorMessages: { type: [String, Array], default: () => [] },
  success: { type: Boolean, default: false },
  successMessages: { type: [String, Array], default: () => [] },
  hint: { type: String, default: "" },
  persistentHint: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  outlined: { type: Boolean, default: true },
  filled: { type: Boolean, default: false },
  solo: { type: Boolean, default: false },
  dense: { type: Boolean, default: true },
  hideDetails: { type: Boolean, default: false },
  fieldClass: { type: String, default: "" }
})

// Emits
const emit = defineEmits(['update:modelValue', 'input'])

// Reactive data
const internalValue = ref(props.modelValue || "")
const showPassword = ref(false)

// Computed: password field detection
const isPasswordField = computed(() => props.type === "password" || props.label.toLowerCase().includes("password"))
const inputTypeComputed = computed(() => {
  if (isPasswordField.value) return showPassword.value ? "text" : "password"
  if (props.type === "money") return "text"
  return props.type
})

// Computed: prepend prefix
const computedPrefix = computed(() => {
  if (props.type === "money") return props.currencySymbol
  if (props.type === "tel" && props.label.toLowerCase().includes("phone")) return props.countryCode
  return ""
})

// Computed: placeholder
const computedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (props.type === "money") return `${props.currencySymbol} 0.00`
  return `Enter ${props.label}`
})

// Computed: append icon
const computedAppendIcon = computed(() => {
  if (isPasswordField.value) return showPassword.value ? 'mdi-eye-off' : 'mdi-eye'
  if (props.label.toLowerCase().includes("username")) return 'mdi-account-outline'
  if (props.label.toLowerCase().includes("email")) return 'mdi-email-outline'
  if (props.label.toLowerCase().includes("phone")) return 'mdi-phone-outline'
  return ""
})

// Computed: rules
const computedRules = computed(() => {
  const rules = []
  if (props.required) rules.push(v => !!v || `${props.label} is required`)
  if (props.type === "email") rules.push(v => !v || /.+@.+\..+/.test(v) || "Enter a valid email")
  if (props.type === "tel") rules.push(v => !v || /^[0-9\s\-\(\)]+$/.test(v) || "Enter a valid phone")
  if (props.type === "money") rules.push(v => !v || !isNaN(Number(v.replace(/,/g, ""))) || "Enter a valid amount")
  return [...rules, ...props.extraRules]
})

// Methods
const handleAppendClick = () => {
  if (isPasswordField.value) showPassword.value = !showPassword.value
}

// Input handler
const onInput = (value) => {
  if (props.type === "money") {
    const numeric = value.replace(/[^0-9]/g, "")
    internalValue.value = formatMoney(numeric)
    emit('update:modelValue', numeric)
    emit('input', numeric)
  } else {
    internalValue.value = value
    emit('update:modelValue', value)
    emit('input', value)
  }
}

// Watch external changes
watch(() => props.modelValue, val => internalValue.value = val || "", { immediate: true })

// Money formatting
function formatMoney(value) {
  if (!value) return ""
  let intPart = value.slice(0, -2) || "0"
  let decimalPart = value.slice(-2).padEnd(2, "0")
  intPart = parseInt(intPart, 10).toLocaleString()
  return `${intPart}.${decimalPart}`
}
</script>

<style scoped>
.input-field-container {
  width: 100%;
  margin-bottom: 16px;
}
.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #424242;
}
.append-icon {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
