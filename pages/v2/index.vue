<script setup lang="ts">
import { ref } from "vue";
import { z } from "zod";
import FormBuilder from "~/components/v2/FormBuilder";

// Form: Contact form with conditional field

const ContactForm = new FormBuilder()
  .addRow([
    {
      component: "UInput",
      name: "firstName",
      label: "First Name",
      placeholder: "John",
      type: "text",
      required: true,
      validation: z.string().min(2, "At least 2 characters"),
    },
    {
      component: "UInput",
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Doe",
      required: true,
      validation: z.string().min(2, "At least 2 characters"),
    },
  ])
  .addField({
    component: "UInput",
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "john@example.com",
    required: true,
    validation: z.string().email("Enter a valid email"),
  })
  .addField({
    component: "USelect",
    name: "subject",
    label: "Subject",
    placeholder: "Select subject",
    required: true,
    type: "text",
    props: {
      items: [
        { label: "General Inquiry", value: "general" },
        { label: "Support", value: "support" },
        { label: "Partnership", value: "partnership" },
        { label: "Other", value: "other" },
      ],
    },
    validation: z.string().min(1, "Please select a subject"),
  })
  // Conditional field — only visible when "other" is selected
  .addField({
    component: "UInput",
    name: "subjectOther",
    label: "Describe Your Subject",
    placeholder: "Briefly describe your topic…",
    type: "text",
    hidden: (v) => v.subject !== "other",
    dependsOn: ["subject"],
    clearOnChange: true,
    validation: z.string().min(3, "At least 3 characters").optional(),
  })
  .addField({
    component: "URadioGroup",
    name: "contactMethod",
    label: "Preferred Contact Method",
    type: "radio",
    required: true,
    props: {
      orientation: "horizontal",
      items: [
        { label: "Email", value: "email" },
        { label: "Phone", value: "phone" },
        { label: "WhatsApp", value: "whatsapp" },
      ],
    },
    validation: z.string().min(1, "Pick a contact method"),
  })
  // Conditional field — shown when phone or whatsapp chosen
  .addField({
    component: "UInput",
    name: "phoneNumber",
    label: "Phone / WhatsApp Number",
    placeholder: "+855 xx xxx xxx",
    type: "tel",
    hidden: (v) => !["phone", "whatsapp"].includes(v.contactMethod),
    dependsOn: ["contactMethod"],
    clearOnChange: true,
    validation: z
      .string()
      .min(8, "Enter a valid number")
      .optional()
      .or(z.literal("")),
  })
  .addField({
    component: "UTextarea",
    name: "message",
    label: "Message",
    placeholder: "Your message here…",
    required: true,
    type: "textarea",
    props: { rows: 4 },
    validation: z.string().min(10, "At least 10 characters"),
  })
  .build();

// Page state

const toast = useToast();
const lastSubmit = ref<Record<string, any> | null>(null);

async function handleSubmit(data: any) {
  lastSubmit.value = data;
  await new Promise((r) => setTimeout(r, 600));
  toast.add({
    title: "Message sent!",
    description: "We'll get back to you shortly.",
    color: "success",
    icon: "i-heroicons-check-circle",
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-16">
    <UContainer>
      <div class="mx-auto max-w-2xl">
        <!-- Header -->
        <div class="mb-10">
          <div class="mb-3">
            <AppBackButton fallback="/" label="Home" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge color="primary" variant="soft">V2</UBadge>
                <span class="text-xs text-gray-400">FormBuilder API</span>
              </div>
              <h1 class="text-3xl font-bold text-gray-900">Dynamic Form</h1>
              <p class="text-gray-500 mt-1 text-sm">
                Type-safe · Conditional fields · Zod validation · Nuxt UI
              </p>
            </div>
            <UButton
              to="/v2/wizard"
              variant="outline"
              trailing-icon="i-heroicons-arrow-right"
            >
              Try Wizard Form
            </UButton>
          </div>
        </div>

        <!-- Form card -->
        <UCard>
          <ContactForm @submit="handleSubmit">
            <template #actions="{ state }">
              <div class="flex items-center justify-between gap-4 pt-2">
                <UButton
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click="console.log('State:', state)"
                >
                  Log State
                </UButton>
                <UButton type="submit" icon="i-heroicons-paper-airplane">
                  Send Message
                </UButton>
              </div>
            </template>
          </ContactForm>
        </UCard>

        <!-- Last submitted payload -->
        <UCard v-if="lastSubmit" class="mt-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-document-check"
                class="size-5 text-green-500"
              />
              <h3 class="font-semibold">Submitted Payload</h3>
            </div>
          </template>
          <pre class="text-xs bg-gray-50 rounded p-3 overflow-auto">{{
            JSON.stringify(lastSubmit, null, 2)
          }}</pre>
        </UCard>

        <!-- Feature callouts -->
        <div class="mt-8 grid grid-cols-2 gap-4">
          <UCard
            v-for="feature in [
              {
                icon: 'i-heroicons-eye-slash',
                title: 'Conditional Fields',
                desc: 'Subject Other & Phone Number appear dynamically',
              },
              {
                icon: 'i-heroicons-shield-check',
                title: 'Zod Validation',
                desc: 'Per-field schemas with type-safe error messages',
              },
              {
                icon: 'i-heroicons-squares-2x2',
                title: 'Grid Layout',
                desc: '12-column grid via colSpan — mobile-first',
              },
              {
                icon: 'i-heroicons-arrow-path',
                title: 'Dependency Clearing',
                desc: 'Child fields auto-clear when a parent changes',
              },
            ]"
            :key="feature.title"
          >
            <div class="flex items-start gap-3">
              <UIcon :name="feature.icon" class="size-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p class="text-sm font-semibold text-gray-900">
                  {{ feature.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{{ feature.desc }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>
