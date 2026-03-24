<template>
  <div v-if="isLoading" class="absolute inset-0 z-10 h-full w-full">
    <div class="relative h-full w-full overflow-hidden">
      <USkeleton class="h-full w-full" />
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-map" class="text-primary h-8 w-8 animate-pulse" />
          <span class="text-lg font-medium">
            {{ 'Load map' }}
          </span>
        </div>
        <!-- Progress indicator -->
        <div class="w-48">
          <UProgress animation="carousel" />
        </div>
      </div>
      <div class="absolute top-4 right-4 flex flex-col gap-2">
        <USkeleton class="h-8 w-8" />
        <USkeleton class="h-8 w-8" />
      </div>
      <!-- Simulated attribution -->
      <div class="absolute right-2 bottom-2">
        <USkeleton class="h-5 w-40" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});
</script>
