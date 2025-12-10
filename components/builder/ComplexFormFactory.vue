<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Group fields by row -->
    <div v-for="rowNumber in uniqueRows" :key="rowNumber" class="grid gap-6" :class="getGridClass(rowNumber,fieldsByRow(rowNumber).length)">
      <div
        v-for="(field,index) in fieldsByRow(rowNumber)"
        :key="field.name"
        :class="getColumnClass(field)"
      >
        <!-- Label -->
        <label :for="field.name" class="label">
          {{ field.label }}
        </label>

        <BaseDatePicker
          v-if="field.component === 'UCalendar'"
          :field="field"
          :model-value="values[field.name]"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <USelect
          v-else-if="field.component === 'USelect'"
          :id="field.name"
          v-bind="{ ...field.props, ...field.attrs }"
          :items="getFieldOptions(field)"
          :model-value="values[field.name]"
          @update:model-value="onFieldChange($event, field, index)"
          :disabled="isFieldDisabled(field)"
        />

        <URadioGroup
          v-else-if="field.component === 'URadioGroup'"
          :id="field.name"
          v-bind="{ ...field.props, ...field.attrs }"
          :options="getFieldOptions(field)"
          :model-value="values[field.name]"
          @update:model-value="onFieldChange($event, field, index)"
          :disabled="isFieldDisabled(field)"
        />

        <!-- Dynamic Component -->
        <component
          v-else
          :is="resolveComponentMap[field.component]"
          :id="field.name"
          :type="field.type"
          v-bind="{ ...field.props, ...field.attrs }"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          @update:modelValue="onFieldChange($event, field, index)"
        />

        <!-- Errors -->
        <p v-if="errors[field.name]" class="error">{{ errors[field.name] }}</p>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ZodError, type ZodTypeAny } from "zod";
import type { Field, FieldWithConditions, ObjectGeneric } from "~/types/form-builder";
import { resolveComponentMap } from "./ui-helper";
import { getColumnClass, getGridClass } from "./style-helper";

const props = defineProps<{
  modelValue?: Record<string, any>;
  fields: FieldWithConditions[];
}>();

const emit = defineEmits([
  "update:modelValue",
  "validate",
  "submit",
  "error"
]);

// -------------------------------------------------------------------
// Internal State
// -------------------------------------------------------------------
const values = ref<ObjectGeneric>({});
const errors = ref<ObjectGeneric>({});

// Init default values
props.fields.forEach((f) => {
  let defaultValue: any;

  // Check for modelValue first (parent provided)
  if (props.modelValue?.[f.name] !== undefined) {
    defaultValue = props.modelValue[f.name];
  }
  // Then check for function-based defaultValue
  else if (f.defaultValue && typeof f.defaultValue === 'function') {
    defaultValue = f.defaultValue(values.value);
  }
  // Then check for static defaultValue
  else if (f.props?.defaultValue !== undefined) {
    defaultValue = f.props.defaultValue;
  }
  // Then check for value prop
  else if (f.props?.value !== undefined) {
    defaultValue = f.props.value;
  }
  // Finally use component-specific defaults
  else if (f.component === "UCheckboxGroup") {
    defaultValue = [];
  }
  // Default to empty string
  else {
    defaultValue = "";
  }

  values.value[f.name] = defaultValue;
});

// Sync back to parent (v-model)
watch(values, (v) => {
  emit("update:modelValue", { ...v });
}, { deep: true });

// -------------------------------------------------------------------
// Computed: Visible Fields
// -------------------------------------------------------------------
const visibleFields = computed(() => {
  return props.fields.filter(field => {
    if (!field.hidden) return true;
    return !field.hidden(values.value);
  });
});

// -------------------------------------------------------------------
// Computed: Get unique row numbers
// -------------------------------------------------------------------
const uniqueRows = computed(() => {
  const rows = new Set<number>();
  visibleFields.value.forEach(field => {
    const rowNum = field.row ?? 0;
    rows.add(rowNum);
  });
  return Array.from(rows).sort((a, b) => a - b);
});

// -------------------------------------------------------------------
// Get fields by row number
// -------------------------------------------------------------------
const fieldsByRow = (rowNumber: number) => {
  return visibleFields.value.filter(field => (field.row ?? 0) === rowNumber);
};

