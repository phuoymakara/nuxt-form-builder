<script setup lang="ts">
definePageMeta({
  title: "ESB Form Builder",
});

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
    title: "DEMO: Wizard Form",
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
    title: "Form Builder",
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
  <div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-16">
    <UContainer>
      <div class="max-w-5xl mx-auto">
        <!-- Hero -->
        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 shadow-xs mb-6">
            <UIcon name="i-heroicons-sparkles" class="size-4 text-primary-500" />
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
                  :class="
                    card.highlight
                      ? 'bg-primary-50'
                      : 'bg-gray-100'
                  "
                >
                  <UIcon
                    :name="card.icon"
                    class="size-5"
                    :class="card.highlight ? 'text-primary-600' : 'text-gray-500'"
                  />
                </div>
                <UBadge
                  :color="card.badge as any"
                  variant="soft"
                  size="sm"
                >
                  {{ card.label }}
                </UBadge>
              </div>

              <!-- Content -->
              <h2 class="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors">
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
              <div class="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
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
  </div>
</template>
