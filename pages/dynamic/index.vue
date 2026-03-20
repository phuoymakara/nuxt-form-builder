<script setup lang="ts">
import { onMounted } from "vue";
import { useFormStorage } from "~/composables/useFormStorage";
import { useConfirmModal } from "~/composables/useConfirmModal";

definePageMeta({ title: "Dynamic Forms" });

const { data: forms, pending } = await useFetch("/api/forms");

const { savedForms, refresh, deleteForm } = useFormStorage();
const modal = useConfirmModal();

// localStorage is only available on client
onMounted(() => refresh());

function confirmDelete(id: string, name: string) {
  modal.openConfirm({
    title: "Delete Form",
    description: `"${name}" will be permanently removed from your saved forms.`,
    icon: "i-heroicons-trash",
    confirmLabel: "Delete",
    onConfirm: () => { deleteForm(id); refresh(); },
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-16">
    <UContainer>
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-10">
          <div class="flex items-center gap-2 mb-2">
            <AppBackButton fallback="/" label="Home" />
          </div>
          <div class="flex items-center gap-3 mb-1">
            <UBadge color="primary" variant="soft">Dynamic</UBadge>
            <span class="text-xs text-gray-400">API-driven forms</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Form Templates</h1>
          <!-- <p class="text-gray-500 mt-1 text-sm">
            Forms loaded from server JSON configs — no code needed to add new forms.
          </p> -->
        </div>

        <!-- API forms -->
        <div v-if="pending" class="space-y-4">
          <USkeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-xl" />
        </div>

        <div v-else class="space-y-4">
          <UCard
            v-for="form in forms"
            :key="form.id"
            class="hover:shadow-md transition-shadow cursor-pointer"
          >
            <NuxtLink :to="`/dynamic/${form.id}`" class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-document-text" class="size-5 text-primary-600" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900">{{ form.title }}</p>
                  <p v-if="form.description" class="text-sm text-gray-500 mt-0.5">{{ form.description }}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <UBadge variant="subtle" color="neutral" size="sm">
                      {{ form.pageCount }} {{ form.pageCount === 1 ? "page" : "pages" }}
                    </UBadge>
                    <UBadge variant="subtle" color="primary" size="sm">Server</UBadge>
                  </div>
                </div>
              </div>
              <UIcon name="i-heroicons-arrow-right" class="size-5 text-gray-400 shrink-0" />
            </NuxtLink>
          </UCard>
        </div>

        <!-- My Saved Forms (localStorage) -->
        <template v-if="savedForms.length > 0">
          <div class="mt-10 mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">My Saved Forms</h2>
              <p class="text-sm text-gray-500">Created in the visual builder</p>
            </div>
            <UButton to="/builder" size="sm" variant="outline" leading-icon="i-heroicons-pencil-square">
              Open Builder
            </UButton>
          </div>

          <div class="space-y-4">
            <UCard
              v-for="form in savedForms"
              :key="form.id"
              class="hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <NuxtLink :to="`/dynamic/${form.id}`" class="flex items-center gap-4 flex-1 min-w-0">
                  <div class="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center shrink-0">
                    <UIcon name="i-heroicons-cursor-arrow-rays" class="size-5 text-warning-600" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-gray-900 truncate">{{ form.name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      Saved {{ new Date(form.updatedAt).toLocaleDateString() }}
                    </p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <UBadge variant="subtle" color="warning" size="sm">Local</UBadge>
                      <UBadge variant="subtle" color="neutral" size="sm">
                        {{ form.config.pages[0]?.fields?.length ?? 0 }} fields
                      </UBadge>
                    </div>
                  </div>
                </NuxtLink>

                <div class="flex items-center gap-2 shrink-0 ml-4">
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons-pencil-square"
                    :to="`/builder?load=${form.id}`"
                  />
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="error"
                    icon="i-heroicons-trash"
                    @click.prevent="confirmDelete(form.id, form.name)"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <!-- Builder CTA -->
        <UCard class="mt-8 border-dashed">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-plus-circle" class="size-6 text-primary-500" />
              <div>
                <p class="font-semibold text-gray-900">Create your own form</p>
                <p class="text-sm text-gray-500">Use the visual builder to drag-and-drop fields</p>
              </div>
            </div>
            <UButton to="/builder" variant="outline" trailing-icon="i-heroicons-arrow-right">
              Open Builder
            </UButton>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>