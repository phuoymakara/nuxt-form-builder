<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
  modelValue?: string;
  length?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  length: 6,
  disabled: false,
});

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const digits = ref<string[]>(Array(props.length).fill(""));
const inputRefs = ref<HTMLInputElement[]>([]);

watch(
  () => props.modelValue,
  (val) => {
    const chars = (val ?? "").split("");
    digits.value = Array(props.length)
      .fill("")
      .map((_, i) => chars[i] ?? "");
  },
  { immediate: true },
);

watch(
  () => props.length,
  (n) => {
    digits.value = Array(n)
      .fill("")
      .map((_, i) => digits.value[i] ?? "");
  },
);

function setRef(el: any, i: number) {
  if (el) inputRefs.value[i] = el;
}

function onInput(i: number, e: Event) {
  const target = e.target as HTMLInputElement;
  const val = target.value.replace(/\D/g, "").slice(-1);
  digits.value[i] = val;
  target.value = val;
  emit("update:modelValue", digits.value.join(""));
  if (val && i < props.length - 1) inputRefs.value[i + 1]?.focus();
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    if (digits.value[i]) {
      digits.value[i] = "";
      emit("update:modelValue", digits.value.join(""));
    } else if (i > 0) {
      inputRefs.value[i - 1]?.focus();
    }
  } else if (e.key === "ArrowLeft" && i > 0) {
    inputRefs.value[i - 1]?.focus();
  } else if (e.key === "ArrowRight" && i < props.length - 1) {
    inputRefs.value[i + 1]?.focus();
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = (e.clipboardData?.getData("text") ?? "")
    .replace(/\D/g, "")
    .slice(0, props.length);
  digits.value = Array(props.length)
    .fill("")
    .map((_, i) => text[i] ?? "");
  emit("update:modelValue", digits.value.join(""));
  inputRefs.value[Math.min(text.length, props.length - 1)]?.focus();
}
</script>

<template>
  <div class="flex gap-2">
    <input
      v-for="i in length"
      :key="i"
      :ref="(el) => setRef(el, i - 1)"
      :value="digits[i - 1]"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :disabled="disabled"
      class="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow bg-white"
      :class="disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''"
      @input="onInput(i - 1, $event)"
      @keydown="onKeydown(i - 1, $event)"
      @paste="onPaste"
    />
  </div>
</template>
