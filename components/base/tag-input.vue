<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  modelValue?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: "Type and press Enter…",
  disabled: false,
});

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const tags = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);
const inputValue = ref("");

function addTag() {
  const val = inputValue.value.trim();
  if (!val || tags.value.includes(val)) {
    inputValue.value = "";
    return;
  }
  emit("update:modelValue", [...tags.value, val]);
  inputValue.value = "";
}

function removeTag(idx: number) {
  const next = [...tags.value];
  next.splice(idx, 1);
  emit("update:modelValue", next);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    addTag();
  } else if (e.key === "Backspace" && !inputValue.value && tags.value.length) {
    removeTag(tags.value.length - 1);
  }
}
</script>

<template>
  <div
    class="flex flex-wrap gap-1.5 items-center min-h-9 px-3 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-shadow cursor-text"
    :class="disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''"
    @click="($el as HTMLElement).querySelector('input')?.focus()"
  >
    <span
      v-for="(tag, i) in tags"
      :key="i"
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-xs font-medium shrink-0"
    >
      {{ tag }}
      <button
        v-if="!disabled"
        type="button"
        class="text-primary-400 hover:text-primary-700 leading-none ml-0.5"
        @click.stop="removeTag(i)"
      >
        &times;
      </button>
    </span>
    <input
      v-if="!disabled"
      v-model="inputValue"
      :placeholder="tags.length === 0 ? placeholder : ''"
      class="flex-1 min-w-24 outline-none text-sm bg-transparent"
      @keydown="onKeydown"
    />
    <span v-else-if="tags.length === 0" class="text-sm text-gray-400">{{
      placeholder
    }}</span>
  </div>
</template>
