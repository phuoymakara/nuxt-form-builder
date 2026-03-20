<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Route to push when there is no browser history to go back to */
    fallback?: string;
    label?: string;
  }>(),
  {
    fallback: "/",
    label: "Back",
  },
);

const router = useRouter();

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
  } else {
    router.push(props.fallback);
  }
}
</script>

<template>
  <UButton
    variant="ghost"
    size="sm"
    leading-icon="i-heroicons-arrow-left"
    color="neutral"
    @click="goBack"
  >
    {{ label }}
  </UButton>
</template>
