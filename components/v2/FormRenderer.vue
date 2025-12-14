<script setup lang="ts" generic="Data extends Record<string, any>">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import FieldRenderer from "./FieldRenderer.vue";
import type { Field } from "~/types/form-builder";
import type { FieldOrRow } from "~/components/v2/types";

interface Props {
  items: FieldOrRow[];
  initialValues?: Data;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Data];
}>();

const allFields = computed(() => {
  return props.items.flatMap((item) => (isRow(item) ? item.fields : [item]));
});

const state = reactive<Data>(
  allFields.value.reduce(
    (acc, field) => {
      const initialValues = props.initialValues ?? ({} as Data);
      acc[field.name] = initialValues[field.name] ?? "";
      return acc;
    },
    {} as Record<string, any>,
  ) as Data,
);

const schema = computed(() => {
  const shape: Record<string, any> = {};

  allFields.value.forEach((field) => {
    if (field.validation) {
      shape[field.name] = field.validation;
    }
  });

  return z.object(shape);
});

type Schema = z.infer<(typeof schema)["value"]>;

function isRow(item: FieldOrRow): item is { type: "row"; fields: Field[] } {
  return "type" in item && item.type === "row";
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  emit("submit", event.data as Data);
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <template v-for="(item, index) in items" :key="index">
      <div
        v-if="isRow(item)"
        class="grid grid-cols-[repeat(var(--cols),1fr)] gap-4"
        :style="{ '--cols': item.fields.length }"
      >
        <FieldRenderer
          v-for="field in item.fields"
          :key="field.name"
          v-model="state[field.name]"
          :field="field"
        />
      </div>

      <V2FieldRenderer v-else v-model="state[item.name]" :field="item" />
    </template>

    <slot name="actions" :state="state">
      <UButton type="submit"> Submit </UButton>
    </slot>
  </UForm>
</template>
