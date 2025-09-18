<template>
  <div class="input-field-container">
    <label class="input-label font-weight-bold">{{ label }}</label>
    <v-select
      v-model="internalValue"
      :items="items"
      :label="label"
      :placeholder="computedPlaceholder"
      :multiple="multiple"
      :chips="multiple"
      :disabled="disabled"
      :required="required"
      :rules="computedRules"
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
      <template #prepend-inner>
        <slot name="prepend"></slot>
      </template>
      <template #append-inner>
        <v-icon v-if="computedAppendIcon" class="append-icon" @click="handleAppendClick">
          {{ computedAppendIcon }}
        </v-icon>
      </template>
    </v-select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: "" },
  label: { type: String, required: true },
  items: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
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
  fieldClass: { type: String, default: "" },
  appendIcon: { type: String, default: "" }
})

const emit = defineEmits(['update:modelValue', 'input'])

const internalValue = ref(props.modelValue || "")

watch(() => props.modelValue, val => internalValue.value = val || "", { immediate: true })

const computedPlaceholder = computed(() => props.placeholder || `Select ${props.label}`)

const computedRules = computed(() => {
  const rules = []
  if (props.required) rules.push(v => (Array.isArray(v) ? v.length > 0 : !!v) || `${props.label} is required`)
  return rules
})

const computedAppendIcon = computed(() => props.appendIcon || "")

const handleAppendClick = () => {
  // Can emit event or toggle something if needed
}

const onInput = (value) => {
  internalValue.value = value
  emit('update:modelValue', value)
  emit('input', value)
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
