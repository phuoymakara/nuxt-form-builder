<script setup lang="ts">
import { computed } from "vue";

export interface RepeaterField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface Props {
  fields: RepeaterField[];
  modelValue?: Record<string, any>[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, any>[]];
}>();

const rows = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);

function newRow(): Record<string, any> {
  const row: Record<string, any> = {};
  for (const f of props.fields) row[f.key] = f.type === "number" ? null : "";
  return row;
}

function addRow() {
  emit("update:modelValue", [...rows.value, newRow()]);
}

function removeRow(idx: number) {
  const next = [...rows.value];
  next.splice(idx, 1);
  emit("update:modelValue", next);
}

function updateCell(rowIdx: number, key: string, val: any) {
  const next = rows.value.map((r, i) =>
    i === rowIdx ? { ...r, [key]: val } : r,
  );
  emit("update:modelValue", next);
}
</script>

<template>
  <div class="space-y-3">
    <!-- Empty state -->
    <div
      v-if="rows.length === 0"
      class="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center"
    >
      <UIcon
        name="i-heroicons-queue-list"
        class="size-7 text-gray-300 mb-2 mx-auto"
      />
      <p class="text-sm text-gray-400">
        No entries yet — click "Add Entry" below.
      </p>
    </div>

    <!-- Rows -->
    <div
      v-for="(row, ri) in rows"
      :key="ri"
      class="rounded-xl border border-gray-200 bg-white shadow-xs"
    >
      <!-- Row header -->
      <div
        class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 rounded-t-xl"
      >
        <span
          class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
          >Entry {{ ri + 1 }}</span
        >
        <UButton
          v-if="!disabled"
          size="xs"
          variant="ghost"
          color="error"
          icon="i-heroicons-trash"
          type="button"
          @click.stop="removeRow(ri)"
        />
      </div>

      <!-- Fields grid -->
      <div class="p-4 grid grid-cols-12 gap-3">
        <div
          v-for="field in fields"
          :key="field.key"
          class="col-span-12 sm:col-span-6"
        >
          <label class="block text-xs font-medium text-gray-600 mb-1">
            {{ field.label
            }}<span v-if="field.required" class="text-red-400 ml-0.5">*</span>
          </label>
          <USelect
            v-if="field.type === 'select'"
            :model-value="row[field.key]"
            :items="field.options ?? []"
            :placeholder="field.placeholder ?? 'Select…'"
            size="sm"
            :disabled="disabled"
            class="w-full"
            @update:model-value="updateCell(ri, field.key, $event)"
          />
          <UInputNumber
            v-else-if="field.type === 'number'"
            :model-value="row[field.key]"
            :placeholder="field.placeholder ?? '0'"
            size="sm"
            :disabled="disabled"
            class="w-full"
            @update:model-value="updateCell(ri, field.key, $event)"
          />
          <UInput
            v-else
            :model-value="row[field.key]"
            :placeholder="field.placeholder ?? field.label"
            size="sm"
            :disabled="disabled"
            class="w-full"
            @update:model-value="updateCell(ri, field.key, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Add button -->
    <UButton
      v-if="!disabled"
      size="sm"
      variant="outline"
      leading-icon="i-heroicons-plus"
      type="button"
      @click.stop="addRow"
    >
      Add Entry
    </UButton>
  </div>
</template>
