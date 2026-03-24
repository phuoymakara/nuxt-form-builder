<script setup lang="ts">
import pg from "~/package.json";
definePageMeta({
  title: "ESB Form Builder",
});

import { useThemePicker, primaryColors, neutralColors, colorMap } from "~/composables/useThemePicker";
const { appConfig, showThemePicker, setPrimary, setNeutral } = useThemePicker();
const cards = [
  // {
  //   label: "V1",
  //   badge: "neutral",
  //   icon: "i-heroicons-document-text",
  //   title: "Basic Form",
  //   description:
  //     "Original multi-section form with UCalendar, UCheckboxGroup, and manual validation.",
  //   to: "/basic-form",
  //   action: "Open",
  //   features: ["UCalendar", "UCheckboxGroup", "Manual Zod validation"],
  // },
  // {
  //   label: "V1",
  //   badge: "neutral",
  //   icon: "i-heroicons-clipboard-document-list",
  //   title: "V1 Wizard Form",
  //   description:
  //     "Multi-step wizard with address cascade, file upload, and per-section validation.",
  //   to: "/wizard-form",
  //   action: "Open",
  //   features: ["Multi-step", "Cascade address", "File upload"],
  // },
  // {
  //   label: "V2",
  //   badge: "primary",
  //   icon: "i-heroicons-bolt",
  //   title: "V2 Dynamic Form",
  //   description:
  //     "FormBuilder API — fluent, type-safe field definitions with conditional logic and grid layout.",
  //   to: "/v2",
  //   action: "Open",
  //   features: ["Conditional fields", "12-col grid", "Zod validation"],
  //   highlight: true,
  // },
  {
    label: "V2",
    badge: "primary",
    icon: "i-heroicons-squares-2x2",
    title: "DEMO Form",
    description:
      "Multi-page wizard using the V2 FormBuilder and composable-driven state management.",
    to: "/v2/wizard",
    action: "Open",
    features: ["Multi-page wizard", "Cascading selects", "useFormState"],
    highlight: true,
  },
  {
    label: "API",
    badge: "success",
    icon: "i-heroicons-server",
    title: "My  Dynamic Forms",
    description:
      "Forms loaded from server JSON configs. No code changes needed — add new forms via API.",
    to: "/dynamic",
    action: "Browse",
    features: ["JSON config", "interpretConfig()", "Server API"],
    highlight: true,
  },
  {
    label: "Builder",
    badge: "warning",
    icon: "i-heroicons-cursor-arrow-rays",
    title: "Form Builder Playground",
    description:
      "Drag-and-drop visual builder to create forms and save them to localStorage or export JSON.",
    to: "/builder",
    action: "Build",
    features: ["Drag & drop", "Live preview", "Export JSON"],
    highlight: true,
  },
];
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-10">
    <UContainer>
      <div class="max-w-5xl mx-auto">
        <!-- Hero -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-2">
            <UBadge color="primary" variant="subtle" size="xl" class="gap-1">
              <UIcon name="i-heroicons-tag" class="size-3" />
              v{{ pg.version }}
            </UBadge>
          </div>
          <div
            class="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 shadow-xs mb-3"
          >
            <UIcon
              name="i-heroicons-sparkles"
              class="size-4 text-primary-500"
            />
            Nuxt 3 · Nuxt UI v3 · Zod v4 · Vue 3.5
          </div>
          <h1 class="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            ESB Form Builder
          </h1>
          <p class="text-lg text-gray-500 max-w-xl mx-auto">
            A progressive dynamic form system — from simple field arrays to
            API-driven configs, visual builder, and multi-step wizards.
          </p>
        </div>

        <!-- Feature cards grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <NuxtLink
            v-for="card in cards"
            :key="card.to"
            :to="card.to"
            class="group block"
          >
            <UCard
              class="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              :class="card.highlight ? 'ring-1 ring-primary-200' : ''"
            >
              <!-- Icon + badge row -->
              <div class="flex items-start justify-between mb-4">
                <div
                  class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  :class="card.highlight ? 'bg-primary-50' : 'bg-gray-100'"
                >
                  <UIcon
                    :name="card.icon"
                    class="size-5"
                    :class="
                      card.highlight ? 'text-primary-600' : 'text-gray-500'
                    "
                  />
                </div>
                <UBadge :color="card.badge as any" variant="soft" size="sm">
                  {{ card.label }}
                </UBadge>
              </div>

              <!-- Content -->
              <h2
                class="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors"
              >
                {{ card.title }}
              </h2>
              <p class="text-sm text-gray-500 mb-4 leading-relaxed">
                {{ card.description }}
              </p>

              <!-- Features -->
              <ul class="space-y-1 mb-5">
                <li
                  v-for="f in card.features"
                  :key="f"
                  class="flex items-center gap-1.5 text-xs text-gray-400"
                >
                  <UIcon
                    name="i-heroicons-check"
                    class="size-3.5 text-primary-400 shrink-0"
                  />
                  {{ f }}
                </li>
              </ul>

              <!-- CTA -->
              <div
                class="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all"
              >
                {{ card.action }}
                <UIcon name="i-heroicons-arrow-right" class="size-4" />
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Footer note -->
        <p class="text-center text-xs text-gray-400 mt-12">
          Built with Nuxt 3 · Nuxt UI v3 · TypeScript · Zod
        </p>
      </div>
    </UContainer>

    <!-- Floating theme picker -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <!-- Color grid popup -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-if="showThemePicker"
          class="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-56"
        >
          <!-- Primary -->
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">Primary</p>
          <div class="grid grid-cols-6 gap-1.5 mb-1">
            <button
              v-for="color in primaryColors"
              :key="color"
              class="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none relative"
              :style="{ backgroundColor: colorMap[color] }"
              :title="color"
              @click="setPrimary(color)"
            >
              <span
                v-if="appConfig.ui.colors.primary === color"
                class="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-current"
                :style="{ color: colorMap[color] }"
              />
            </button>
          </div>
          <div class="flex items-center gap-1.5 px-0.5 mb-3">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: colorMap[appConfig.ui.colors.primary] }" />
            <span class="text-xs text-gray-400 capitalize">{{ appConfig.ui.colors.primary }}</span>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-100 mb-3" />

          <!-- Neutral -->
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">Neutral</p>
          <div class="flex gap-1.5 mb-1">
            <button
              v-for="color in neutralColors"
              :key="color"
              class="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none relative"
              :style="{ backgroundColor: colorMap[color] }"
              :title="color"
              @click="setNeutral(color)"
            >
              <span
                v-if="appConfig.ui.colors.neutral === color"
                class="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-current"
                :style="{ color: colorMap[color] }"
              />
            </button>
          </div>
          <div class="flex items-center gap-1.5 px-0.5">
            <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: colorMap[appConfig.ui.colors.neutral] }" />
            <span class="text-xs text-gray-400 capitalize">{{ appConfig.ui.colors.neutral }}</span>
          </div>
        </div>
      </Transition>

      <!-- Toggle button -->
      <button
        class="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
        :style="{ backgroundColor: colorMap[appConfig.ui.colors.primary] }"
        @click="showThemePicker = !showThemePicker"
      >
        <UIcon name="i-heroicons-swatch" class="size-5 text-white" />
      </button>
    </div>
  </div>
</template>
