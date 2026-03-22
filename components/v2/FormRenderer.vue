<script setup lang="ts" generic="Data extends Record<string, any>">
import { ref, computed } from "vue";
import { z } from "zod";
import type { FieldWithConditions } from "~/types/form-builder";
import { useFormState } from "~/composables/useFormState";

interface Props {
  fields: FieldWithConditions[];
  initialValues?: Data;
  hideActions?: boolean; // set true inside WizardRenderer to suppress submit button
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Data];
  change: [field: string, value: any];
}>();

const {
  values,
  errors,
  visibleFields,
  setValue,
  isDisabled,
  getOptions,
  validate,
} = useFormState(props.fields, props.initialValues);

// schema rebuilds when visible fields change (hidden fields are excluded)
const schema = computed(() => {
  const shape: Record<string, any> = {};
  for (const field of visibleFields.value) {
    if (field.validation) shape[field.name] = field.validation;
  }
  return z.object(shape);
});

// col-span lookup — full static strings required for Tailwind JIT to include them
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

function colSpanClass(field: FieldWithConditions): string {
  return COL_SPAN[field.colSpan ?? 12] ?? "col-span-12";
}

async function handleFieldChange(field: FieldWithConditions, newValue: any) {
  setValue(field.name, newValue);
  emit("change", field.name, newValue);
  // Re-validate just this field so its error clears immediately when value becomes valid
  if (formRef.value) {
    try { await formRef.value.validate({ name: field.name, silent: true }); } catch { /* expected */ }
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

// Explicit submit — called by button click, not native form submit
async function handleSubmit() {
  const valid = await validateForm();
  if (valid) emit("submit", values as Data);
}

defineExpose({ values, errors, validate: validateForm });
</script>

<template>
  <!-- @submit.prevent blocks any accidental native submit (e.g. USelectMenu option buttons) -->
  <UForm
    ref="formRef"
    :schema="schema"
    :state="values"
    class="space-y-4"
    @submit.prevent
  >
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
