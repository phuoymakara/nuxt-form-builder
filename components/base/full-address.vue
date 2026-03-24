<script setup lang="ts">
import { computed, reactive, watch } from "vue";

interface SubFieldConfig {
  label?: string;
  placeholder?: string;
  required?: boolean;
  /** Grid column span 1-12, default 6 */
  colSpan?: number;
  hidden?: boolean;
  apiEndpoint: string;
  labelKey?: string;
  valueKey?: string;
  searchable?: boolean;
}

interface Props {
  field: any;
  modelValue?: Record<string, any> | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, any>): void;
}>();

// Fixed cascade order: province → district → commune → village
const CASCADE_CHAIN = ["province", "district", "commune", "village"] as const;
type AddressLevel = (typeof CASCADE_CHAIN)[number];

const COL_SPAN_CLASS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

// Internal per-level values
const internal = reactive<Record<string, any>>({
  province: null,
  district: null,
  commune: null,
  village: null,
});

// Sync incoming modelValue → internal (only when it differs to avoid loops)
watch(
  () => props.modelValue,
  (val) => {
    for (const level of CASCADE_CHAIN) {
      internal[level] = val?.[level] ?? null;
    }
  },
  { immediate: true, deep: true },
);

const subFields = computed<Record<string, SubFieldConfig>>(
  () => props.field.props?.subFields ?? {},
);

const visibleLevels = computed(() =>
  CASCADE_CHAIN.filter((l) => subFields.value[l] && !subFields.value[l].hidden),
);

// Snapshot of internal state passed as formValues to each BaseAddress
const formValues = computed(() => ({ ...internal }));

/** Build a minimal field descriptor BaseAddress expects */
function buildSubField(level: AddressLevel) {
  const cfg = subFields.value[level];
  if (!cfg) return null;

  const idx = CASCADE_CHAIN.indexOf(level);
  const parent = idx > 0 ? CASCADE_CHAIN[idx - 1] : null;
  const parentValueKey = parent
    ? (subFields.value[parent]?.valueKey ?? "code")
    : null;

  return {
    name: level,
    required: cfg.required ?? false,
    dependsOn: parent ? [parent] : [],
    clearOnChange: true,
    props: {
      apiEndpoint: cfg.apiEndpoint,
      labelKey: cfg.labelKey ?? "name_kh",
      valueKey: cfg.valueKey ?? "code",
      searchable: cfg.searchable ?? true,
      placeholder: cfg.placeholder ?? `Select ${level}...`,
      ...(parent && parentValueKey
        ? {
            queryParams: (values: Record<string, any>) => {
              const parentVal = values[parent!];
              return parentVal
                ? { [`${parent}_code`]: parentVal[parentValueKey] }
                : {};
            },
          }
        : {}),
    },
  };
}

function handleChange(level: AddressLevel, value: any) {
  internal[level] = value;

  // Clear all downstream levels
  const idx = CASCADE_CHAIN.indexOf(level);
  for (let i = idx + 1; i < CASCADE_CHAIN.length; i++) {
    internal[CASCADE_CHAIN[i]] = null;
  }

  // Emit only visible levels
  const result: Record<string, any> = {};
  for (const l of visibleLevels.value) {
    result[l] = internal[l];
  }
  emit("update:modelValue", result);
}
</script>

<template>
  <div class="grid grid-cols-12 gap-4 w-full">
    <template v-for="level in visibleLevels" :key="level">
      <div
        :class="COL_SPAN_CLASS[subFields[level]?.colSpan ?? 6] ?? 'col-span-6'"
      >
        <div class="flex flex-col gap-1">
          <label
            v-if="subFields[level]?.label"
            class="block text-sm font-medium leading-6"
          >
            {{ subFields[level].label }}
            <span v-if="subFields[level]?.required" class="text-red-500 ms-0.5"
              >*</span
            >
          </label>
          <BaseAddress
            :field="buildSubField(level)!"
            :model-value="internal[level]"
            :form-values="formValues"
            :disabled="disabled"
            @update:model-value="handleChange(level, $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
