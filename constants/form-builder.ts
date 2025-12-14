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

export const addressFieldsConfig = [
  {
    name: "province",
    label: "ខេត្ត/ក្រុង",
    component: "UAddress",
    type: "select",
    row: 4,
    colSpan: 6,
    clearOnChange: true,
    validation: z.any().superRefine((val, ctx) => {
      if (!val || typeof val !== "object") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "សូមជ្រើសរើសខេត្ត",
        });
      }
    }),
    // .min(1, "សូមជ្រើសរើសខេត្ត"),
    props: {
      placeholder: "ជ្រើសរើសខេត្ត...",
      apiEndpoint: "/api/address/provinces",
      searchable: true,
      clearable: true,
      labelKey: "name_kh",
      valueKey: "code",
    },
  },
  {
    name: "district",
    label: "ស្រុក/ក្រុង",
    component: "UAddress",
    type: "select",
    row: 4,
    colSpan: 6,
    validation: z.any().superRefine((val, ctx) => {
      if (!val || typeof val !== "object") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "សូមជ្រើសរើសស្រុក",
        });
      }
    }),
    dependsOn: ["province"],
    // hidden: (values) => !values.province,
    clearOnChange: true,
    props: {
      placeholder: "ជ្រើសរើសស្រុក...",
      apiEndpoint: "/api/address/districts",
      searchable: true,
      clearable: false,
      labelKey: "name_kh",
      valueKey: "code",
      queryParams: (values: any) => {
        // Extract code from province value (it's already a code string)
        return values.province ? { province_code: values.province?.code } : {};
      },
    },
  },
  {
    name: "commune",
    label: "ឃុំ/សង្កាត់",
    component: "UAddress",
    type: "select",
    row: 5,
    colSpan: 6,
    validation: z.any().superRefine((val, ctx) => {
      if (!val || typeof val !== "object") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ជ្រើសរើសឃុំ/សង្កាត់",
        });
      }
    }),
    dependsOn: ["district", "province"],
    // hidden: (values:any) => !values.district,
    clearOnChange: true,
    props: {
      placeholder: "ជ្រើសរើសឃុំ...",
      apiEndpoint: "/api/address/communes",
      searchable: true,
      clearable: true,
      labelKey: "name_kh",
      valueKey: "code",
      queryParams: (values: any) => {
        return values.district ? { district_code: values.district?.code } : {};
      },
    },
  },
  {
    name: "village",
    label: "ភូមិ",
    component: "UAddress",
    type: "select",
    row: 5,
    colSpan: 6,
    validation: z.any().superRefine((val, ctx) => {
      if (!val || typeof val !== "object") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ជ្រើសរើសភូមិ",
        });
      }
    }),
    dependsOn: ["commune", "district", "province"],
    // hidden: (values:any) => !values.commune,
    clearOnChange: true,
    props: {
      placeholder: "ជ្រើសរើសភូមិ...",
      apiEndpoint: "/api/address/villages",
      searchable: true,
      clearable: true,
      labelKey: "name_kh",
      valueKey: "code",
      queryParams: (values: any) => {
        return values.commune ? { commune_code: values.commune?.code } : {};
      },
    },
  },
  {
    name: "streetAddress",
    label: "ផ្ទះលេខ/ផ្លូវ",
    component: "UInput",
    type: "text",
    row: 6,
    colSpan: 12,
    validation: z.string().min(3, "សូមបញ្ចូលលម្អិត").optional(),
    props: {
      placeholder: "បញ្ចូលលម្អិត ឧ: ផ្ទះលេខ ៥៣, ផ្លូវលេខ ៩៣...",
    },
  },
];
export const jobApplicationFormConfig: FormConfig = {
  pages: [
    {
      id: "personal-employment",
      title: "ព័ត៌មាននៃមនុស្ស",
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
              name: "registration_choice",
              label: "ប្រភេទការចុះឈ្មោះ",
              component: "URadioGroup",
              type: "radio",
              validation: z.string().min(1, "សូមជ្រើសរើសប្រភេទ"),
              props: {
                orientation: "horizontal",
                items: [
                  { label: "ក្នុងតម្រូវការ", value: "existing" },
                  { label: "ចុះបញ្ជីថ្មី", value: "new" },
                ],
              },
            },
            {
              name: "search_info",
              label: "ស្វែងរក ឬ ជ្រើសរើស",
              component: "UAsyncSelect", // Custom async component
              type: "text",
              row: 1,
              colSpan: 6,
              hidden: (values) => values.registration_choice !== "new",
              dependsOn: ["registration_choice"],
              validation: z
                .object({ label: z.string(), value: z.string() })
                .or(z.string())
                .transform((val) => {
                  if (
                    typeof val === "object" &&
                    val !== null &&
                    "value" in val
                  ) {
                    return val.value;
                  }
                  return String(val);
                })
                .pipe(z.string().min(1, "សូមជ្រើសរើស")),
              props: {
                placeholder: "ស្វែងរក...",
                searchable: true,
                clearable: true,
                async: true,
                apiEndpoint: "/api/licenses/search",
                searchParam: "q",
                transformResponse: (data: any[]) => {
                  return data.map((item) => ({
                    label: item.name, // or item.license_name, etc
                    value: item.code, // or item.code, etc
                  }));
                },
                debounce: 300,
                minChars: 2,
                loadingText: "កំពុងស្វែងរក...",
                noResultsText: "គ្មានលទ្ធផល",
              },
            },
            {
              name: "avatar",
              label: "រូបភាព(៤x៦)",
              component: "UFileUpload",
              type: "file",

              validation: z.instanceof(File, { message: "សូមបញ្ចូល" }),
              props: {
                accept: "image/*",
              },
            },
            {
              name: "first_name_khmer",
              label: "ឈ្មោះខ្មែរ",
              component: "UInput",
              type: "text",
              row: 1,
              colSpan: 6,
              validation: z.string().min(1, "សូមបញ្ចូល"),
              props: { placeholder: "ឈ្មោះ" },
            },
            {
              name: "first_name_english",
              label: "ឈ្មោះឡាតាំង(Latin Name)",
              component: "UInput",
              type: "text",
              row: 1,
              colSpan: 6,
              validation: z.string().min(1, "សូមបញ្ចូល"),
              props: { placeholder: "First Name" },
            },
            {
              name: "gender",
              label: "ភេទ",
              component: "URadioGroup",
              row: 2,
              colSpan: 12,
              type: "radio",
              validation: z.string().min(1, "សូមបញ្ចូល"),
              props: {
                orientation: "horizontal",
                items: [
                  { label: "ប្រុស", value: "M" },
                  { label: "ស្រី", value: "F" },
                ],
              },
            },

            {
              name: "date_of_birth",
              label: "ថ្ងៃខែឆ្នាំកំណើត",
              component: "UCalendar",
              type: "date",
              row: 3,
              colSpan: 6,
              validation: z.string().min(1, "សូមបញ្ចូល"),
              props: {},
            },
            {
              name: "email",
              label: "Email",
              component: "UInput",
              type: "email",
              row: 3,
              colSpan: 6,
              validation: z.string().email("Invalid email"),
              props: { placeholder: "user@example.com" },
            },
            {
              name: "phone",
              label: "លេខទូរស័ព្ទ",
              component: "UInput",
              type: "tel",
              row: 3,
              colSpan: 6,
              validation: z.string().min(8, "Invalid phone"),
              props: { placeholder: "+855..." },
            },
            ...addressFieldsConfig,
          ],
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
              colSpan: 6,
              validation: z.string().min(1, "សូមបញ្ចូល"),
              props: {
                options: [
                  { label: "ការងាររដ្ឋ", value: "employed" },
                  { label: "ការងារឯកជន", value: "self-employed" },
                  { label: "អត់ការងារ", value: "unemployed" },
                ],
              },
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
              validation: z.string().min(1, "ទាមឈ្មោះក្រុមហ៊ុន"),
              props: { placeholder: "ឈ្មោះក្រុមហ៊ុន" },
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
              props: { placeholder: "ឋានៈ" },
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
              validation: z.string().min(1, "ទាមទារឈឈ្មោះអាជីវកម្ម"),
              props: { placeholder: "ឈ្មោះអាជីវកម្ម" },
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
              validation: z.string().min(1, "ទាមទារ"),
              props: {
                options: [
                  { label: "លក់ដូរ", value: "retail" },
                  { label: "សេវាកម្ម", value: "services" },
                  { label: "ផលិតកម្ម", value: "manufacturing" },
                ],
              },
            },
            {
              name: "salary",
              label: "ប្រាក់ខែ/ចំណូល",
              component: "UInput",
              type: "number",
              row: 3,
              colSpan: 6,
              hidden: (values) => values.employment_type === "unemployed",
              dependsOn: ["employment_type"],
              clearOnChange: false,
              validation: z.coerce.number().optional(),
              props: { placeholder: "ប្រាក់ខែ" },
            },
            {
              name: "work_experience",
              label: "បទពិសោធន៍ការងារ",
              component: "UTextarea",
              type: "text",
              row: 4,
              colSpan: 12,
              validation: z.string().optional(),
              props: { placeholder: "បទពិសោធន៍ការងារ" },
            },
          ],
        },
      ],
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
              { label: "Node.js", value: "nodejs" },
              { label: "ផ្សេងទៀត", value: "others" },
            ],
          },
        },
        {
          name: "skills_other",
          label: "បញ្ចូលជំនាញផ្សេងទៀត",
          component: "UInput",
          type: "text",
          row: 2,
          colSpan: 12,
          hidden: (values) => !values.skills?.includes("others"),
          dependsOn: ["skills"],
          clearOnChange: true,
          validation: z
            .string()
            .min(1, "សូមបញ្ចូល when 'Others' is selected")
            .optional(),
          props: { placeholder: "ឧ: React, Angular, etc." },
        },
        {
          name: "portfolio_url",
          label: "Website ឬ Portfolio",
          component: "UInput",
          type: "url",
          row: 2,
          colSpan: 6,
          validation: z.string().url().optional(),
          props: { placeholder: "https://..." },
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
            placeholder: "Upload PDF",
          },
        },
        {
          name: "cover_letter",
          label: "Motivation Letter",
          component: "UTextarea",
          type: "text",
          row: 3,
          colSpan: 12,
          validation: z.string().optional(),
          props: { placeholder: "Tell us about yourself..." },
        },
      ],
    },
    {
      id: "documents",
      title: "ឯកសារភ្ជាប់",
      description: "ឯកសារភ្ជាប់",
      fields: [
        {
          name: "D000001",
          label: "ប្រវត្តិរូបសង្ខេប ដោយមានបញ្ជាក់ទទួលស្គាល់ពីមេឃុំ/ចៅសង្កាត់",
          component: "UFileInput",
          type: "file",
          row: 2, // Starting row
          colSpan: 6,
          validation: z.instanceof(File, { message: "ទាមទារឯកសារ" }), // required: true
          props: {
            accept: "application/pdf",
            placeholder: "Upload PDF",
            sample_url: "documents/D000001.pdf",
          },
        },
        {
          name: "D000004",
          label:
            "កិច្ចសន្យាស្តីពីការបង្កើតកសិដ្ឋានចិញ្ចឹមសត្វ និង/ឬ បង្កាត់ពូជសត្វ",
          component: "UFileInput",
          type: "file",
          row: 3,
          colSpan: 6,
          validation: z.instanceof(File, { message: "ទាមទារឯកសារ" }), // required: true
          props: {
            accept: "application/pdf",
            placeholder: "Upload PDF",
            sample_url: "documents/D000004.pdf",
          },
        },
        {
          name: "D000005",
          label: "ផ្សេងទៀត",
          component: "UFileInput",
          type: "file",
          row: 4,
          colSpan: 6,
          validation: z.instanceof(File).optional(), // required: false
          props: {
            accept: "application/pdf",
            placeholder: "Upload PDF",
          },
        },
      ],
    },
  ],
  submitButtonText: "ដាក់ស្នើបង",
  previousButtonText: "ថយក្រោយ",
  nextButtonText: "បន្ទាប់",
};
