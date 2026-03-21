<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { interpretConfig } from "~/utils/form-schema";
import type { JSONFormConfig } from "~/utils/form-schema";
import { useFormStorage } from "~/composables/useFormStorage";

definePageMeta({ title: "Dynamic Form" });

const route = useRoute();
const toast = useToast();
const { loadForm } = useFormStorage();

const { data: jsonConfig, pending, error } = await useFetch<JSONFormConfig>(
  `/api/forms/${route.params.id}`,
);

// fallback: check localStorage when API returns 404
const localConfig = ref<JSONFormConfig | null>(null);
const isLocal = computed(() => !!localConfig.value && !!error.value);

onMounted(() => {
  if (error.value) {
    const saved = loadForm(route.params.id as string);
    if (saved) localConfig.value = saved.config;
  }
});

const activeConfig = computed(() => jsonConfig.value ?? localConfig.value);

const runtimeConfig = computed(() =>
  activeConfig.value ? interpretConfig(activeConfig.value) : null,
);

const submittedData = ref<Record<string, any> | null>(null);

function handleSubmit(data: Record<string, any>) {
  submittedData.value = data;
  toast.add({
    title: "Submitted!",
    description: "Your form has been submitted successfully.",
    color: "success",
    icon: "i-heroicons-check-circle",
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-16">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <!-- Back -->
        <div class="mb-6">
          <AppBackButton fallback="/dynamic" label="All Forms" />
        </div>

        <!-- Loading -->
        <div v-if="pending" class="space-y-6">
          <USkeleton class="h-10 w-64 rounded-lg" />
          <USkeleton class="h-96 w-full rounded-xl" />
        </div>

        <!-- Not found in API or localStorage -->
        <UCard v-else-if="error && !localConfig" class="text-center py-12">
          <UIcon name="i-heroicons-exclamation-circle" class="size-12 text-red-400 mx-auto mb-4" />
          <h2 class="text-lg font-semibold text-gray-900 mb-1">Form not found</h2>
          <p class="text-gray-500 text-sm mb-4">
            No form template exists for "{{ route.params.id }}".
          </p>
          <UButton to="/dynamic" variant="outline">Browse all forms</UButton>
        </UCard>

        <!-- Form -->
        <template v-else-if="runtimeConfig">
          <!-- Header -->
          <div class="mb-8 flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge :color="isLocal ? 'warning' : 'primary'" variant="soft">
                  {{ isLocal ? "Local" : "Dynamic" }}
                </UBadge>
                <span class="text-xs text-gray-400">{{ route.params.id }}</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">{{ activeConfig?.title }}</h1>
              <p v-if="activeConfig?.description" class="text-gray-500 mt-1 text-sm">
                {{ activeConfig.description }}
              </p>
            </div>
            <!-- Edit in builder for local forms -->
            <UButton
              v-if="isLocal"
              :to="`/builder?load=${route.params.id}`"
              size="sm"
              variant="outline"
              leading-icon="i-heroicons-pencil-square"
            >
              Edit
            </UButton>
          </div>

          <!-- Single-page form -->
          <template v-if="runtimeConfig.pages.length === 1">
            <UCard>
              <V2FormRenderer
                :fields="runtimeConfig.pages[0].fields ?? runtimeConfig.pages[0].sections?.[0]?.fields ?? []"
                @submit="handleSubmit"
              >
                <template #actions="{ submit }">
                  <div class="flex justify-end pt-2">
                    <UButton type="button" icon="i-heroicons-paper-airplane" @click="submit">
                      {{ activeConfig?.submitButtonText ?? "Submit" }}
                    </UButton>
                  </div>
                </template>
              </V2FormRenderer>
            </UCard>
          </template>

          <!-- Multi-page wizard -->
          <template v-else>
            <V2WizardRenderer :config="runtimeConfig" @submit="handleSubmit" />
          </template>

          <!-- Submitted payload -->
          <UCard v-if="submittedData" class="mt-8">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-check" class="size-5 text-green-500" />
                <h3 class="font-semibold">Submitted Payload</h3>
              </div>
            </template>
            <pre class="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-80">{{
              JSON.stringify(submittedData, null, 2)
            }}</pre>
          </UCard>
        </template>
      </div>
    </UContainer>
  </div>
</template>