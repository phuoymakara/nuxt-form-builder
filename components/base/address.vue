<template>
  <div class="w-full">
    <USelectMenu
      class="w-full"
      :id="field.name"
      v-model="selectedCode"
      :disabled="isDisabled || loading"
      :placeholder="field.props?.placeholder || 'Select...'"
      :items="formattedOptions"
      :searchable="field.props?.searchable ?? true"
      :loading="loading"
      searchable-placeholder="ស្វែងរក..."
      @update:model-value="handleChange"
      @change="handleChangeEvent"
      @update:open="(val) => emit('update:open', val)"
      @blur="(event) => emit('blur', event)"
      @focus="(event) => emit('focus', event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

interface Props {
  field: any;
  modelValue: any;
  disabled?: boolean;
  apiBaseUrl?: string;
  formValues?: Record<string, any>;
}

interface Emits {
  (e: "update:modelValue", value: any): void;
  (e: "clear:dependents", fieldName: string): void;
  (e: "update:open", value: boolean): void;
  (e: "change", payload: { event: Event; value: any }): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
  (e: "dependency:changed", fieldName: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  apiBaseUrl: "/api/address",
  formValues: () => ({}),
});

const emit = defineEmits<Emits>();

const options = ref<Array<{ label: string; value: string; _raw: any }>>([]);
const loading = ref(false);
const cachedData = ref<Record<string, any>>({});

const selectedCode = computed({
  get() {
    if (!props.modelValue) return null;
    if (typeof props.modelValue === "object" && props.modelValue?.code) {
      return props.modelValue.name_kh || props.modelValue.code;
    }
    return props.modelValue;
  },
  set(value: string | null) {
    if (value) {
      handleChange(value);
    }
  },
});

const formattedOptions = computed(() => {
  return options.value.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));
});

const isDisabled = computed(() => {
  if (props.disabled) return true;

  if (props.field.dependsOn?.length) {
    return props.field.dependsOn.some(
      (dep: string) => !props.formValues?.[dep],
    );
  }

  return false;
});

function buildApiUrl(): string {
  const endpoint = props.field.props?.apiEndpoint;
  let url = endpoint;

  if (props.field.props?.queryParams && props.formValues) {
    try {
      const params = props.field.props.queryParams(props.formValues);
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
      }
    } catch (err) {
      console.error(
        `Error building query params for ${props.field.name}:`,
        err,
      );
    }
  }

  return url;
}

function getCacheKey(): string {
  return buildApiUrl();
}

async function fetchOptions(skipCache = false) {
  if (isDisabled.value) {
    options.value = [];
    return;
  }

  const cacheKey = getCacheKey();

  if (!skipCache && cachedData.value[cacheKey]) {
    options.value = cachedData.value[cacheKey];
    return;
  }

  loading.value = true;

  try {
    const url = buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const labelKey = props.field.props?.labelKey || "name_kh";
    const valueKey = props.field.props?.valueKey || "code";

    const items = Array.isArray(data)
      ? data
      : data.data ||
        data.provinces ||
        data.districts ||
        data.communes ||
        data.villages ||
        [];

    const formattedOptions = items.map((item: any) => ({
      label: item[labelKey],
      value: item[valueKey],
      _raw: item,
    }));

    cachedData.value[cacheKey] = formattedOptions;
    options.value = formattedOptions;
  } catch (err) {
    console.error(`${props.field.name} fetch error:`, err);
    options.value = [];
  } finally {
    loading.value = false;
  }
}

function handleChange(selectedOption: any) {
  const selectedValue = selectedOption?.value || selectedOption;
  const selectedItem = options.value.find((opt) => opt.value === selectedValue);
  const rawObject = selectedItem?._raw || {
    code: selectedValue,
    name_kh: selectedItem?.label,
  };

  emit("update:modelValue", rawObject);

  if (props.field.clearOnChange) {
    emit("clear:dependents", props.field.name);
  }
}

function handleChangeEvent(event: Event) {
  const currentValue = selectedCode.value;
  const selectedItem = options.value.find((opt) => opt.value === currentValue);
  const rawObject = selectedItem?._raw || {
    code: currentValue,
    name_kh: selectedItem?.label,
  };

  emit("change", { event, value: rawObject });
}

watch(
  () => props.modelValue,
  () => {
    cachedData.value = {};
    emit("dependency:changed", props.field.name);
  },
);

onMounted(() => {
  if (!isDisabled.value) {
    fetchOptions();
  }
});

defineExpose({
  refetch: () => {
    cachedData.value = {};
    options.value = [];
    setTimeout(() => {
      fetchOptions(true);
    }, 50);
  },
});
</script>
