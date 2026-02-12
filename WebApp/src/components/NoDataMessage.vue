<template>
  <div v-if="itemsLength === 0 && !loading" class="mt-3">
    <slot>{{ message }}</slot>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps({
  message: { type: String, default: 'No items found.' },
  itemsLength: { type: Number, required: true },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.mt-3 {
  margin-top: 1rem;
}
</style>
