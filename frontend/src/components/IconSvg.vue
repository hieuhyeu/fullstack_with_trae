<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="shrink-0"
  >
    <path v-if="name === 'search'" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.3 4.3 4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    <path
      v-else-if="name === 'user'"
      d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm-8 10a8 8 0 0 1 16 0"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      v-else-if="name === 'heart'"
      d="M12 21s-7.2-4.8-9.4-9.2C.9 8.3 3 5.4 6 5.2c1.6-.1 3 .8 4 2 1-1.2 2.4-2.1 4-2 3 .2 5.1 3.1 3.4 6.6C19.2 16.2 12 21 12 21Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'bag'"
      d="M7 8V7a5 5 0 0 1 10 0v1m-12 0h14l-1 13H6L5 8Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: "search" | "user" | "heart" | "bag";
  size?: number;
}>();
</script>

