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
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center min-h-96">
      <USkeleton class="h-12 w-12 rounded-full" />
    </div>

    <!-- Form -->
    <BuilderWizardFormContainer
      v-else
      ref="wizard"
      :config="configWithDefaults"
      :initial-values="initialValues"
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
          v-if="!isLastPage"
          class="sm:px-8"
          color="primary"
          @click="onNext"
        >
          Next
        </UButton>

        <UButton v-else color="primary" @click="onSubmit"> Update </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BuilderWizardFormContainer } from "#components";
import { ref, computed } from "vue";
import { jobApplicationFormConfig } from "~/constants/form-builder";
import { useFormBuilder } from "~/services/form-builder";

definePageMeta({
  title: "ESB Form Builder - Edit",
});

const route = useRoute();
const wizard = ref<any>(null);
const toast = useToast();
const isLoading = ref(false);
const initialValues = ref<Record<string, any>>({});

// Mock existing data (replace with API fetch later)
const mockExistingData = {
  registration_choice: "new",
  search_info: { label: "កសិដ្ឋានគីរី", value: "S0054" },
  avatar: null,
  first_name_khmer: "ដាវ",
  first_name_english: "Dav",
  gender: "M",
  date_of_birth: "1995-06-15",
  email: "dav@example.com",
  phone: "0965123456",
  employment_type: "self-employed",
  company_name: "",
  position: "",
  business_name: "ឈ្មោះអាជីវកម្ម",
  business_type: "retail",
  salary: null,
  work_experience: "មាន ៥ ឆ្នាំបទពិសោធន៍",
  skills: ["javascript", "vue"],
  skills_other: "",
  portfolio_url: "https://dav-portfolio.com",
  resume: null,
  cover_letter: "ការពិពណ៌នារបស់ខ្ញុំ",
  D000001: null,
  D000004: null,
  D000005: null,
};
const formBuilder = useFormBuilder(
  jobApplicationFormConfig,
  "edit",
  mockExistingData,
);
const configWithDefaults = formBuilder.getConfigWithDefaults();

const currentIndex = computed(() => wizard.value?.getCurrentIndex?.() ?? 0);

const totalPages = jobApplicationFormConfig.pages.length;

const isLastPage = computed(() => currentIndex.value === totalPages - 1);

const canGoBack = computed(() => currentIndex.value > 0);

const onBack = () => {
  wizard.value?.previous();
};

const onNext = async () => {
  toast.clear();
  const valid = wizard.value?.validatePage();
  if (!valid) {
    toast.add({
      title: "សូមពិនិត្យម្តងទៀត",
      description: "សូមបំពេញឬដែលលម្អិតដែលត្រូវការ",
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
};

const onSubmit = async () => {
  const valid = wizard.value?.validateAll();
  if (!valid) return;

  wizard.value?.saveAll();
  const payload = wizard.value?.getFormData();

  try {
    const id = route.params.id;

    // TODO: Replace with actual API call
    // await $fetch(`/api/applications/${id}`, {
    //   method: 'PUT',
    //   body: payload
    // })

    // Mock: log the payload
    console.log("UPDATE PAYLOAD", payload);

    toast.add({
      title: "បានធ្វើបច្ចុប្បន្នភាព",
      description: "ទិន្នន័យបានរក្សាទុកដោយជោគជ័យ",
      color: "primary",
    });

    // Mock: navigate after success
    await navigateTo(`/applications/${id}`);
  } catch (error) {
    console.error("Update failed:", error);
    toast.add({
      title: "Error",
      description: "Failed to update form",
      color: "primary",
    });
  }
};
</script>
