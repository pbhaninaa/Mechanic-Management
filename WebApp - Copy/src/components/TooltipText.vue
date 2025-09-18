<template>
  <v-tooltip bottom>
    <template #activator="{ props }">
      <span v-bind="props">
        {{ displayText }}
      </span>
    </template>
    <span>{{ text }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

const props = defineProps<{
  text: string;
  maxLength?: number; // optional, default 80
}>();

const displayText = computed(() => {
  const max = props.maxLength ?? 80;
  return props.text.length > max ? props.text.substring(0, max) + "..." : props.text;
});
</script>
