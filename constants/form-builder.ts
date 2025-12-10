// types/form-builder.ts
import type { ZodTypeAny } from "zod";

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: FieldWithConditions[];
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  // Support both flat fields (legacy) and sections
  fields?: FieldWithConditions[];
  sections?: FormSection[];
  validation?: ZodTypeAny;
}

export interface FormConfig {
  pages: FormPage[];
  submitButtonText?: string;
  previousButtonText?: string;
  nextButtonText?: string;
}

export type ObjectGeneric = Record<string, any>;

// ============================================================================
// Example Usage: forms/job-application-form.ts
// ============================================================================

import { z } from "zod";
import type { FieldWithConditions } from "~/types/form-builder";

export const jobApplicationFormConfig: FormConfig = {
  pages: [
    {
      id: "personal-employment",
      title: "Personal & Employment Info",
      description: "Complete your personal and employment details",
      // Using sections for multiple cards in one page
      sections: [
        {
          id: "personal-info",
          title: "ព័ត៌មាននៃមនុស្ស",
          description: "បញ្ចូលព័ត៌មានលម្អិតលម្អិត",
          icon: "i-heroicons-user",
          fields: [
            {
              name: "first_name_khmer",
              label: "ឈ្មោះខ្មែរ",
              component: "UInput",
              type: "text",
              row: 1,
              colSpan: 6,
              validation: z.string().min(1, "Required"),
              props: { placeholder: "ឈ្មោះ" }
            },
            {
              name: "first_name_english",
              label: "ឈ្មោះឡាតាំង(Latin Name)",
              component: "UInput",
              type: "text",
              row: 1,
              colSpan: 6,
              validation: z.string().min(1, "Required"),
              props: { placeholder: "First Name" }
            },
             {
              name: "avatar",
              label: "រូបភាព",
              component: "UFileUpload",
              type: "file",
              row: 1,
              colSpan: 6,
              validation: z
                .instanceof(File, { message: "Required" }),
              props: {
                accept: "image/*"
              }
            },
            {
              name: "date_of_birth",
              label: "ថ្ងៃខែឆ្នាំកំណើត",
              component: "UCalendar",
              type: "date",
              row: 2,
              colSpan: 6,
              validation: z.string().min(1, "Required"),
              props: {}
            },
            {
              name: "gender",
              label: "ភេទ",
              component: "URadioGroup",
              row: 2,
              colSpan: 6,
              type: "radio",
              validation: z.string().min(1, "Required"),
              props: {
                items: [
                  { label: "ប្រុស", value: "M" },
                  { label: "ស្រី", value: "F" }
                ]
              }
            },
            {
              name: "email",
              label: "Email",
              component: "UInput",
              type: "email",
              row: 3,
              colSpan: 6,
              validation: z.string().email("Invalid email"),
              props: { placeholder: "user@example.com" }
            },
            {
              name: "phone",
              label: "លេខទូរស័ព្ទ",
              component: "UInput",
              type: "tel",
              row: 3,
              colSpan: 6,
              validation: z.string().min(8, "Invalid phone"),
              props: { placeholder: "+855..." }
            }
          ]
        },
        {
          id: "employment-info",
          title: "ព័ត៌មានលម្អិតលម្អិត",
          description: "បញ្ចូលព័ត៌មានលម្អិតលម្អិត",
          icon: "i-heroicons-briefcase",
          fields: [
            {
              name: "employment_type",
              label: "ប្រភេទការងារ",
              component: "USelect",
              type: "text",
              row: 1,
              colSpan: 12,
              validation: z.string().min(1, "Required"),
              props: {
                options: [
                  { label: "ការងារឯកសណ្ឋាន", value: "employed" },
                  { label: "ការងារឯកជន", value: "self-employed" },
                  { label: "អត់ការងារ", value: "unemployed" }
                ]
              }
            },
            {
              name: "company_name",
              label: "ឈ្មោះក្រុមហ៊ុន",
              component: "UInput",
              type: "text",
              row: 2,
              colSpan: 6,
              hidden: (values) => values.employment_type !== "employed",
              dependsOn: ["employment_type"],
              clearOnChange: true,
              validation: z.string().min(1,'ទាមឈ្មោះក្រុមហ៊ុន'),
              props: { placeholder: "ឈ្មោះក្រុមហ៊ុន" }
            },
            {
              name: "position",
              label: "ឋានៈ",
              component: "UInput",
              type: "text",
              row: 2,
              colSpan: 6,
              hidden: (values) => values.employment_type !== "employed",
              dependsOn: ["employment_type"],
              clearOnChange: true,
              validation: z.string().optional(),
              props: { placeholder: "ឋានៈ" }
            },
            {
              name: "business_name",
              label: "ឈ្មោះអាជីវកម្ម",
              component: "UInput",
              type: "text",
              row: 2,
              colSpan: 6,
              hidden: (values) => values.employment_type !== "self-employed",
              dependsOn: ["employment_type"],
              clearOnChange: true,
              validation: z.string().optional(),
              props: { placeholder: "ឈ្មោះអាជីវកម្ម" }
            },
            {
              name: "business_type",
              label: "ប្រភេទអាជីវកម្ម",
              component: "USelect",
              type: "text",
              row: 2,
              colSpan: 6,
              hidden: (values) => values.employment_type !== "self-employed",
              dependsOn: ["employment_type"],
              clearOnChange: true,
              validation: z.string().optional(),
              props: {
                options: [
                  { label: "លក់ដូរ", value: "retail" },
                  { label: "សេវាកម្ម", value: "services" },
                  { label: "ផលិតកម្ម", value: "manufacturing" }
                ]
              }
            },
            {
              name: "salary",
              label: "ប្រាក់ខែ",
              component: "UInput",
              type: "number",
              row: 3,
              colSpan: 6,
              hidden: (values) => values.employment_type === "unemployed",
              dependsOn: ["employment_type"],
              clearOnChange: false,
              validation: z.coerce.number().optional(),
              props: { placeholder: "ប្រាក់ខែ" }
            },
            {
              name: "work_experience",
              label: "បទពិសោធន៍ការងារ",
              component: "UTextarea",
              type: "text",
              row: 3,
              colSpan: 6,
              validation: z.string().optional(),
              props: { placeholder: "បទពិសោធន៍ការងារ" }
            }
          ]
        }
      ]
    },
    {
      id: "additional-info",
      title: "ព័ត៌មានបន្ថែម",
      description: "ព័ត៌មានបន្ថែម",
      // Using flat fields for single section pages
      fields: [
        {
          name: "skills",
          label: "ជំនាញ",
          component: "UCheckboxGroup",
          row: 1,
          colSpan: 12,
          type: "radio",
          validation: z.array(z.string()).min(1, "Select at least one"),
          props: {
            items: [
              { label: "JavaScript", value: "javascript" },
              { label: "Vue.js", value: "vue" },
              { label: "TypeScript", value: "typescript" },
              { label: "Tailwind CSS", value: "tailwind" },
              { label: "Node.js", value: "nodejs" }
            ]
          }
        },
        {
          name: "portfolio_url",
          label: "Website ឬ Portfolio",
          component: "UInput",
          type: "url",
          row: 2,
          colSpan: 6,
          validation: z.string().url().optional(),
          props: { placeholder: "https://..." }
        },
        {
          name: "resume",
          label: "Resume (PDF)",
          component: "UFileInput",
          type: "file",
          row: 2,
          colSpan: 6,
          validation: z.any().optional(),
          props: {
            accept: "application/pdf",
            placeholder: "Upload PDF"
          }
        },
        {
          name: "cover_letter",
          label: "Motivation Letter",
          component: "UTextarea",
          type: "text",
          row: 3,
          colSpan: 12,
          validation: z.string().optional(),
          props: { placeholder: "Tell us about yourself..." }
        }
      ]
    }
  ],
  submitButtonText: "ដាក់ស្នើបង",
  previousButtonText: "ថយក្រោយ",
  nextButtonText: "បន្ទាប់"
};