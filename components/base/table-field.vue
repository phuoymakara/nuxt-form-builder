<script setup lang="ts">
import { computed } from "vue";

export interface TableColumn {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
}

interface Props {
  columns: TableColumn[];
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
  for (const col of props.columns)
    row[col.key] = col.type === "number" ? null : "";
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
  <div class="space-y-2">
    <div class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap"
            >
              {{ col.label }}
            </th>
            <th class="w-8" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td
              :colspan="columns.length + 1"
              class="px-3 py-6 text-center text-xs text-gray-400 italic"
            >
              No rows yet — click "Add Row" below.
            </td>
          </tr>
          <tr
            v-for="(row, ri) in rows"
            :key="ri"
            class="border-b border-gray-100 last:border-0"
          >
            <td v-for="col in columns" :key="col.key" class="px-2 py-1.5">
              <USelect
                v-if="col.type === 'select'"
                :model-value="row[col.key]"
                :items="col.options ?? []"
                :placeholder="col.placeholder ?? 'Select…'"
                size="xs"
                :disabled="disabled"
                class="w-full"
                @update:model-value="updateCell(ri, col.key, $event)"
              />
              <UInputNumber
                v-else-if="col.type === 'number'"
                :model-value="row[col.key]"
                :placeholder="col.placeholder ?? '0'"
                size="xs"
                :disabled="disabled"
                class="w-full"
                @update:model-value="updateCell(ri, col.key, $event)"
              />
              <UInput
                v-else
                :model-value="row[col.key]"
                :placeholder="col.placeholder ?? col.label"
                size="xs"
                :disabled="disabled"
                class="w-full"
                @update:model-value="updateCell(ri, col.key, $event)"
              />
            </td>
            <td class="px-1 py-1.5 text-center">
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                type="button"
                :disabled="disabled"
                @click.stop="removeRow(ri)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UButton
      size="xs"
      variant="outline"
      leading-icon="i-heroicons-plus"
      :disabled="disabled"
      type="button"
      @click.stop="addRow"
    >
      Add Row
    </UButton>
  </div>
</template>
