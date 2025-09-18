<template>
  <v-btn
    :class="buttonClass"
    :color="computedColor"
    :size="size"
    :variant="variant"
    :disabled="disabled || loading"
    :loading="loading"
    :block="block"
    :rounded="rounded"
    :elevation="elevation"
    :depressed="depressed"
    :flat="flat"
    :tile="tile"
    :outlined="outlined"
    :text="text"
    :icon="icon"
    :width="width"
    :height="height"
    :min-width="minWidth"
    :max-width="maxWidth"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Loading spinner (when loading) -->
    <template v-if="loading" #prepend>
      <v-progress-circular
        :size="loadingSize"
        :width="2"
        indeterminate
        :color="loadingColor"
      />
    </template>

    <!-- Icon (when not loading or when showIconWhenLoading is true) -->
    <template v-if="icon && (!loading || showIconWhenLoading)" #prepend>
      <v-icon :size="iconSize" :color="iconColor">
        {{ icon }}
      </v-icon>
    </template>

    <!-- Button content -->
    <span v-if="!icon" class="button-text">{{ label }}</span>

    <!-- Tooltip -->
    <v-tooltip
      v-if="tooltip"
      :text="tooltip"
      :location="tooltipLocation"
      :disabled="disabled || loading"
    >
      <template #activator="{ props }">
        <div v-bind="props">
          <slot />
        </div>
      </template>
    </v-tooltip>

    <!-- Custom content slot -->
    <slot v-if="$slots.default" />
  </v-btn>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  // Content
  label: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },

  // Style variants
  variant: {
    type: String,
    default: 'elevated',
    validator: (value) => [
      'elevated', 'flat', 'tonal', 'outlined', 'text', 'plain'
    ].includes(value)
  },
  color: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['x-small', 'small', 'default', 'large', 'x-large'].includes(value)
  },

  // Layout
  block: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: Boolean,
    default: false
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  },
  minWidth: {
    type: [String, Number],
    default: undefined
  },
  maxWidth: {
    type: [String, Number],
    default: undefined
  },

  // State
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },

  // Visual properties
  elevation: {
    type: [Number, String],
    default: undefined
  },
  depressed: {
    type: Boolean,
    default: false
  },
  flat: {
    type: Boolean,
    default: false
  },
  tile: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  },
  text: {
    type: Boolean,
    default: false
  },

  // Icon properties
  iconSize: {
    type: [String, Number],
    default: undefined
  },
  iconColor: {
    type: String,
    default: undefined
  },
  showIconWhenLoading: {
    type: Boolean,
    default: false
  },

  // Loading properties
  loadingSize: {
    type: [String, Number],
    default: 16
  },
  loadingColor: {
    type: String,
    default: 'white'
  },

  // Tooltip
  tooltip: {
    type: String,
    default: ''
  },
  tooltipLocation: {
    type: String,
    default: 'top',
    validator: (value) => [
      'top', 'bottom', 'left', 'right', 'start', 'end'
    ].includes(value)
  },

  // Custom class
  customClass: {
    type: String,
    default: ''
  },

  // Button type for forms
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  }
})

// Emits
const emit = defineEmits(['click', 'mouseenter', 'mouseleave'])

// Computed properties
const computedColor = computed(() => {
  if (props.disabled) return 'grey-lighten-2' // Light grey for disabled state
  return props.color
})

const buttonClass = computed(() => {
  const classes = ['custom-button']
  
  if (props.customClass) {
    classes.push(props.customClass)
  }

  // Size-based classes
  if (props.size === 'x-small') classes.push('btn-xs')
  if (props.size === 'small') classes.push('btn-sm')
  if (props.size === 'large') classes.push('btn-lg')
  if (props.size === 'x-large') classes.push('btn-xl')

  // Variant-based classes
  if (props.variant === 'elevated') classes.push('btn-elevated')
  if (props.variant === 'flat') classes.push('btn-flat')
  if (props.variant === 'tonal') classes.push('btn-tonal')
  if (props.variant === 'outlined') classes.push('btn-outlined')
  if (props.variant === 'text') classes.push('btn-text')
  if (props.variant === 'plain') classes.push('btn-plain')

  // State-based classes
  if (props.loading) classes.push('btn-loading')
  if (props.disabled) classes.push('btn-disabled')
  if (props.rounded) classes.push('btn-rounded')

  // Color-based classes
  if (props.color === 'primary') classes.push('btn-primary')
  if (props.color === 'secondary') classes.push('btn-secondary')
  if (props.color === 'success') classes.push('btn-success')
  if (props.color === 'error') classes.push('btn-error')
  if (props.color === 'warning') classes.push('btn-warning')
  if (props.color === 'info') classes.push('btn-info')

  return classes.join(' ')
})

// Methods
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleMouseEnter = (event) => {
  if (!props.disabled) {
    emit('mouseenter', event)
  }
}

const handleMouseLeave = (event) => {
  if (!props.disabled) {
    emit('mouseleave', event)
  }
}
</script>

