<script setup lang="ts">
import type { FieldWithConditions } from "~/types/form-builder";
import { resolveComponentMap } from "~/utils/ui-helper";

interface Props {
  field: FieldWithConditions;
  formValues?: Record<string, any>; // needed by cascading address
  options?: any[]; // pre-computed from useFormState.getOptions
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  formValues: () => ({}),
  options: () => [],
  disabled: false,
});

const value = defineModel<any>();

function getComponent(field: FieldWithConditions) {
  if (typeof field.component === "string") {
    return resolveComponentMap[field.component] ?? field.component;
  }
  return field.component;
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) {
    value.value = null;
    return;
  }
  const allowMultiple = props.field.props?.multiple ?? false;
  value.value = allowMultiple ? Array.from(files) : files[0];
}

function fieldProps() {
  const computedItems = props.options?.length ? props.options : undefined;
  return {
    ...props.field.props,
    ...props.field.attrs,
    ...(computedItems ? { items: computedItems } : {}),
  };
}
</script>

<template>
  <UFormField
    :name="field.name"
    :label="field.label"
    :description="field.description"
    :required="field.required"
  >
    <!-- date picker -->
    <BaseDatePicker
      v-if="field.component === 'UCalendar'"
      :field="field"
      :model-value="value"
      @update:model-value="value = $event"
    />

    <!-- full address group -->
    <BaseFullAddress
      v-else-if="field.component === 'UFullAddress'"
      :field="field"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- cascading address -->
    <BaseAddress
      v-else-if="field.component === 'UAddress'"
      :field="field"
      :model-value="value"
      :form-values="formValues"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- async searchable select -->
    <BaseAsynSelect
      v-else-if="field.component === 'UAsyncSelect'"
      :field="field"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- switch / toggle -->
    <USwitch
      v-else-if="field.component === 'USwitch'"
      v-model="value"
      :disabled="disabled"
      v-bind="{ ...field.props, ...field.attrs }"
    />

    <!-- tag input -->
    <BaseTagInput
      v-else-if="field.component === 'UTagInput'"
      :model-value="value"
      :placeholder="field.placeholder"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- date range -->
    <BaseDateRange
      v-else-if="field.component === 'UDateRange'"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- OTP / PIN -->
    <BaseOtpInput
      v-else-if="field.component === 'UOtpInput'"
      :model-value="value"
      :length="field.props?.length ?? 6"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- repeater group -->
    <BaseRepeaterGroup
      v-else-if="field.component === 'URepeater'"
      :fields="field.props?.fields ?? []"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- table field -->
    <BaseTableField
      v-else-if="field.component === 'UTableField'"
      :columns="field.props?.columns ?? []"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- image / avatar upload -->
    <UFileUpload
      v-else-if="field.component === 'UFileUpload'"
      :model-value="value"
      v-bind="{ accept: 'image/*', ...field.props, ...field.attrs }"
      :disabled="disabled"
      @update:model-value="value = $event"
    />

    <!-- file input -->
    <input
      v-else-if="field.component === 'UFileInput'"
      type="file"
      v-bind="{ ...field.props, ...field.attrs }"
      :disabled="disabled"
      class="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
      @change="onFileChange"
    />

    <!-- all other Nuxt UI components -->
    <component
      v-else
      :is="getComponent(field)"
      v-model="value"
      :placeholder="field.placeholder"
      :type="field.type"
      :disabled="disabled"
      v-bind="fieldProps()"
      class="w-full"
    />
  </UFormField>
</template>
