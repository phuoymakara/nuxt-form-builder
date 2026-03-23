<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div
      v-for="rowNumber in uniqueRows"
      :key="rowNumber"
      class="grid gap-6"
      :class="getGridClass(rowNumber)"
    >
      <div
        v-for="(field, index) in fieldsByRow(rowNumber)"
        :key="field.name"
        :class="getGridClass(rowNumber)"
      >
        <label :for="field.name" class="label">
          {{ field.label }}
        </label>

        <BaseDatePicker
          v-if="field.component === 'UCalendar'"
          :field="field"
          :model-value="values[field.name]"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <BaseAddress
          v-else-if="field.component === 'UAddress'"
          :ref="
            (el) => {
              if (el) addressFieldRefs[field.name] = el;
            }
          "
          :id="field.name"
          :field="field"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          :form-values="values"
          api-base-url="/api/address"
          @update:model-value="onFieldChange($event, field, index)"
          @clear:dependents="clearDependentFields"
          @dependency:changed="handleDependencyChanged"
        />

        <UFileUpload
          v-else-if="
            field.component === 'UFileUpload' &&
            field.type === 'file' &&
            field.name === 'avatar'
          "
          :field="field"
          accept="image/*"
          class="w-28 h-28 object-cover"
          icon="i-lucide-user"
          :label="field.description"
          :model-value="values[field.name]"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <USelect
          v-else-if="field.component === 'USelect'"
          class="w-full"
          :id="field.name"
          v-bind="{ ...field.props, ...field.attrs }"
          :items="getFieldOptions(field)"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <BaseAsynSelect
          v-else-if="field.component === 'UAsyncSelect'"
          :id="field.name"
          :field="field"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <URadioGroup
          v-else-if="field.component === 'URadioGroup'"
          :id="field.name"
          v-bind="{ ...field.props, ...field.attrs }"
          :options="getFieldOptions(field)"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          @update:model-value="onFieldChange($event, field, index)"
        />

        <input
          v-else-if="field.component === 'UFileInput' || field.type === 'file'"
          :id="field.name"
          type="file"
          v-bind="{ ...field.props, ...field.attrs }"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          @change="onFileChange($event, field, index)"
        />

        <component
          v-else
          :is="resolveComponentMap[field.component]"
          :id="field.name"
          :type="field.type"
          :class="{ 'w-full': true }"
          v-bind="{ ...field.props, ...field.attrs }"
          :model-value="values[field.name]"
          :disabled="isFieldDisabled(field)"
          @update:modelValue="onFieldChange($event, field, index)"
        />

        <p v-if="errors[field.name]" class="error">{{ errors[field.name] }}</p>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ZodError, type ZodTypeAny } from "zod";
import type {
  Field,
  FieldWithConditions,
  ObjectGeneric,
} from "~/types/form-builder";
import { resolveComponentMap } from "./ui-helper";
import { getColumnClass } from "./style-helper";

const props = defineProps<{
  modelValue?: Record<string, any>;
  fields: FieldWithConditions[];
}>();

const emit = defineEmits(["update:modelValue", "validate", "submit", "error"]);

const values = ref<ObjectGeneric>({});
const errors = ref<ObjectGeneric>({});
const addressFieldRefs = ref<Record<string, any>>({});

// Initialize form values
props.fields.forEach((f) => {
  let defaultValue: any;

  if (props.modelValue?.[f.name] !== undefined) {
    defaultValue = props.modelValue[f.name];
  } else if (f.defaultValue && typeof f.defaultValue === "function") {
    defaultValue = f.defaultValue(values.value);
  } else if (f.props?.defaultValue !== undefined) {
    defaultValue = f.props.defaultValue;
  } else if (f.props?.value !== undefined) {
    defaultValue = f.props.value;
  } else if (f.component === "UCheckboxGroup") {
    defaultValue = [];
  } else {
    defaultValue = "";
  }

  values.value[f.name] = defaultValue;
});

watch(
  values,
  (v) => {
    emit("update:modelValue", { ...v });
  },
  { deep: true },
);

const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.hidden) return true;
    return !field.hidden(values.value);
  });
});

