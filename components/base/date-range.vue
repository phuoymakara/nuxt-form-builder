<script setup lang="ts">
import { computed } from "vue";
import { parseDate, type CalendarDate } from "@internationalized/date";

interface DateRangeValue {
  start: string;
  end: string;
}

interface Props {
  modelValue?: DateRangeValue | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), { disabled: false });

const emit = defineEmits<{ "update:modelValue": [value: DateRangeValue] }>();

const startStr = computed(() => props.modelValue?.start ?? "");
const endStr = computed(() => props.modelValue?.end ?? "");

function toCalDate(str: string): CalendarDate | null {
  if (!str) return null;
  try {
    return parseDate(str);
  } catch {
    return null;
  }
}

const startCal = computed(() => toCalDate(startStr.value));
const endCal = computed(() => toCalDate(endStr.value));

function onStart(val: any) {
  emit("update:modelValue", {
    start: val ? String(val) : "",
    end: endStr.value,
  });
}
function onEnd(val: any) {
  emit("update:modelValue", {
    start: startStr.value,
    end: val ? String(val) : "",
  });
}
</script>

<template>
  <div class="flex gap-3 items-end">
    <!-- From -->
    <div class="flex-1">
      <p class="text-xs text-gray-500 mb-1">From</p>
      <UPopover>
        <UButton
          variant="outline"
          class="w-full justify-between"
          size="sm"
          type="button"
          :disabled="disabled"
        >
          <span :class="startStr ? 'text-gray-900' : 'text-gray-400'">{{
            startStr || "Select date…"
          }}</span>
          <UIcon name="i-heroicons-calendar" class="size-4 text-gray-400" />
        </UButton>
        <template #content>
          <UCalendar :model-value="startCal" @update:model-value="onStart" />
        </template>
      </UPopover>
    </div>

    <UIcon
      name="i-heroicons-arrow-right"
      class="size-4 text-gray-400 shrink-0 mb-2"
    />

    <!-- To -->
    <div class="flex-1">
      <p class="text-xs text-gray-500 mb-1">To</p>
      <UPopover>
        <UButton
          variant="outline"
          class="w-full justify-between"
          size="sm"
          type="button"
          :disabled="disabled"
        >
          <span :class="endStr ? 'text-gray-900' : 'text-gray-400'">{{
            endStr || "Select date…"
          }}</span>
          <UIcon name="i-heroicons-calendar" class="size-4 text-gray-400" />
        </UButton>
        <template #content>
          <UCalendar :model-value="endCal" @update:model-value="onEnd" />
        </template>
      </UPopover>
    </div>
  </div>
</template>
