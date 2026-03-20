<script setup lang="ts">
import { ref } from "vue";
import { jobApplicationFormConfig } from "~/constants/form-builder";

definePageMeta({
  title: "V2 Wizard Form",
});

const wizardRef = ref<any>(null);
const toast = useToast();
const submittedData = ref<Record<string, any> | null>(null);

async function handleSubmit(data: Record<string, any>) {
  submittedData.value = data;
  console.log("✅ Submitted:", data);
  toast.add({
    title: "ដំណើរការបានជោគជ័យ!",
    description: "ព័ត៌មានរបស់អ្នកត្រូវបានដាក់ស្នើ",
    color: "success",
    icon: "i-heroicons-check-circle",
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10">
    <UContainer>
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="mb-3">
            <AppBackButton fallback="/v2" label="Back" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">V2 Wizard Form</h1>
              <p class="text-sm text-gray-500 mt-1">
                Multi-step · Conditional fields · Cascading selects · Zod validation
              </p>
            </div>
            <UBadge color="primary" variant="soft" size="lg">V2</UBadge>
          </div>
        </div>

        <!-- Wizard -->
        <V2WizardRenderer
          ref="wizardRef"
          :config="jobApplicationFormConfig"
          @submit="handleSubmit"
          @page-change="(i) => console.log('Page:', i)"
        />

        <!-- Submitted payload preview -->
        <UCard v-if="submittedData" class="mt-8">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-document-check"
                class="size-5 text-green-500"
              />
              <h3 class="font-semibold text-gray-900">Submitted Data</h3>
            </div>
          </template>
          <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">{{
            JSON.stringify(submittedData, null, 2)
          }}</pre>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