<style scoped>
.custom-button {
  transition: all 0.2s ease-in-out;
  text-transform: none;
  align-self: center;
  font-weight: 500;
  letter-spacing: 0.025em;
  width: 30% !important; /* Make buttons even smaller than inputs */
  border-radius: 8px !important; /* Match input border radius */
}

/* Size variants - smaller than input width */
.btn-xs {
  font-size: 0.75rem;
  padding: 4px 8px;
  min-width: 32px;
  width: 30%; /* Smaller than input */
}

.btn-sm {
  font-size: 0.875rem;
  padding: 6px 12px;
  min-width: 40px;
  width: 30%; /* Smaller than input */
}

.btn-lg {
  font-size: 1.125rem;
  padding: 12px 24px;
  min-width: 64px;
  width: 30%; /* Smaller than input */
}

.btn-xl {
  font-size: 1.25rem;
  padding: 16px 32px;
  min-width: 80px;
  width: 30%; /* Smaller than input */
}

/* Variant styles - matching input border radius (8px) */
.btn-elevated {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.btn-elevated:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-flat {
  box-shadow: none;
  border-radius: 8px;
}

.btn-tonal {
  opacity: 0.9;
  border-radius: 8px;
}

.btn-outlined {
  border-width: 1px;
  border-style: solid;
  border-radius: 8px;
}

.btn-text {
  background: transparent;
  box-shadow: none;
  border-radius: 8px;
}

.btn-plain {
  background: transparent;
  box-shadow: none;
  text-decoration: underline;
  border-radius: 8px;
}

/* State styles */
.btn-loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-disabled {
  cursor: not-allowed;
  background-color: #f5f5f5 !important; /* Light grey */
  color: #9e9e9e !important; /* Light grey text */
  border-color: #e0e0e0 !important; /* Light grey border */
}

.btn-rounded {
  border-radius: 24px;
}

/* Color variants */
.btn-primary {
  --btn-bg: #1976d2;
  --btn-color: white;
}

.btn-secondary {
  --btn-bg: #424242;
  --btn-color: white;
}

.btn-success {
  --btn-bg: #4caf50;
  --btn-color: white;
}

.btn-error {
  --btn-bg: #f44336;
  --btn-color: white;
}

.btn-warning {
  --btn-bg: #ff9800;
  --btn-color: white;
}

.btn-info {
  --btn-bg: #2196f3;
  --btn-color: white;
}

/* Hover effects */
.custom-button:hover:not(.btn-disabled):not(.btn-loading) {
  transform: translateY(-1px);
}

/* Text variant buttons - only cursor change, no background */
.btn-text:hover:not(.btn-disabled):not(.btn-loading) {
  transform: none;
  cursor: pointer;
}

.btn-plain:hover:not(.btn-disabled):not(.btn-loading) {
  transform: none;
  cursor: pointer;
}

/* Solid buttons - background color change on hover */
.btn-primary:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #1565c0 !important;
}

.btn-secondary:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #303030 !important;
}

.btn-success:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #388e3c !important;
}

.btn-error:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #d32f2f !important;
}

.btn-warning:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #f57c00 !important;
}

.btn-info:hover:not(.btn-disabled):not(.btn-loading):not(.btn-text):not(.btn-plain) {
  background-color: #1976d2 !important;
}

/* Active state */
.custom-button:active:not(.btn-disabled):not(.btn-loading) {
  transform: translateY(0);
}

/* Text variant buttons - no transform on active */
.btn-text:active:not(.btn-disabled):not(.btn-loading) {
  transform: none;
}

.btn-plain:active:not(.btn-disabled):not(.btn-loading) {
  transform: none;
}

/* Focus state */
.custom-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Icon button specific styles */
.custom-button :deep(.v-btn__prepend) {
  margin-inline-end: 8px;
}

.custom-button :deep(.v-btn__append) {
  margin-inline-start: 8px;
}

/* Button text styling */
.button-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading spinner styling */
.custom-button :deep(.v-progress-circular) {
  margin-inline-end: 8px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .custom-button {
    font-size: 0.875rem;
  }
  
  .btn-lg {
    font-size: 1rem;
    padding: 10px 20px;
  }
  
  .btn-xl {
    font-size: 1.125rem;
    padding: 14px 28px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .custom-button {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .custom-button {
    transition: none;
  }
  
  .custom-button:hover:not(.btn-disabled):not(.btn-loading) {
    transform: none;
  }
}

/* Button disabled state overrides */
.custom-button :deep(.v-btn--disabled) {
  background-color: #f5f5f5 !important;
  color: #9e9e9e !important;
  border-color: #e0e0e0 !important;
  opacity: 1 !important;
}

.custom-button :deep(.v-btn--disabled .v-btn__content) {
  color: #9e9e9e !important;
}

.custom-button :deep(.v-btn--disabled .v-icon) {
  color: #9e9e9e !important;
}
</style>
