<script setup lang="ts">
import { z } from "zod";
import FormBuilder from "~/components/v2/FormBuilder";
const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

const ContactForm = new FormBuilder()
  .addRow([
    {
      component: "UInput",
      name: "firstName",
      label: "First Name",
      placeholder: "John",
      type: "text",
      required: true,
      validation: z.string().min(2, "First name must be at least 2 characters"),
    },
    {
      component: "UInput",
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Doe",
      required: true,
      validation: z.string().min(2, "Last name must be at least 2 characters"),
    },
  ])
  .addField({
    component: "UInput",
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "john@example.com",
    required: true,
    validation: z.string().regex(emailRegex, "Please enter a valid email"),
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
        { label: "Sales", value: "sales" },
      ],
    },
    validation: z.string().min(1, "Please select a subject"),
  })
  .addField({
    component: "UTextarea",
    name: "message",
    label: "Message",
    placeholder: "Your message here...",
    required: true,
    type: "textarea",
    props: {
      rows: 4,
    },
    validation: z.string().min(10, "Message must be at least 10 characters"),
  })
  .build();

const toast = useToast();

async function handleSubmit(data: any) {
  console.table("Form submitted:", data);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  toast.add({
    title: "Success!",
    description: "Your message has been sent.",
  });
}
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-16">
      <div class="mx-auto max-w-2xl">
        <h1 class="mb-2 text-4xl font-bold">Form Builder</h1>
        <p class="mb-12 text-gray-400">
          Type-safe forms with Zod validation and Nuxt UI
        </p>

        <ContactForm @submit="handleSubmit">
          <template #actions="{ state }">
            <div class="flex justify-end gap-4">
              <UButton type="button" @click="console.log(state)">
                Log State
              </UButton>
              <UButton type="submit"> Submit </UButton>
            </div>
          </template>
        </ContactForm>
      </div>
    </UContainer>
  </div>
</template>
