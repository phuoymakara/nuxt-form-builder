<template>
  <div>
    <!-- Progress -->
    <UCard
      :ui="{ body: 'max-w-4xl mx-auto px-4 py-6 flex gap-6', root: 'my-6' }"
    >
      <div
        v-for="(page, index) in config.pages"
        :key="page.id"
        class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        @click="currentPageIndex > 0 ? handlePrevious() : goTo(index)"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
          :class="
            index === currentPageIndex
              ? 'bg-green-600 text-white'
              : index < currentPageIndex
                ? 'bg-green-200 text-green-700'
                : 'bg-gray-200 text-gray-500'
          "
        >
          {{ index + 1 }}
        </div>
        <span class="text-sm">{{ page.title }}</span>
      </div>
    </UCard>

    <!-- Page Content -->
    <UCard class="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
      <h1 class="text-2xl font-bold mb-2">
        {{ currentPage.title }}
      </h1>

      <p v-if="currentPage.description" class="text-gray-600 mb-6">
        {{ currentPage.description }}
      </p>

      <!-- Single Section (flat fields) -->
      <div v-if="currentPage.fields && !currentPage.sections">
        <BuilderWizadForm
          :ref="(el) => registerFormRef(currentPageIndex, 'main', el)"
          v-model="formData[currentPage.id]"
          :fields="currentPage.fields"
        />
      </div>

      <!-- Multiple Sections (cards) -->
      <div v-else-if="currentPage.sections" class="space-y-8">
        <UCard
          v-for="(section, sectionIndex) in currentPage.sections"
          :key="section.id"
        >
          <!-- Section Header -->
          <div class="mb-6">
            <div class="flex items-start gap-3">
              <div v-if="section.icon" class="mt-1">
                <i :class="`${section.icon} text-xl text-green-600`"></i>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ section.title }}
                </h2>
                <p
                  v-if="section.description"
                  class="text-sm text-gray-600 mt-1"
                >
                  {{ section.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Section Fields -->
          <BuilderWizadForm
            :ref="(el) => registerFormRef(currentPageIndex, section.id, el)"
            v-model="formData[currentPage.id][section.id]"
            :fields="section.fields"
          />
        </UCard>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { FormConfig, ObjectGeneric } from "~/constants/form-builder";

interface Props {
  config: FormConfig;
}

const emit = defineEmits<{
  submit: [data: Record<string, ObjectGeneric>];
}>();

const props = defineProps<Props>();

/* ---------------------------------------------------
 * State
 * --------------------------------------------------- */
const currentPageIndex = ref(0);
const formRefs = ref<Record<number, Record<string, any>>>({});
const formData = reactive<Record<string, ObjectGeneric>>({});
const pageErrors = reactive<Record<string, any[]>>({});

/* ---------------------------------------------------
 * Init
 * --------------------------------------------------- */
watch(
  () => props.config,
  (config) => {
    if (!config?.pages) return;

    config.pages.forEach((page) => {
      formData[page.id] ||= {};
      pageErrors[page.id] ||= [];

      // Initialize section data if page has sections
      if (page.sections) {
        page.sections.forEach((section) => {
          formData[page.id][section.id] ||= {};
        });
      }
    });
  },
  { immediate: true },
);

/* ---------------------------------------------------
 * Computed
 * --------------------------------------------------- */
const currentPage = computed(() => props.config.pages[currentPageIndex.value]);

/* ---------------------------------------------------
 * Helpers
 * --------------------------------------------------- */
const getFormRef = (index = currentPageIndex.value, sectionId = "main") => {
  return formRefs.value[index]?.[sectionId]?.value;
};

const registerFormRef = (pageIndex: number, sectionId: string, el: any) => {
  if (el) {
    if (!formRefs.value[pageIndex]) {
      formRefs.value[pageIndex] = {};
    }
    formRefs.value[pageIndex][sectionId] = { value: el };
  }
};

const getAllPageFormRefs = (index = currentPageIndex.value) => {
  return formRefs.value[index] || {};
};

/* ---------------------------------------------------
 * Validation
 * --------------------------------------------------- */
// const validatePage = (index = currentPageIndex.value): boolean => {
//   const page = props.config.pages[index]
//   const allRefs = getAllPageFormRefs(index)
//   const errors: string[] = []

//   let isValid = true

//   // Validate all sections/forms on this page
//   Object.values(allRefs).forEach(ref => {
//     if (ref?.value) {
//       const valid = ref.value.validateAll()
//       if (!valid) {
//         isValid = false
//         errors.push(...(ref.value.errors || []))
//       }
//     }
//   })

//   pageErrors[page.id] = errors
//   return isValid
// }
// In BuilderWizardFormContainer.vue - FIX THE VALIDATION FUNCTION

const validatePage = (index = currentPageIndex.value): boolean => {
  const page = props.config.pages[index];
  const allRefs = getAllPageFormRefs(index);
  const errors: string[] = [];

  let isValid = true;

  // Validate all sections/forms on this page
  Object.entries(allRefs).forEach(([sectionId, ref]) => {
    console.log(`🔍 Validating section: ${sectionId}`);

    if (ref?.value) {
      const valid = ref.value.validateAll?.() ?? true;

      if (!valid) {
        isValid = false;

        // ✅ FIX: Handle errors properly (they might be Object, not Array)
        const sectionErrors = ref.value.errors;

        if (Array.isArray(sectionErrors)) {
          // If it's already an array, spread it
          errors.push(...sectionErrors);
        } else if (sectionErrors && typeof sectionErrors === "object") {
          // If it's an object, convert values to array
          const errorMessages = Object.values(sectionErrors)
            .filter((e) => typeof e === "string")
            .map((e) => String(e));

          errors.push(...errorMessages);
        }

        // console.log(`❌ Section "${sectionId}" errors:`, ref.value.errors)
      }
    }
  });

  pageErrors[page.id] = errors;
  console.log("✅ Total page errors:", errors);

  return isValid;
};

// Also fix validateAll() for the same issue
const validateAll = (): boolean => {
  for (let i = 0; i < props.config.pages.length; i++) {
    if (!validatePage(i)) {
      currentPageIndex.value = i;
      return false;
    }
  }
  return true;
};

/* ---------------------------------------------------
 * Save
 * --------------------------------------------------- */
const savePage = (index = currentPageIndex.value) => {
  const page = props.config.pages[index];
  const allRefs = getAllPageFormRefs(index);

  // Save data from all sections
  Object.entries(allRefs).forEach(([sectionId, ref]) => {
    if (ref?.value) {
      if (sectionId === "main") {
        // Flat fields
        formData[page.id] = { ...ref.value.values };
      } else {
        // Section fields
        formData[page.id][sectionId] = { ...ref.value.values };
      }
    }
  });
};

const saveAll = () => {
  props.config.pages.forEach((_, i) => savePage(i));
};

/* ---------------------------------------------------
 * Navigation
 * --------------------------------------------------- */
const handleNext = () => {
  if (validatePage()) {
    savePage();
    next();
  }
};

const handlePrevious = () => {
  savePage();
  previous();
};

const handleSubmit = () => {
  if (validateAll()) {
    saveAll();
    emit("submit", { ...formData });
  }
};

const next = () => {
  if (currentPageIndex.value < props.config.pages.length - 1) {
    currentPageIndex.value++;
  }
};

const previous = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--;
  }
};

const goTo = (index: number) => {
  if (index >= 0 && index < props.config.pages.length) {
    if (validatePage()) {
      savePage();
      currentPageIndex.value = index;
    }
  }
};

/* ---------------------------------------------------
 * Expose API (IMPORTANT)
 * --------------------------------------------------- */
defineExpose({
  // navigation
  next,
  previous,
  goTo,

  // validation
  validatePage,
  validateAll,

  // persistence
  savePage,
  saveAll,

  // state access
  getCurrentIndex: () => currentPageIndex.value,
  getFormData: () => ({ ...formData }),
});
</script>
