<script setup lang="ts">
import type { Field } from "~/types/form-builder";
import { resolveComponentMap } from "../builder/ui-helper";

interface Props {
  field: Field;
}

defineProps<Props>();

const value = defineModel<any>();

function getComponent(field: Field) {
  if (typeof field.component === "string") {
    return resolveComponentMap[field.component] || field.component;
  }
  return field.component;
}
</script>

<template>
  <UFormField
    :name="field.name"
    :label="field.label"
    :description="field.description"
    :required="field.required"
  >
    <component
      :is="getComponent(field)"
      v-model="value"
      :placeholder="field.placeholder || field.props"
      :type="field.type"
      v-bind="{ ...field.props, ...field.attrs }"
      class="w-full"
    />
  </UFormField>
</template>
