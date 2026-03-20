import { z } from "zod";
import type { ZodType } from "zod";
import type { FieldWithConditions } from "~/types/form-builder";
import type { FormConfig, FormPage, FormSection } from "~/constants/form-builder";

// ---------------------------------------------------------------------------
// Serializable condition types (no functions — safe for JSON / API)
// ---------------------------------------------------------------------------

export type ConditionOp = "eq" | "neq" | "in" | "nin" | "empty" | "notempty";

export interface ConditionRule {
  op: ConditionOp;
  field: string;
  value?: any;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "email" | "url" | "regex";
  value?: number | string;
  message: string;
}

export interface JSONOption {
  label: string;
  value: string;
}

export interface JSONField {
  name: string;
  label?: string;
  component: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  colSpan?: number;
  row?: number;
  clearOnChange?: boolean;
  hiddenIf?: ConditionRule[];
  dependsOn?: string[];
  items?: JSONOption[];
  validation?: ValidationRule[];
  props?: Record<string, any>;
}

export interface JSONSection {
  id: string;
  title?: string;
  description?: string;
  icon?: string;
  fields: JSONField[];
}

export interface JSONPage {
  id: string;
  title: string;
  description?: string;
  sections?: JSONSection[];
  fields?: JSONField[];
}

export interface JSONFormConfig {
  id: string;
  title: string;
  description?: string;
  submitButtonText?: string;
  previousButtonText?: string;
  nextButtonText?: string;
  pages: JSONPage[];
}

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

export function evalCondition(
  rule: ConditionRule,
  values: Record<string, any>,
): boolean {
  const v = values[rule.field];
  switch (rule.op) {
    case "eq":
      return v === rule.value;
    case "neq":
      return v !== rule.value;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(v);
    case "nin":
      return Array.isArray(rule.value) && !rule.value.includes(v);
    case "empty":
      return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    case "notempty":
      return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Zod schema builder from ValidationRule[]
// ---------------------------------------------------------------------------

// components that store objects, not strings — only support "required" rule
const OBJECT_VALUE_COMPONENTS = ["UAddress", "UAsyncSelect"];

export function buildValidation(
  rules: ValidationRule[],
  component: string,
): ZodType {
  // object-value components: only a presence check makes sense
  if (OBJECT_VALUE_COMPONENTS.includes(component)) {
    const req = rules.find((r) => r.type === "required");
    return z.any().refine(
      (v) => v !== null && v !== undefined && typeof v === "object",
      { message: req?.message ?? `${component} is required` },
    );
  }

  let schema: ZodType = component === "UInputNumber" ? z.number() : z.string();

  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        schema = (schema as any).min(1, rule.message);
        break;
      case "email":
        schema = (schema as any).email(rule.message);
        break;
      case "url":
        schema = (schema as any).url(rule.message);
        break;
      case "min":
        schema = (schema as any).min(
          Number(rule.value),
          rule.message,
        );
        break;
      case "max":
        schema = (schema as any).max(
          Number(rule.value),
          rule.message,
        );
        break;
      case "regex":
        if (rule.value) {
          schema = (schema as any).regex(
            new RegExp(rule.value as string),
            rule.message,
          );
        }
        break;
    }
  }

  return schema;
}

// ---------------------------------------------------------------------------
// Interpret a JSONField → FieldWithConditions
// ---------------------------------------------------------------------------

function interpretField(jf: JSONField): FieldWithConditions {
  const field: FieldWithConditions = {
    name: jf.name,
    label: jf.label,
    component: jf.component,
    type: jf.type ?? "text",
    placeholder: jf.placeholder,
    required: jf.required,
    colSpan: jf.colSpan ?? 12,
    row: jf.row,
    clearOnChange: jf.clearOnChange,
    dependsOn: jf.dependsOn,
    props: {
      ...(jf.props ?? {}),
      ...(jf.items ? { items: jf.items } : {}),
    },
  };

  // UAddress: reconstruct queryParams function from serializable props
  if (jf.component === "UAddress" && jf.props?.addressQueryParamKey && jf.props?.addressQueryParamSourceField) {
    const paramKey = jf.props.addressQueryParamKey as string;
    const sourceField = jf.props.addressQueryParamSourceField as string;
    field.props = {
      ...field.props,
      queryParams: (values: Record<string, any>) =>
        values[sourceField] ? { [paramKey]: values[sourceField]?.code } : {},
    };
  }

  // hiddenIf → hidden function
  if (jf.hiddenIf?.length) {
    const rules = jf.hiddenIf;
    field.hidden = (values) => rules.every((r) => evalCondition(r, values));
  }

  // validation rules → Zod schema
  if (jf.validation?.length) {
    field.validation = buildValidation(jf.validation, jf.component);
  } else if (jf.required) {
    // auto-required when no explicit rules but field is marked required
    // components that store non-string values need z.any() refine instead of z.string()
    const usesObjectValue =
      jf.component === "UFileInput" ||
      jf.component === "UFileUpload" ||
      jf.component === "UAddress" ||
      jf.component === "UAsyncSelect";
    field.validation = usesObjectValue
      ? z.any().refine((v) => v !== null && v !== undefined, { message: `${jf.label || jf.name} is required` })
      : z.string().min(1, `${jf.label || jf.name} is required`);
  }

  return field;
}

// ---------------------------------------------------------------------------
// Interpret full JSONFormConfig → FormConfig (runtime, with functions)
// ---------------------------------------------------------------------------

export function interpretConfig(json: JSONFormConfig): FormConfig {
  const pages: FormPage[] = json.pages.map((jp) => {
    const page: FormPage = {
      id: jp.id,
      title: jp.title,
      description: jp.description,
    };

    if (jp.sections) {
      page.sections = jp.sections.map((js) => ({
        id: js.id,
        title: js.title ?? "",
        description: js.description,
        icon: js.icon,
        fields: js.fields.map(interpretField),
      })) as FormSection[];
    } else if (jp.fields) {
      page.fields = jp.fields.map(interpretField);
    }

    return page;
  });

  return {
    pages,
    submitButtonText: json.submitButtonText,
    previousButtonText: json.previousButtonText,
    nextButtonText: json.nextButtonText,
  };
}