const uniqueRows = computed(() => {
  const rows = new Set<number>();
  visibleFields.value.forEach((field) => {
    const rowNum = field.row ?? 0;
    rows.add(rowNum);
  });
  return Array.from(rows).sort((a, b) => a - b);
});

const fieldsByRow = (rowNumber: number) => {
  return visibleFields.value.filter((field) => (field.row ?? 0) === rowNumber);
};

const getGridClass = (rowNumber: number): string => {
  const fieldsInRow = fieldsByRow(rowNumber).length;
  const gridClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };
  return gridClasses[fieldsInRow] || "grid-cols-1";
};

const isFieldDisabled = (field: FieldWithConditions): boolean => {
  if (!field.disabled) return false;
  return field.disabled(values.value);
};

const getFieldOptions = (field: FieldWithConditions) => {
  if (field.options && typeof field.options === "function") {
    return field.options(values.value);
  }
  return field.props?.options || [];
};

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

const onFileChange = (
  event: Event,
  field: FieldWithConditions,
  index: number,
) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) {
    values.value[field.name] = null;
    return;
  }

  const allowMultiple = field.props?.multiple ?? false;
  values.value[field.name] = allowMultiple ? Array.from(files) : files[0];

  clearDependentFields(field.name);
  applyDependentDefaults();

  const { valid, message } = validateField(
    field.name,
    values.value[field.name],
    field.validation,
  );
  errors.value[field.name] = valid ? undefined : message;

  emit("validate", {
    field: field.name,
    valid,
    message,
    values: { ...values.value },
  });
};

const onFieldChange = (
  value: any,
  field: FieldWithConditions,
  index: number,
) => {
  if (field.component === "UCheckboxGroup") {
    if (!Array.isArray(value)) {
      value = [value];
    }
  }

  let finalValue = value;
  if (
    field.component === "UAddress" &&
    typeof value === "object" &&
    value !== null &&
    value.code
  ) {
    finalValue = value;
  }

  values.value[field.name] = finalValue;
  clearDependentFields(field.name);
  applyDependentDefaults();

  const { valid, message } = validateField(
    field.name,
    finalValue,
    field.validation,
  );
  errors.value[field.name] = valid ? undefined : message;

  emit("validate", {
    field: field.name,
    valid,
    message,
    values: { ...values.value },
  });
};

const handleDependencyChanged = (changedFieldName: string) => {
  props.fields.forEach((field: FieldWithConditions) => {
    if (field.dependsOn?.includes(changedFieldName)) {
      const fieldRef = addressFieldRefs.value[field.name];
      if (fieldRef) {
        fieldRef.refetch();
      }
    }
  });
};

const clearDependentFields = (changedFieldName: string) => {
  props.fields.forEach((field: FieldWithConditions) => {
    if (field.dependsOn?.includes(changedFieldName)) {
      const shouldClear = field.clearOnChange !== false;

      if (shouldClear) {
        values.value[field.name] =
          field.component === "UCheckboxGroup" ? [] : "";
        errors.value[field.name] = undefined;
      }
    }
  });
};

const applyDependentDefaults = () => {
  props.fields.forEach((field: FieldWithConditions) => {
    if (field.defaultValue && typeof field.defaultValue === "function") {
      const newDefault = field.defaultValue(values.value);
      if (
        newDefault !== undefined &&
        (values.value[field.name] === "" || values.value[field.name] === null)
      ) {
        values.value[field.name] = newDefault;
      }
    }
  });
};

const validateAll = () => {
  let allValid = true;

  visibleFields.value.forEach((field) => {
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

const handleSubmit = () => {
  const allValid = validateAll();

  if (allValid) {
    emit("submit", { ...values.value });
  } else {
    emit("error", { errors: { ...errors.value } });
  }
};

const isValid = computed(() => {
  return Object.values(errors.value).every((v) => v === undefined);
});

defineExpose({
  validateAll,
  submit: handleSubmit,
  values,
  errors,
});
</script>

<style scoped>
.error {
  color: var(--color-red-500);
  font-size: var(--text-xs);
  margin: 4px;
}

.label {
  display: block;
  color: var(--color-gray-700);
  margin-bottom: 8px;
}
</style>
