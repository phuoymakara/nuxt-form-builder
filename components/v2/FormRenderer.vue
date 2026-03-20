<script setup lang="ts" generic="Data extends Record<string, any>">
import { ref, computed } from "vue";
import type { FormSubmitEvent } from "@nuxt/ui";
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

const { values, errors, visibleFields, rowGroups, setValue, isDisabled, getOptions, validate } =
  useFormState(props.fields, props.initialValues);

// schema rebuilds when visible fields change (hidden fields are excluded)
const schema = computed(() => {
  const shape: Record<string, any> = {};
  for (const field of visibleFields.value) {
    if (field.validation) shape[field.name] = field.validation;
  }
  return z.object(shape);
});

// col-span class: full width on mobile, colSpan on sm+
function colSpanClass(field: FieldWithConditions): string {
  return `col-span-12 sm:col-span-${field.colSpan ?? 12}`;
}

function handleFieldChange(field: FieldWithConditions, newValue: any) {
  setValue(field.name, newValue);
  emit("change", field.name, newValue);
}

async function onSubmit(event: FormSubmitEvent<any>) {
  emit("submit", event.data as Data);
}

const formRef = ref<any>(null);

async function validateForm(): Promise<boolean> {
  if (!formRef.value) return validate();
  try {
    await formRef.value.validate(); // resolves = valid, throws = invalid
    return true;
  } catch {
    return false;
  }
}

defineExpose({ values, errors, validate: validateForm });
</script>

<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="values"
    class="space-y-4"
    @submit="onSubmit"
  >
    <!-- fields grouped by row, each row is a 12-col grid -->
    <div
      v-for="(rowFields, rowIndex) in rowGroups"
      :key="rowIndex"
      class="grid grid-cols-12 gap-4"
    >
      <div
        v-for="field in rowFields"
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

    <!-- actions slot — hidden when hideActions is true -->
    <template v-if="!hideActions">
      <slot name="actions" :state="values" :validate="validateForm">
        <div class="flex justify-end">
          <UButton type="submit">Submit</UButton>
        </div>
      </slot>
    </template>
  </UForm>
</template>