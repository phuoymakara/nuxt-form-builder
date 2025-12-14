<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Progress Steps -->
    <div class="bg-white border-b">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div
            v-if="config?.pages?.length"
            v-for="(page, index) in config.pages"
            :key="page.id"
            class="flex items-center flex-1"
          >
            <!-- Step Circle -->
            <button
              @click="goToPage(index)"
              :disabled="!canAccessPage(index)"
              :class="[
                'flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all',
                currentPageIndex === index
                  ? 'bg-green-600 text-white ring-4 ring-green-200'
                  : canAccessPage(index)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ]"
            >
              <UIcon
                v-if="
                  canAccessPage(index) &&
                  currentPageIndex !== index &&
                  index < currentPageIndex
                "
                name="i-heroicons-check"
              />
              <span v-else>{{ index + 1 }}</span>
            </button>

            <!-- Step Label -->
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ page.title }}</p>
              <p v-if="page.description" class="text-xs text-gray-500">
                {{ page.description }}
              </p>
            </div>

            <!-- Divider -->
            <div
              v-if="index < config.pages.length - 1"
              :class="[
                'h-1 flex-1 mx-4 transition-colors',
                index < currentPageIndex ? 'bg-green-600' : 'bg-gray-200',
              ]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Current Page -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            {{ currentPage.title }}
          </h1>
          <p v-if="currentPage.description" class="text-gray-600 mt-2">
            {{ currentPage.description }}
          </p>
        </div>

        <!-- Form -->
        <BuilderA
          :ref="`formRef_${currentPageIndex}`"
          v-model="formData[currentPage.id]"
          :fields="currentPage.fields"
          @submit="onPageSubmit"
          @error="onPageError"
          @validate="onValidate"
        />
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-8 flex justify-between gap-4">
        <UButton
          v-if="currentPageIndex > 0"
          color="primary"
          variant="outline"
          size="lg"
          @click="previousPage"
        >
          {{ config.previousButtonText || "Back" }}
        </UButton>

        <div class="flex gap-4 ml-auto">
          <UButton
            v-if="currentPageIndex < config.pages.length - 1"
            color="primary"
            size="lg"
            @click="submitForm"
          >
            {{ config.nextButtonText || "Next" }}
          </UButton>

          <UButton v-else color="primary" size="lg" @click="submitForm">
            {{ config.submitButtonText || "Submit" }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import type { FormConfig, ObjectGeneric } from "~/constants/form-builder";

interface Props {
  config: FormConfig;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: ObjectGeneric];
  pageChange: [pageIndex: number];
  error: [error: any];
}>();

// ===================================================================
// State
// ===================================================================
const currentPageIndex = ref(0);
const formData = reactive<Record<string, ObjectGeneric>>({});
const formRefs = ref<Record<string, any>>({});
const pageErrors = reactive<Record<string, string[]>>({});

// Initialize form data for each page
// props.config.pages.forEach((page) => {
//   formData[page.id] = {};
//   pageErrors[page.id] = [];
// });
watch(
  () => props.config,
  (config) => {
    if (!config || !config.pages) return;

    config.pages.forEach((page) => {
      formData[page.id] = {};
      pageErrors[page.id] = [];
    });
  },
  { immediate: true },
);

// ===================================================================
// Computed
// ===================================================================
const currentPage = computed(() => props.config.pages[currentPageIndex.value]);

const canAccessPage = (pageIndex: number): boolean => {
  // Can access current page and previous pages
  return pageIndex <= currentPageIndex.value;
};

const isCurrentPageValid = computed(() => {
  const formRef = formRefs.value[`formRef_${currentPageIndex.value}`]?.value;
  return formRef?.validateAll() ?? false;
});

// ===================================================================
// Methods
// ===================================================================

const goToPage = (pageIndex: number) => {
  if (!canAccessPage(pageIndex)) return;
  currentPageIndex.value = pageIndex;
  emit("pageChange", pageIndex);
};

const previousPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--;
    emit("pageChange", currentPageIndex.value);
  }
};

const nextPage = async () => {
  // Validate current page before moving to next
  const formRef = formRefs.value[`formRef_${currentPageIndex.value}`]?.value;

  if (!formRef) {
    console.error("Form ref not found");
    return;
  }

  const isValid = formRef.validateAll();

  if (!isValid) {
    emit("error", {
      page: currentPage.value.id,
      errors: formRef.errors,
    });
    return;
  }

  // Update form data
  formData[currentPage.value.id] = { ...formRef.values };

  // Move to next page
  if (currentPageIndex.value < props.config.pages.length - 1) {
    currentPageIndex.value++;
    emit("pageChange", currentPageIndex.value);
  }
};

const onPageSubmit = (values: ObjectGeneric) => {
  // Update form data for current page
  formData[currentPage.value.id] = values;
};

const onPageError = (error: any) => {
  pageErrors[currentPage.value.id] = error.errors || [];
};

const onValidate = (event: any) => {
  // Handle field validation
};

const submitForm = async () => {
  // Validate all pages
  let allValid = true;

  for (let i = 0; i < props.config.pages.length; i++) {
    const page = props.config.pages[i];
    const formRef = formRefs.value[`formRef_${i}`]?.value;

    if (!formRef) continue;

    if (!formRef.validateAll()) {
      allValid = false;
      pageErrors[page.id] = formRef.errors;
    }
  }

  if (!allValid) {
    emit("error", { message: "Please fix all errors before submitting" });
    // Go to first page with errors
    for (let i = 0; i < props.config.pages.length; i++) {
      if (Object.keys(pageErrors[props.config.pages[i].id]).length > 0) {
        currentPageIndex.value = i;
        break;
      }
    }
    return;
  }

  // Merge all form data
  const completeFormData: ObjectGeneric = {};
  props.config.pages.forEach((page) => {
    Object.assign(completeFormData, formData[page.id]);
  });

  emit("submit", completeFormData);
};

// Register form ref
const registerFormRef = (pageIndex: number, ref: any) => {
  formRefs.value[`formRef_${pageIndex}`] = { value: ref };
};
</script>
