<script setup lang="ts">
import { useConfirmModal } from "~/composables/useConfirmModal";

const { open, options, loading, confirm, cancel } = useConfirmModal();
</script>

<template>
  <UModal :open="open" @update:open="(v) => !v && cancel()">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div
              v-if="options?.icon"
              class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              :class="options?.confirmColor === 'error' || !options?.confirmColor
                ? 'bg-red-100'
                : options?.confirmColor === 'warning'
                  ? 'bg-amber-100'
                  : 'bg-primary-100'"
            >
              <UIcon
                :name="options.icon"
                class="size-5"
                :class="options?.confirmColor === 'error' || !options?.confirmColor
                  ? 'text-red-600'
                  : options?.confirmColor === 'warning'
                    ? 'text-amber-600'
                    : 'text-primary-600'"
              />
            </div>
            <h3 class="font-semibold text-gray-900 text-base">{{ options?.title }}</h3>
          </div>
        </template>

        <p v-if="options?.description" class="text-sm text-gray-500">
          {{ options.description }}
        </p>

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <UButton
              variant="outline"
              color="neutral"
              :disabled="loading"
              @click="cancel"
            >
              {{ options?.cancelLabel ?? "Cancel" }}
            </UButton>
            <UButton
              :color="options?.confirmColor ?? 'error'"
              :loading="loading"
              @click="confirm"
            >
              {{ options?.confirmLabel ?? "Confirm" }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>