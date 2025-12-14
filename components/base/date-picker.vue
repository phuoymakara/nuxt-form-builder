<template>
  <UPopover>
    <UButton variant="outline" class="w-full justify-between">
      <span>
        {{ displayDate }}
      </span>
      <UIcon name="i-heroicons-calendar" />
    </UButton>

    <!-- Calendar popup -->
    <template #content>
      <UCalendar
        v-bind="field.props"
        :model-value="calendarValue"
        @update:model-value="handleDateChange"
      />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  parseDate,
  getLocalTimeZone,
  type CalendarDate,
} from "@internationalized/date";
import type { Field } from "~/types/form-builder";

interface Props {
  field: Field;
  modelValue?: string | CalendarDate | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const displayDate = computed(() => {
  return props.modelValue ? String(props.modelValue) : "Select date...";
});

const calendarValue = computed(() => {
  if (!props.modelValue) return null;

  // If already a CalendarDate, return as is
  if (props.modelValue instanceof Object && "toString" in props.modelValue) {
    return props.modelValue as CalendarDate;
  }

  // Convert string (YYYY-MM-DD) to CalendarDate
  try {
    return parseDate(String(props.modelValue));
  } catch {
    return null;
  }
});

const handleDateChange = (val: any) => {
  if (!val) {
    emit("update:modelValue", "");
    return;
  }

  // Handle CalendarDate, Date, or DateRange
  let dateValue: CalendarDate;

  if (val instanceof Date) {
    // Convert JS Date to CalendarDate
    dateValue = parseDate(val.toISOString().split("T")[0]);
  } else if (Array.isArray(val)) {
    // Handle DateRange (array) - use first date
    dateValue = val[0];
  } else {
    // Already a CalendarDate
    dateValue = val;
  }

  // Convert to YYYY-MM-DD string
  const formatted = dateValue.toString();
  emit("update:modelValue", formatted);
};
</script>
