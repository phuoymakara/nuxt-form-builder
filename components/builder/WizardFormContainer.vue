<template>
  <div>
    <!-- Progress -->
    <div class="bg-white border-b mb-10">
      <div class="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        <div
          v-for="(page, index) in config.pages"
          :key="page.id"
          class="flex items-center gap-2"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
            :class="index === currentPageIndex
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
      </div>
    </div>

    <!-- Page -->
    <div class="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
      <h1 class="text-2xl font-bold mb-2">
        {{ currentPage.title }}
      </h1>

      <p v-if="currentPage.description" class="text-gray-600 mb-6">
        {{ currentPage.description }}
      </p>

      <BuilderWizadForm
        :ref="el => registerFormRef(currentPageIndex, el)"
        v-model="formData[currentPage.id]"
        :fields="currentPage.fields"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import type { FormConfig, ObjectGeneric } from "~/constants/form-builder"

interface Props {
  config: FormConfig
}

const props = defineProps<Props>()

/* ---------------------------------------------------
 * State
 * --------------------------------------------------- */
const currentPageIndex = ref(0)
const formRefs = ref<Record<number, any>>({})
const formData = reactive<Record<string, ObjectGeneric>>({})
const pageErrors = reactive<Record<string, any[]>>({})

/* ---------------------------------------------------
 * Init
 * --------------------------------------------------- */
watch(
  () => props.config,
  (config) => {
    if (!config?.pages) return

    config.pages.forEach(page => {
      formData[page.id] ||= {}
      pageErrors[page.id] ||= []
    })
  },
  { immediate: true }
)

/* ---------------------------------------------------
 * Computed
 * --------------------------------------------------- */
const currentPage = computed(() =>
  props.config.pages[currentPageIndex.value]
)

/* ---------------------------------------------------
 * Helpers
 * --------------------------------------------------- */
const getFormRef = (index = currentPageIndex.value) =>
  formRefs.value[index]?.value

const registerFormRef = (index: number, el: any) => {
  if (el) formRefs.value[index] = { value: el }
}

/* ---------------------------------------------------
 * Validation
 * --------------------------------------------------- */
const validatePage = (index = currentPageIndex.value): boolean => {
  const page = props.config.pages[index]
  const formRef = getFormRef(index)

  if (!formRef) return true

  const valid = formRef.validateAll()

  pageErrors[page.id] = valid ? [] : formRef.errors
  return valid
}

const validateAll = (): boolean => {
  for (let i = 0; i < props.config.pages.length; i++) {
    if (!validatePage(i)) {
      currentPageIndex.value = i
      return false
    }
  }
  return true
}

/* ---------------------------------------------------
 * Save
 * --------------------------------------------------- */
const savePage = (index = currentPageIndex.value) => {
  const page = props.config.pages[index]
  const formRef = getFormRef(index)

  if (!formRef) return
  formData[page.id] = { ...formRef.values }
}

const saveAll = () => {
  props.config.pages.forEach((_, i) => savePage(i))
}

/* ---------------------------------------------------
 * Navigation
 * --------------------------------------------------- */
const next = () => {
  if (currentPageIndex.value < props.config.pages.length - 1) {
    currentPageIndex.value++
  }
}

const previous = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
  }
}

const goTo = (index: number) => {
  if (index >= 0 && index < props.config.pages.length) {
    currentPageIndex.value = index
  }
}

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
})
</script>
