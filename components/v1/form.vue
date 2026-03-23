<template>
  <form @submit.prevent="handleSubmit">
    <div v-for="(field, index) in props.fields" :key="field.name" class="mb-4">
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
        :items="field.props?.options || []"
        :model-value="values[field.name]"
        @update:model-value="onFieldChange($event, field, index)"
      />
      <!-- Dynamic Component -->
      <component
        v-else
        :is="componentMap[field.component]"
        :id="field.name"
        :type="field.type"
        v-bind="{ ...field.props, ...field.attrs }"
        :model-value="values[field.name]"
        @update:modelValue="onFieldChange($event, field, index)"
      />

      <!-- Errors -->
      <p v-if="errors[field.name]" class="error">{{ errors[field.name] }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ZodError, type ZodTypeAny } from "zod";
import {
  toCalendarDate,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";
import type { Field, ObjectGeneric } from "~/types/form-builder";
import { componentMap } from "./helper";
// Props / Emits
const props = defineProps<{
  modelValue?: Record<string, any>;
  fields: Field[];
}>();

const emit = defineEmits(["update:modelValue", "validate", "submit", "error"]);

// -------------------------------------------------------------------
// Internal State
// -------------------------------------------------------------------
const values = ref<ObjectGeneric>({});
const errors = ref<ObjectGeneric>({});

// Init default values
props.fields.forEach((f) => {
  if (f.component === "UCheckboxGroup") {
    values.value[f.name] = [];
  } else {
    values.value[f.name] = props.modelValue?.[f.name] ?? f.props?.value ?? "";
  }
});

// Sync back to parent (v-model)
watch(
  values,
  (v) => {
    emit("update:modelValue", { ...v });
  },
  { deep: true },
);

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
const onFieldChange = (value: any, field: Field, index: number) => {
  // If checkbox group → ensure array
  if (field.component === "UCheckboxGroup") {
    if (!Array.isArray(value)) {
      value = [value]; // convert single value to array
    }
  }

  // If calendar → convert Date object to string
  //   if (field.component === "UCalendar") {
  //     if (value instanceof CalendarDate) {
  //         // console.log(value)
  //         const jsDate = value.toDate(getLocalTimeZone());
  //         // Format as YYYY-MM-DD string
  //         value = jsDate.toISOString().split("T")[0];
  //     }
  //   }

  values.value[field.name] = value;

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
// Validate all fields
// -------------------------------------------------------------------
const validateAll = () => {
  let allValid = true;

  props.fields.forEach((field) => {
    const { valid, message } = validateField(
      field.name,
      values.value[field.name],
      field.validation,
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
// Expose Methods (optional for parent usage)
// -------------------------------------------------------------------
defineExpose({
  validateAll,
  submit: handleSubmit,
  values,
  errors,
  isValid,
});
</script>

<style scoped>
.error {
  color: #f55;
}
.label {
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
}
</style>