// -------------------------------------------------------------------
// Check if field is disabled
// -------------------------------------------------------------------
const isFieldDisabled = (field: FieldWithConditions): boolean => {
  if (!field.disabled) return false;
  return field.disabled(values.value);
};

// -------------------------------------------------------------------
// Get dynamic field options
// -------------------------------------------------------------------
const getFieldOptions = (field: FieldWithConditions) => {
  // If field has dynamic options function
  if (field.options && typeof field.options === 'function') {
    return field.options(values.value);
  }
  // Otherwise use static options
  return field.props?.options || [];
};

// -------------------------------------------------------------------
// Single Field Validation
// -------------------------------------------------------------------
const validateField = (name: string, value: any, validator?: ZodTypeAny) => {
  if (!validator) return { valid: true };

  try {
    validator.parse(value);
    return { valid: true };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        valid: false,
        message: e.issues[0].message,
      };
    }
  }
  return { valid: false, message: "Invalid value" };
};

// -------------------------------------------------------------------
// Update Field Handler
// -------------------------------------------------------------------
const onFieldChange = (value: any, field: FieldWithConditions, index: number) => {
  // If checkbox group → ensure array
  if (field.component === "UCheckboxGroup") {
    if (!Array.isArray(value)) {
      value = [value];
    }
  }

  values.value[field.name] = value;

  // Clear dependent fields if they have clearOnChange enabled
  clearDependentFields(field.name);

  // Apply dependent field default values
  applyDependentDefaults();

  const { valid, message } = validateField(field.name, value, field.validation);
  errors.value[field.name] = valid ? undefined : message;

  emit("validate", {
    field: field.name,
    valid,
    message,
    values: { ...values.value },
  });
};

// -------------------------------------------------------------------
// Clear dependent fields when parent field changes
// -------------------------------------------------------------------
const clearDependentFields = (changedFieldName: string) => {
  props.fields.forEach((field: FieldWithConditions) => {
    // Check if this field depends on the changed field
    if (field.dependsOn?.includes(changedFieldName)) {
      // Default behavior is to clear (clearOnChange defaults to true)
      const shouldClear = field.clearOnChange !== false;
      
      if (shouldClear) {
        if (field.component === "UCheckboxGroup") {
          values.value[field.name] = [];
        } else {
          values.value[field.name] = "";
        }
        // Clear error for this field
        errors.value[field.name] = undefined;
      }
    }
  });
};

// -------------------------------------------------------------------
// Apply default values for dependent fields
// -------------------------------------------------------------------
const applyDependentDefaults = () => {
  props.fields.forEach((field: FieldWithConditions) => {
    if (field.defaultValue && typeof field.defaultValue === 'function') {
      const newDefault = field.defaultValue(values.value);
      // Only update if field was hidden and is now visible, or value is empty
      if (newDefault !== undefined && (values.value[field.name] === "" || values.value[field.name] === null)) {
        values.value[field.name] = newDefault;
      }
    }
  });
};

// -------------------------------------------------------------------
// Validate all fields
// -------------------------------------------------------------------
const validateAll = () => {
  let allValid = true;

  visibleFields.value.forEach((field) => {
    const { valid, message } = validateField(
      field.name,
      values.value[field.name],
      field.validation
    );
    if (!valid) allValid = false;
    errors.value[field.name] = valid ? undefined : message;
  });

  return allValid;
};

// -------------------------------------------------------------------
// Submit handler
// -------------------------------------------------------------------
const handleSubmit = () => {
  const allValid = validateAll();

  if (allValid) {
    emit("submit", { ...values.value });
  } else {
    emit("error", { errors: { ...errors.value } });
  }
};

// -------------------------------------------------------------------
// Computed: is form valid?
// -------------------------------------------------------------------
const isValid = computed(() => {
  return Object.values(errors.value).every((v) => v === undefined);
});

// -------------------------------------------------------------------
// Expose Methods
// -------------------------------------------------------------------
defineExpose({
  validateAll,
  submit: handleSubmit,
  values,
  errors,
  isValid
});
</script>

<style scoped>
.error {
  /* @apply text-red-500 text-xs mt-1; */
  color: var(--color-red-500);
  font-size: var(--text-xs);
  margin: 4px;
}

.label {
  /* @apply block font-medium text-gray-700 mb-2; */
  display: block;
  color: var(--color-gray-700);
  margin-bottom: 8ox;
}
</style>