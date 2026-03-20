/**
 * V2 type re-exports.
 * The `FieldOrRow` union is kept for backward compatibility but the
 * preferred V2 pattern is to use `FieldWithConditions` with `row` / `colSpan`
 * properties directly — FormRenderer and FormBuilder both use that approach.
 */
export type { FieldWithConditions } from "~/types/form-builder";
