<template>
  <div class="relative">
    <USelectMenu
      :id="field.name"
      v-model="selectedValue"
      :searchable="true"
      :loading="isLoading"
      :items="filteredOptions"
      :placeholder="field.props?.placeholder || 'Select...'"
      :popper="{ placement: 'bottom-start' }"
      @update:model-value="handleSelect"
      @open="onOpen"
      :disabled="isDisabled"
      @update:search-term="handleSearch"
      :ui="{
        base: 'relative w-full',
        input: 'w-full',
      }"
    >
      <template #empty>
        <div class="px-2 py-1.5 text-sm text-gray-500">
          {{
            isLoading
              ? field.props?.loadingText || "Loading..."
              : field.props?.noResultsText || "No results"
          }}
        </div>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";

interface Props {
  field: any;
  modelValue: any;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: any];
}>();

const isLoading = ref(false);
const searchQuery = ref("");
const allOptions = ref<any[]>([]);
const selectedValue = ref(props.modelValue);
//@ts-ignore
const debounceTimer = ref<NodeJS.Timeout>();
const isSearching = ref(false);

const isDisabled = computed(() => props.disabled);

// Filter options based on search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return allOptions.value;
  }

  const query = searchQuery.value.toLowerCase();
  return allOptions.value.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      option.value?.toString().toLowerCase().includes(query),
  );
});

// Handle dropdown open - fetch initial data
const onOpen = async () => {
  if (allOptions.value.length === 0) {
    await fetchOptions("");
  }
};

// Handle search input from the searchable menu
const handleSearch = async (searchText: string) => {
  searchQuery.value = searchText;
  isSearching.value = true;

  // Clear previous timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }

  const minChars = props.field.props?.minChars || 2;

  // Don't search if below minimum characters
  if (searchQuery.value.length < minChars && searchQuery.value.length > 0) {
    return;
  }

  // Debounce the API call
  debounceTimer.value = setTimeout(() => {
    fetchOptions(searchQuery.value);
  }, props.field.props?.debounce || 300);
};

// Fetch options from API
const fetchOptions = async (query: string) => {
  isLoading.value = true;

  try {
    const endpoint = props.field.props?.apiEndpoint;
    const searchParam = props.field.props?.searchParam || "q";
    const transformResponse = props.field.props?.transformResponse;

    if (!endpoint) {
      console.error("apiEndpoint not provided");
      return;
    }

    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set(searchParam, query);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform response using provided function or default mapping
    if (transformResponse && typeof transformResponse === "function") {
      allOptions.value = transformResponse(data);
    } else {
      // Default: assume data is array of objects with label and value
      allOptions.value = Array.isArray(data) ? data : data.data || [];
    }
  } catch (error) {
    console.error("Error fetching options:", error);
    allOptions.value = [];
  } finally {
    isLoading.value = false;
    isSearching.value = false;
  }
};

// Handle selection
const handleSelect = (value: any) => {
  selectedValue.value = value;
  emit("update:modelValue", value);
  searchQuery.value = ""; // Reset search
};

// Watch for external model value changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue;
  },
);

// Watch for search input changes (this is the key for tracking input)
watch(
  () => selectedValue.value,
  async (newVal, oldVal) => {
    // Only trigger search if it looks like a search string, not a selected value
    if (typeof newVal === "string" && newVal !== oldVal && newVal.length > 0) {
      handleSearch(newVal);
    }
  },
);

// Cleanup on unmount
onBeforeUnmount(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
});
</script>
