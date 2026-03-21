import { reactive, computed } from "vue";

import type { FieldWithConditions } from "~/types/form-builder";

function getFieldDefault(field: FieldWithConditions): any {
  if (field.props?.defaultValue !== undefined) return field.props.defaultValue;

  switch (field.component as string) {
    case "UCheckboxGroup":
    case "UCheckbox":
      return [];
    case "UFileInput":
    case "UFileUpload":
      return null;
    case "USwitch":
      return false;
    case "UCalendar":
    case "URadioGroup":
    case "USelect":
    case "USelectMenu":
      return "";
    case "UAsyncSelect":
    case "UAddress":
      return null; // object/complex values — use z.any() in validation
    default:
      return field.type === "number" ? null : "";
  }
}

export function useFormState(
  fields: FieldWithConditions[],
  initialValues?: Record<string, any>,
) {
  const values = reactive<Record<string, any>>(
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        initialValues?.[field.name] !== undefined
          ? initialValues[field.name]
          : getFieldDefault(field),
      ]),
    ),
  );

  const errors = reactive<Record<string, string | undefined>>({});
  const touched = reactive<Record<string, boolean>>({});

  // filter fields by hidden predicate
  const visibleFields = computed(() =>
    fields.filter((field) => !field.hidden || !field.hidden(values)),
  );

  // group visible fields by row, sorted ascending
  const rowGroups = computed(() => {
    const map = new Map<number, FieldWithConditions[]>();
    for (const field of visibleFields.value) {
      const row = field.row ?? 0;
      if (!map.has(row)) map.set(row, []);
      map.get(row)!.push(field);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, rowFields]) => rowFields);
  });

  function setValue(name: string, newValue: any) {
    values[name] = newValue;
    touched[name] = true;
    clearDependents(name);
    applyDynamicDefaults();
  }

  // clear fields that depend on changed field (unless clearOnChange: false)
  function clearDependents(changedName: string) {
    for (const field of fields) {
      if (!field.dependsOn?.includes(changedName)) continue;
      if (field.clearOnChange === false) continue;
      values[field.name] = getFieldDefault(field);
      errors[field.name] = undefined;
    }
  }

  // re-evaluate defaultValue fns after any change, only when field is empty
  function applyDynamicDefaults() {
    for (const field of fields) {
      if (typeof field.defaultValue !== "function") continue;
      const current = values[field.name];
      if (current !== "" && current !== null && current !== undefined) continue;
      const computed = field.defaultValue(values);
      if (computed !== undefined) values[field.name] = computed;
    }
  }

  function isDisabled(field: FieldWithConditions): boolean {
    return field.disabled ? field.disabled(values) : false;
  }

  // returns dynamic options or falls back to static items/options in props
  function getOptions(field: FieldWithConditions): any[] {
    if (typeof field.options === "function") return field.options(values);
    return field.props?.items ?? field.props?.options ?? [];
  }

  // validate all visible fields with Zod, populate errors, return isValid
  function validate(): boolean {
    let allValid = true;
    for (const field of visibleFields.value) {
      if (!field.validation) continue;
      try {
        field.validation.parse(values[field.name]);
        errors[field.name] = undefined;
      } catch (e) {
        errors[field.name] = (e as any)?.issues?.[0]?.message ?? "Invalid value";
        allValid = false;
      }
    }
    return allValid;
  }

  function reset() {
    for (const field of fields) {
      values[field.name] = getFieldDefault(field);
      errors[field.name] = undefined;
      touched[field.name] = false;
    }
  }

  return {
    values,
    errors,
    touched,
    visibleFields,
    rowGroups,
    setValue,
    clearDependents,
    isDisabled,
    getOptions,
    validate,
    reset,
  };
}
