import type { Field } from "~/types/form-builder";

export interface FieldRow {
  type: "row";
  fields: Field[];
}

export type FieldOrRow = Field | FieldRow;
