<script setup lang="ts" generic="Data extends Record<string, any>">
import { ref, computed } from "vue";
import { z } from "zod";
import type { FieldWithConditions } from "~/types/form-builder";
import type { FormRow } from "~/constants/form-builder";
import { useFormState } from "~/composables/useFormState";

interface Props {
  fields?: FieldWithConditions[];
  rows?: FormRow[];
  initialValues?: Data;
  hideActions?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Data];
  change: [field: string, value: any];
}>();

const allFields = computed<FieldWithConditions[]>(() => {
  if (props.rows?.length) return props.rows.flatMap((r) => r.fields as FieldWithConditions[]);
  return (props.fields ?? []) as FieldWithConditions[];
});

const {
  values,
  errors,
  visibleFields,
  setValue,
  isDisabled,
  getOptions,
  validate,
} = useFormState(allFields.value, props.initialValues);

const schema = computed(() => {
  const shape: Record<string, any> = {};
  for (const field of visibleFields.value) {
    if (field.validation) shape[field.name] = field.validation;
  }
  return z.object(shape);
});

const visibleNames = computed(() => new Set(visibleFields.value.map((f) => f.name)));

const COL_SPAN: Record<number, string> = {
  1: "col-span-12 sm:col-span-1",
  2: "col-span-12 sm:col-span-2",
  3: "col-span-12 sm:col-span-3",
  4: "col-span-12 sm:col-span-4",
  5: "col-span-12 sm:col-span-5",
  6: "col-span-12 sm:col-span-6",
  7: "col-span-12 sm:col-span-7",
  8: "col-span-12 sm:col-span-8",
  9: "col-span-12 sm:col-span-9",
  10: "col-span-12 sm:col-span-10",
  11: "col-span-12 sm:col-span-11",
  12: "col-span-12 sm:col-span-12",
};

const ROW_GAP: Record<string, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6" };

function rowContainerClass(row: FormRow): string {
  const gap = ROW_GAP[row.gap ?? "md"] ?? "gap-4";
  if (row.layout === "flex") return `flex flex-wrap ${gap}`;
  if (row.layout === "grid") return `grid grid-cols-${row.cols ?? 2} ${gap}`;
  return `grid grid-cols-12 ${gap}`;
}

function fieldInRowClass(row: FormRow, field: FieldWithConditions): string {
  if (row.layout === "flex") return "flex-1 min-w-0";
  if (row.layout === "grid") return "";
  return COL_SPAN[field.colSpan ?? 12] ?? "col-span-12";
}

function visibleRowFields(row: FormRow): FieldWithConditions[] {
  return (row.fields as FieldWithConditions[]).filter((f) => visibleNames.value.has(f.name));
}

function colSpanClass(field: FieldWithConditions): string {
  return COL_SPAN[field.colSpan ?? 12] ?? "col-span-12";
}

async function handleFieldChange(field: FieldWithConditions, newValue: any) {
  setValue(field.name, newValue);
  emit("change", field.name, newValue);
  if (formRef.value) {
    try {
      await formRef.value.validate({ name: field.name, silent: true });
    } catch { /* expected */ }
  }
}

const formRef = ref<any>(null);

async function validateForm(): Promise<boolean> {
  if (!formRef.value) return validate();
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
}

async function handleSubmit() {
  const valid = await validateForm();
  if (valid) emit("submit", values as Data);
}

defineExpose({ values, errors, validate: validateForm });
</script>

<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="values"
    class="space-y-4"
    @submit.prevent
  >
    <!-- Row-based rendering -->
    <template v-if="rows?.length">
      <div class="space-y-4">
        <div
          v-for="row in rows"
          :key="row.id"
          :class="rowContainerClass(row)"
        >
          <div
            v-for="field in visibleRowFields(row)"
            :key="field.name"
            :class="fieldInRowClass(row, field)"
          >
            <V2FieldRenderer
              :field="field"
              :model-value="values[field.name]"
              :form-values="values"
              :options="getOptions(field)"
              :disabled="isDisabled(field)"
              @update:model-value="handleFieldChange(field, $event)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Flat rendering (legacy / backward compat) -->
    <template v-else>
      <div class="grid grid-cols-12 gap-4">
        <div
          v-for="field in visibleFields"
          :key="field.name"
          :class="colSpanClass(field)"
        >
          <V2FieldRenderer
            :field="field"
            :model-value="values[field.name]"
            :form-values="values"
            :options="getOptions(field)"
            :disabled="isDisabled(field)"
            @update:model-value="handleFieldChange(field, $event)"
          />
        </div>
      </div>
    </template>

    <template v-if="!hideActions">
      <slot
        name="actions"
        :state="values"
        :validate="validateForm"
        :submit="handleSubmit"
      >
        <div class="flex justify-end">
          <UButton type="button" @click="handleSubmit">Submit</UButton>
        </div>
      </slot>
    </template>
  </UForm>
</template>
