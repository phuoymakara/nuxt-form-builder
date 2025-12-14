<template>
  <UModal fullscreen title="Configuration">
    <div class="w-full flex justify-center pt-10">
      <UButton label="View Configuration" color="primary" variant="solid" />
    </div>
    <template #body>
      <UCard class="mt-10 w-10/12 mx-auto">
        <pre class="bg-black/90 text-white p-4">{{
          JSON.stringify(jobApplicationFormConfig, undefined, 2)
        }}</pre>
      </UCard>
    </template>
  </UModal>

  <div class="min-h-screen bg-gray-50 p-8">
    <!-- Wizard -->

    <BuilderWizardFormContainer
      ref="wizard"
      :config="jobApplicationFormConfig"
    />

    <!-- Actions -->
    <div class="w-6/12 mx-auto mt-10 flex justify-between gap-4">
      <UButton
        class="sm:p-2.5 sm:px-6"
        variant="outline"
        :disabled="!canGoBack"
        @click="onBack"
      >
        Back
      </UButton>

      <div class="flex gap-4">
        <UButton color="primary" variant="outline" @click="onSaveDraft">
          Save Draft
        </UButton>

        <UButton
          class="sm:px-8"
          v-if="!isLastPage"
          color="primary"
          @click="onNext"
        >
          Next
        </UButton>

        <UButton v-else color="primary" @click="onSubmit"> Submit </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BuilderWizardFormContainer } from "#components";
import { ref, computed } from "vue";
import { jobApplicationFormConfig } from "~/constants/form-builder";

definePageMeta({
  title: "ESB Form Builder",
  description: "ESB",
  image: "/og.png",
  author: "Makara",
  keywords: "ESB, Form",
  ogType: "website",
  name: "esb-maff",
});

const wizard = ref<any>(null);
const toast = useToast();
/* ---------------------------------------------------
 * Computed helpers (derived from wizard state)
 * --------------------------------------------------- */
const currentIndex = computed(() => wizard.value?.getCurrentIndex?.() ?? 0);

const totalPages = jobApplicationFormConfig.pages.length;

const isLastPage = computed(() => currentIndex.value === totalPages - 1);

const canGoBack = computed(() => currentIndex.value > 0);

/* ---------------------------------------------------
 * Actions
 * --------------------------------------------------- */
const onBack = () => {
  wizard.value?.previous();
};

const onNext = async () => {
  toast.clear();
  const valid = wizard.value?.validatePage();
  if (!valid) {
    toast.add({
      title: "សូមពិនិត្យម្តងទៀត",
      description: "សូមបំពេញ​ឬ​ដែលលម្អិតដែលត្រូវការ",
      color: "primary",
      icon: "i-heroicons-exclamation-circle",
    });
    return;
  }

  wizard.value?.savePage();
  wizard.value?.next();
};

const onSaveDraft = () => {
  wizard.value?.savePage();

  const data = wizard.value?.getFormData();
  console.log("SAVE DRAFT", data);

  // await api.saveDraft(data)
};

const onSubmit = async () => {
  const valid = wizard.value?.validateAll();
  if (!valid) return;

  wizard.value?.saveAll();

  const payload = wizard.value?.getFormData();
  console.log("FINAL SUBMIT", payload);
  toast.add({
    title: "បានស្នើរសុំ",
    description: "សូមរងចាំការអនុម័ត",
    color: "primary",
  });
  // await api.submit(payload)
};
</script>
