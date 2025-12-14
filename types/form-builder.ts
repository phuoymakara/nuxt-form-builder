import type { Component } from "vue";
import type { ZodType } from "zod";

export interface ObjectGeneric {
  [keys: string]: any;
}
export interface Field {
  component: Component | any;
  description?: string;
  placeholder?: string;
  required?: boolean;
  type: string;
  label?: string;
  name: string;
  props?: ObjectGeneric;
  attrs?: ObjectGeneric;
  validation?: ZodType | any;
}

export interface FieldWithConditions extends Field {
  hidden?: (values: ObjectGeneric) => boolean;
  disabled?: (values: ObjectGeneric) => boolean;
  options?: (values: ObjectGeneric) => any[];
  defaultValue?: (values: ObjectGeneric) => any;
  dependsOn?: string[]; // Track which fields this depends on
  clearOnChange?: boolean; // Whether to clear this field when dependencies change (default: true)
  colSpan?: number; // Number of columns to span (1-12)
  row?: number; // Group fields by row number
  cascadeConfig?: {
    // Fields that should clear when this field changes
    clearFieldsOnChange?: string[];
    // Fields that depend on this field
    dependentFields?: string[];
    // Transform function for the selected value before API call
    transformValue?: (val: any) => string | number;
  };
}
