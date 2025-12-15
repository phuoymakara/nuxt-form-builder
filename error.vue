<script setup lang="ts">
const pageTitle = "Website is cooking by our team";
const maintenanceMessage =
  "We're cooking up something delicious! Our website is currently undergoing scheduled maintenance to bring you a better experience. We'll be back online soon.";
const expectedBackTime =
  "Expected return: Monday, January 5th, 2026 at 9:00 AM ICT";

useHead({
  title: pageTitle,
  meta: [
    { name: "description", content: maintenanceMessage },
    {
      name: "robots",
      content:
        "noindex, nofollow, unavailable_after: 2025-12-16T09:00:00+07:00",
    },
  ],
});
useSeoMeta({
  // Open Graph Tags
  ogTitle: pageTitle,
  ogDescription: maintenanceMessage,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: pageTitle,
  twitterDescription: maintenanceMessage,
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div
      class="fixed inset-0 bg-gray-900 opacity-90 backdrop-blur-sm"
      aria-hidden="true"
    ></div>

    <div
      class="relative z-10 w-full max-w-2xl bg-gray-800/80 p-8 md:p-12 rounded-xl shadow-2xl border border-gray-700/50 text-center text-white backdrop-filter backdrop-blur-lg"
    >
      <!-- Floating Center Button -->
      <div class="absolute left-1/2 -top-20 transform -translate-x-1/2">
        <ULink
          to="/wizard-form"
          class="text-white hover:text-white cursor-pointer"
        >
          <UButton
            class="cursor-pointer px-6 py-3 bg-amber-500 text-white font-semibold rounded-full shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-400/40 transition-all duration-300"
          >
            Playground
          </UButton>
        </ULink>
      </div>

      <div class="mb-6">
        <span
          class="text-6xl mb-4 block animate-bounce"
          role="img"
          aria-label="Cooking Pot"
        >
          🍲
        </span>
      </div>

      <h1 class="text-4xl font-extrabold mb-4 text-amber-400">
        {{ pageTitle }}
      </h1>

      <p class="text-xl text-gray-300 mb-8 leading-relaxed">
        {{ maintenanceMessage }}
      </p>

      <div class="mb-8 w-full">
        <div class="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-amber-500 rounded-full"
            style="width: 100%"
            :class="['animate-pulse']"
          ></div>
        </div>
        <p class="mt-2 text-sm text-amber-400 font-medium">
          Loading resources...
        </p>
      </div>
      <div
        class="inline-block bg-gray-700/60 text-gray-200 py-2 px-6 rounded-full text-sm font-medium border border-gray-600"
      >
        {{ expectedBackTime }}
      </div>

      <footer class="mt-10 pt-6 border-t border-gray-700/50">
        <p class="text-sm text-slate-50">Thank you for your patience.</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles remain the same for backdrop effects */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
.backdrop-blur-lg {
  backdrop-filter: blur(10px);
}
</style>
