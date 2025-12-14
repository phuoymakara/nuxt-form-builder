<template>
  <div class="w-3/5 mx-auto grid grid-cols-1 gap-6 p-10">
    <h1>Multi-Section Form Builder</h1>

    <!-- Section 1: Basic Info -->
    <UCard>
      <h2>9. ព័ត៌មាននៃមនុស្ស</h2>
      <BuilderFormFactory
        ref="basicInfoFormRef"
        v-model="form.basicInfo"
        :fields="basicInfoFields"
        @submit="onBasicInfoSubmit"
        @error="onBasicInfoError"
        @validate="onValidate"
      />
    </UCard>

    <!-- Section 2: Job Info -->
    <UCard>
      <h2>២. ព័ត៌មានលម្អិតលម្អិត</h2>
      <BuilderComplexFormFactory
        ref="jobInfoFormRef"
        v-model="form.jobInfo"
        :fields="jobInfoFields"
        @submit="onJobInfoSubmit"
        @error="onJobInfoError"
        @validate="onValidate"
      />
    </UCard>

    <!-- Action UButtons -->
    <div class="mt-8 flex gap-4">
      <UButton class="btn btn-primary" @click="submitSection('basicInfo')">
        Submit Basic Info
      </UButton>
      <UButton class="btn btn-primary" @click="submitSection('jobInfo')">
        Submit Job Info
      </UButton>
      <UButton class="btn btn-success" @click="submitAllSections">
        Submit All Sections
      </UButton>
      <UButton class="btn btn-secondary" @click="validateAllSections">
        Validate All
      </UButton>
    </div>

    <!-- Form State Display -->
    <pre class="mt-6 p-4 bg-gray-100 rounded">{{
      JSON.stringify(form, null, 2)
    }}</pre>

    <!-- Validation Errors Display -->
    <div v-if="allErrors.length" class="mt-4 p-4 bg-red-100 rounded">
      <h3 class="font-bold mb-2">Errors:</h3>
      <ul>
        <li v-for="error in allErrors" :key="error" class="text-red-600">
          {{ error }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { z } from "zod";
import { CalendarDate } from "@internationalized/date";
import type { Field, FieldWithConditions } from "~/types/form-builder";

// ============ SCHEMAS ============
const basicInfoSchema = z.object({
  email: z.string().email("Invalid email"),
  age: z.coerce.number().min(18, "Must be at least 18"),
  gender: z.string().min(1, "Select gender"),
  birth_date: z.string().min(1, "Select date"),
});

enum BUSINESS_TYPE {
  COMPANY = "COMAPNY",
  NGO = "NGO",
  GOVERMENT = "GOVERMENT",
}
const jobInfoSchema = z.object({
  job_type: z.array(z.string()).min(1, "Select at least one job type"),
  company_name: z.string().min(1, "Company name required"),
  position: z.string().min(1, "Position required"),
  salary: z.coerce.number().optional(),
});

type BasicInfoType = z.infer<typeof basicInfoSchema>;
type JobInfoType = z.infer<typeof jobInfoSchema>;

// ============ FIELDS ============
const basicInfoFields: Field[] = [
  {
    name: "email",
    label: "Email",
    component: "UInput",
    type: "email",
    validation: basicInfoSchema.shape["email"],
    props: { placeholder: "Enter email" },
  },
  {
    name: "age",
    label: "Age",
    component: "UInput",
    type: "number",
    validation: basicInfoSchema.shape["age"],
    props: { placeholder: "Age" },
  },
  {
    name: "gender",
    label: "Gender",
    component: "USelect",
    type: "text",
    validation: basicInfoSchema.shape["gender"],
    props: {
      options: [
        { label: "Male", value: "M" },
        { label: "Female", value: "F" },
      ],
    },
  },
  {
    name: "birth_date",
    label: "Birth Date",
    type: "text",
    component: "UCalendar",
    validation: basicInfoSchema.shape["birth_date"],
    props: {},
  },
];

const jobInfoFields: FieldWithConditions[] = [
  {
    name: "employment_status",
    label: "Employment Status",
    component: "URadioGroup",
    type: "radio",
    validation: z.string().min(1, "Select status"),
    row: 3,
    colSpan: 4,
    props: {
      defaultValue: "employed",
      items: [
        { label: "Employed", value: "employed" },
        { label: "Self-Employed", value: "self-employed" },
        { label: "Unemployed", value: "unemployed" },
      ],
    },
  },
  {
    name: "employment_type",
    label: "Employment Type",
    component: "USelect",
    type: "text",
    validation: z.string().min(1, "Select employment type"),
    props: {
      defaultValue: "employed",
      options: [
        { label: "Employed", value: "employed" },
        { label: "Self-Employed", value: "self-employed" },
        { label: "Unemployed", value: "unemployed" },
      ],
    },
    // defaultValue: () =>{
    //   return "employed";
    // }
  },

  // Show only if employed
  {
    name: "company_name",
    label: "Company Name",
    component: "UInput",
    type: "text",
    validation: z.string().min(1, "Company name required"),
    hidden: (values) => values.employment_type !== "employed",
    props: { placeholder: "Enter company name" },
  },

  // Show only if employed
  {
    name: "position",
    label: "Position",
    component: "UInput",
    type: "text",
    validation: z.string().min(1, "Position required"),
    hidden: (values) => values.employment_type !== "employed",
    props: { placeholder: "Enter your position" },
  },

  // Show only if self-employed
  {
    name: "business_type",
    label: "Business Type",
    component: "USelect",
    type: "text",
    validation: z.string().optional(),
    hidden: (values) => values.employment_type !== "self-employed",
    props: {
      options: [
        { label: "Retail", value: "retail" },
        { label: "Services", value: "services" },
        { label: "Manufacturing", value: "manufacturing" },
      ],
    },
  },

  // Show only if self-employed
  {
    name: "business_name",
    label: "Business Name",
    component: "UInput",
    type: "text",
    validation: z.string().optional(),
    dependsOn: ["employment_type"],
    clearOnChange: true,
    hidden: (values) => values.employment_type !== "self-employed",
    props: { placeholder: "Enter your business name" },
  },

  // Dynamic salary options based on employment type
  {
    name: "salary_range",
    label: "Salary Range",
    component: "USelect",
    type: "text",
    validation: z.string().optional(),
    hidden: (values) =>
      !values.employment_type || values.employment_type === "unemployed",
    options: (values) => {
      if (values.employment_type === "employed") {
        return [
          { label: "$20k - $40k", value: "20-40" },
          { label: "$40k - $60k", value: "40-60" },
          { label: "$60k - $80k", value: "60-80" },
          { label: "$80k+", value: "80+" },
        ];
      }
      if (values.employment_type === "self-employed") {
        return [
          { label: "$10k - $30k", value: "10-30" },
          { label: "$30k - $50k", value: "30-50" },
          { label: "$50k+", value: "50+" },
        ];
      }
      return [];
    },
    props: {},
  },

  // Show all the time, populate based on business_type
  {
    name: "industry_details",
    label: "Industry Details",
    component: "UTextarea",
    type: "text",
    validation: z.string().optional(),
    clearOnChange: true,
    dependsOn: ["business_type"],
    defaultValue: (values) => {
      const templates: Record<string, string> = {
        retail: "Retail business - selling products to consumers",
        services: "Service-based business - providing professional services",
        manufacturing: "Manufacturing business - producing goods",
      };
      console.log("++++++++++++", values.business_type);
      return values.business_type || "";
    },
    props: { placeholder: "Industry specific details" },
  },

  // Conditional validation - show only if has salary info
  {
    name: "tax_id",
    label: "Tax ID",
    component: "UInput",
    type: "text",
    validation: z.string().optional(),
    hidden: (values) => values.employment_type === "unemployed",
    props: { placeholder: "Enter tax ID" },
  },
];

// ============ STATE ============
const form = reactive({
  basicInfo: {},
  jobInfo: {},
});

const allErrors = ref<string[]>([]);

// ============ REFS ============
const basicInfoFormRef = ref<any>(null);
const jobInfoFormRef = ref<any>(null);

// ============ HANDLERS ============
function onBasicInfoSubmit(values: BasicInfoType) {
  console.log("BASIC INFO SUBMITTED", values);
  allErrors.value = [];
  alert("Basic Info submitted successfully!");
}

function onBasicInfoError(err: any) {
  console.log("BASIC INFO ERROR", err);
  allErrors.value = Array.isArray(err) ? err : [err];
}

function onJobInfoSubmit(values: JobInfoType) {
  console.log("JOB INFO SUBMITTED", values);
  allErrors.value = [];
  alert("Job Info submitted successfully!");
}

function onJobInfoError(err: any) {
  console.log("JOB INFO ERROR", err);
  allErrors.value = Array.isArray(err) ? err : [err];
}

function onValidate(e: any) {
  console.log("FIELD VALIDATED", e);
}

// ============ ACTIONS ============
function submitSection(section: "basicInfo" | "jobInfo") {
  allErrors.value = [];
  if (section === "basicInfo") {
    basicInfoFormRef.value?.submit();
  } else {
    jobInfoFormRef.value?.submit();
  }
}

function validateAllSections() {
  const basicInfoValid = basicInfoFormRef.value?.validateAll();
  const jobInfoValid = jobInfoFormRef.value?.validateAll();

  console.log("BASIC INFO VALID:", basicInfoValid);
  console.log("JOB INFO VALID:", jobInfoValid);

  if (basicInfoValid && jobInfoValid) {
    alert("All sections are valid!");
  } else {
    allErrors.value = ["Please fix errors in the form"];
  }
}

function submitAllSections() {
  allErrors.value = [];
  const basicInfoValid = basicInfoFormRef.value?.validateAll();
  const jobInfoValid = jobInfoFormRef.value?.validateAll();

  if (basicInfoValid && jobInfoValid) {
    console.log("ALL SECTIONS SUBMITTED", {
      basicInfo: form.basicInfo,
      jobInfo: form.jobInfo,
    });
    alert("All sections submitted successfully!");
  } else {
    allErrors.value = ["Please fix all validation errors before submitting"];
  }
}
</script>
