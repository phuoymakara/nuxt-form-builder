<template>
  <div class="w-3/5 mx-auto grid grid-cols-1 gap-6 p-10">
    <h1>Multi-Section Form Builder</h1>

    <ULink to="/wizard-form" class="cursor-pointer">
      <UButton color="primary" class="p-3 rounded-2xl cursor-pointer">ចូល Wizard Form</UButton>
    </ULink>

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
      <BuilderFormFactory
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
    <pre class="mt-6 p-4 bg-gray-100 rounded">{{ JSON.stringify(form, null, 2) }}</pre>
    
    <!-- Validation Errors Display -->
    <div v-if="allErrors.length" class="mt-4 p-4 bg-red-100 rounded">
      <h3 class="font-bold mb-2">Errors:</h3>
      <ul>
        <li v-for="error in allErrors" :key="error" class="text-red-600">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { z } from "zod";
import { CalendarDate } from "@internationalized/date";
import type { Field } from "~/types/form-builder";

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
  GOVERMENT = "GOVERMENT"
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
    props: { placeholder: "Enter email" }
  },
  {
    name: "age",
    label: "Age",
    component: "UInput",
    type: "number",
    validation: basicInfoSchema.shape["age"],
    props: { placeholder: "Age" }
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
        { label: "Female", value: "F" }
      ]
    }
  },
  {
    name: "birth_date",
    label: "Birth Date",
    type: "text",
    component: "UCalendar",
    validation: basicInfoSchema.shape["birth_date"],
    props: {}
  },
];

const jobInfoFields: Field[] = [
  {
    name: "job_type",
    label: "ប្រភេទការងារ",
    component: "UCheckboxGroup",
    validation: jobInfoSchema.shape["job_type"],
    type: "",
    props: {
      items: [
        { label: "ការងាររដ្ឋ", value: "government" },
        { label: "ការងារឯកជន", value: "private" },
        { label: "អាជីវកម្មផ្ទាល់ខ្លួន", value: "self" }
      ]
    }
  },
  {
    name: "company_name",
    label: "Company Name",
    type: "",
    component: "UInput",
    validation: jobInfoSchema.shape["company_name"],
    props: { placeholder: "Enter company name" }
  },
  {
    name: "position",
    label: "Position",
    component: "UInput",
    type: "",
    validation: jobInfoSchema.shape["position"],
    props: { placeholder: "Enter position" }
  },
    {
    name: "salary",
    label: "Salary",
    component: "UInput",
    type: "number",
    validation: jobInfoSchema.shape["salary"],
    props: { placeholder: "Salary (optional)" }
  },
  // {
  //   name: "business_type",
  //   label: "business type",
  //   component: "URadioGroup",
  //   type: "radio",
  //   validation: jobInfoSchema.shape["business_type"],
  //   props: { 
  //     placeholder: "Business",
  //     items: [
  //       { label: "Goverment", value: BUSINESS_TYPE.GOVERMENT },
  //       { label: "NGO", value: BUSINESS_TYPE.NGO },
  //     ]
  //    }
  // },
];

// ============ STATE ============
const form = reactive({
  basicInfo: {},
  jobInfo: {}
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
      jobInfo: form.jobInfo
    });
    alert("All sections submitted successfully!");
  } else {
    allErrors.value = ["Please fix all validation errors before submitting"];
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  border: 1px solid #e5e7eb;
  padding: 24px;
  border-radius: 8px;
  background: #f9fafb;
}

.section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #1f2937;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 10px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.flex {
  display: flex;
}

.gap-4 {
  gap: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mt-6 {
  margin-top: 24px;
}

.mt-8 {
  margin-top: 32px;
}

pre {
  background: #f3f4f6;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
}
</style>