<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { FormConfig, FormSection } from "~/constants/form-builder";

interface Props {
  config: FormConfig;
  initialValues?: Record<string, Record<string, any>>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Record<string, any>];
  pageChange: [index: number];
}>();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const currentPageIndex = ref(0);
const formData = reactive<Record<string, any>>({});

props.config.pages.forEach((page) => {
  formData[page.id] = props.initialValues?.[page.id] ?? {};
  if (page.sections) {
    page.sections.forEach((section) => { formData[page.id][section.id] ??= {}; });
  }
});

// refs keyed by "pageId:sectionId" (or "pageId:main" for flat pages)
const formRefs = ref<Record<string, any>>({});

function registerRef(key: string, el: any) {
  if (el) formRefs.value[key] = el;
  else delete formRefs.value[key];
}

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const currentPage = computed(() => props.config.pages[currentPageIndex.value]);
const isFirstPage = computed(() => currentPageIndex.value === 0);
const isLastPage = computed(() => currentPageIndex.value === props.config.pages.length - 1);

function refKeysForPage(pageId: string): string[] {
  const page = props.config.pages.find((p) => p.id === pageId);
  if (!page) return [];
  if (page.sections) return page.sections.map((s) => `${pageId}:${s.id}`);
  return [`${pageId}:main`];
}

// ---------------------------------------------------------------------------
// Page persistence & validation
// ---------------------------------------------------------------------------

function saveCurrentPage() {
  const page = currentPage.value;
  if (!page) return;
  if (page.sections) {
    for (const section of page.sections) {
      const ref = formRefs.value[`${page.id}:${section.id}`];
      if (ref?.values) formData[page.id][section.id] = { ...ref.values };
    }
  } else {
    const ref = formRefs.value[`${page.id}:main`];
    if (ref?.values) formData[page.id] = { ...ref.values };
  }
}

async function validateCurrentPage(): Promise<boolean> {
  const page = currentPage.value;
  if (!page) return true;
  let allValid = true;
  for (const key of refKeysForPage(page.id)) {
    const ref = formRefs.value[key];
    if (ref?.validate && !(await ref.validate())) allValid = false;
  }
  return allValid;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

async function goNext() {
  if (!(await validateCurrentPage())) return;
  saveCurrentPage();
  currentPageIndex.value++;
  emit("pageChange", currentPageIndex.value);
}

function goPrevious() {
  saveCurrentPage();
  currentPageIndex.value--;
  emit("pageChange", currentPageIndex.value);
}

async function goTo(index: number) {
  if (index === currentPageIndex.value) return;
  if (index > currentPageIndex.value && !(await validateCurrentPage())) return;
  saveCurrentPage();
  currentPageIndex.value = index;
  emit("pageChange", index);
}

// ---------------------------------------------------------------------------
// Submit — flatten all pages/sections into one object
// ---------------------------------------------------------------------------

async function handleSubmit() {
  if (!(await validateCurrentPage())) return;
  saveCurrentPage();
  const output: Record<string, any> = {};
  for (const page of props.config.pages) {
    if (page.sections) {
      for (const section of page.sections) Object.assign(output, formData[page.id]?.[section.id] ?? {});
    } else {
      Object.assign(output, formData[page.id] ?? {});
    }
  }
  emit("submit", output);
}

defineExpose({ currentPageIndex, formData, goNext, goPrevious, goTo, validateCurrentPage, getCurrentIndex: () => currentPageIndex.value });
</script>

<template>
  <div>
    <!-- progress steps -->
    <div class="mb-8 px-1">
      <div class="flex items-center">
        <template v-for="(page, index) in config.pages" :key="page.id">
          <button type="button" class="flex flex-col items-center gap-1.5 group" @click="goTo(index)">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors"
              :class="{
                'bg-primary-600 text-white shadow-sm': index === currentPageIndex,
                'bg-primary-100 text-primary-700': index < currentPageIndex,
                'bg-gray-100 text-gray-400': index > currentPageIndex,
              }"
            >
              <UIcon v-if="index < currentPageIndex" name="i-heroicons-check-20-solid" class="size-4" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span
              class="text-xs hidden sm:block whitespace-nowrap"
              :class="{
                'text-primary-600 font-semibold': index === currentPageIndex,
                'text-primary-500': index < currentPageIndex,
                'text-gray-400': index > currentPageIndex,
              }"
            >
              {{ page.title }}
            </span>
          </button>
          <div
            v-if="index < config.pages.length - 1"
            class="flex-1 h-px mx-3 mb-5"
            :class="index < currentPageIndex ? 'bg-primary-400' : 'bg-gray-200'"
          />
        </template>
      </div>
    </div>

    <!-- sectioned page -->
    <div v-if="currentPage.sections" class="space-y-6">
      <UCard v-for="section in currentPage.sections" :key="section.id">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon v-if="section.icon" :name="section.icon" class="size-5 text-primary-600 shrink-0" />
            <div>
              <h3 class="text-base font-semibold text-gray-900">{{ section.title }}</h3>
              <p v-if="section.description" class="text-sm text-gray-500 mt-0.5">{{ section.description }}</p>
            </div>
          </div>
        </template>
        <V2FormRenderer
          :key="`${currentPage.id}:${section.id}`"
          :ref="(el: any) => registerRef(`${currentPage.id}:${section.id}`, el)"
          :fields="(section as FormSection).fields"
          :initial-values="formData[currentPage.id]?.[section.id]"
          hide-actions
          @submit="() => {}"
        />
      </UCard>
    </div>

    <!-- flat-fields page -->
    <UCard v-else>
      <template #header>
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ currentPage.title }}</h2>
          <p v-if="currentPage.description" class="text-sm text-gray-500 mt-1">{{ currentPage.description }}</p>
        </div>
      </template>
      <V2FormRenderer
        :key="currentPage.id"
        :ref="(el: any) => registerRef(`${currentPage.id}:main`, el)"
        :fields="currentPage.fields ?? []"
        :initial-values="formData[currentPage.id]"
        hide-actions
        @submit="() => {}"
      />
    </UCard>

    <!-- navigation -->
    <div class="flex items-center justify-between mt-6">
      <UButton v-if="!isFirstPage" variant="outline" leading-icon="i-heroicons-arrow-left" @click="goPrevious">
        {{ config.previousButtonText ?? "Previous" }}
      </UButton>
      <div v-else />
      <UButton v-if="!isLastPage" trailing-icon="i-heroicons-arrow-right" @click="goNext">
        {{ config.nextButtonText ?? "Next" }}
      </UButton>
      <UButton v-else color="primary" @click="handleSubmit">
        {{ config.submitButtonText ?? "Submit" }}
      </UButton>
    </div>
  </div>
</template>