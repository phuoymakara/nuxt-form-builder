<script setup lang="ts">
interface Props {
  field: any;
  modelValue?: string | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const isOpen = ref(false);

function clearLocation() {
  emit("update:modelValue", null);
}
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <!-- Coordinate display input -->
    <div
      class="flex-1 flex items-center gap-2 h-9 px-3 border border-gray-200 rounded-lg bg-white text-sm cursor-pointer hover:border-gray-300 transition-colors"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      @click="!disabled && (isOpen = true)"
    >
      <UIcon name="i-heroicons-map-pin" class="size-4 text-gray-400 shrink-0" />
      <span v-if="modelValue" class="text-gray-700 font-mono text-xs truncate">
        {{ modelValue }}
      </span>
      <span v-else class="text-gray-400 text-xs">
        {{ field?.placeholder || "No location selected" }}
      </span>
    </div>

    <!-- Clear button -->
    <UButton
      v-if="modelValue"
      icon="i-heroicons-x-mark"
      size="sm"
      variant="ghost"
      color="neutral"
      :disabled="disabled"
      @click="clearLocation"
    />

    <!-- Open map button -->
    <UButton
      icon="i-heroicons-map"
      size="md"
      variant="outline"
      color="primary"
      :disabled="disabled"
      @click="isOpen = true"
    >
      Pick
    </UButton>
  </div>

  <!-- Map modal -->
  <BaseMapOpenStreetMap
    v-model:is-open="isOpen"
    :lat-long-value="modelValue ?? undefined"
    @update:lat-long-value="emit('update:modelValue', $event)"
  />
</template>
