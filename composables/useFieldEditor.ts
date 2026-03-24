import type { Ref, ComputedRef } from "vue";
import type { ValidationRule } from "~/utils/form-schema";
import type { CanvasField, CanvasPage } from "~/pages/builder/config";

//  Constants 

export const ruleTypeOptions = [
  { label: "Min length", value: "min" },
  { label: "Max length", value: "max" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Regex pattern", value: "regex" },
];
export const ruleNeedsValue = ["min", "max", "regex"];

export const supportsValidation = [
  "UInput",
  "UTextarea",
  "USelect",
  "URadioGroup",
  "USelectMenu",
];
export const supportsRequiredMessage = [
  "UAddress",
  "UAsyncSelect",
  "UCalendar",
  "UTagInput",
  "UDateRange",
  "UOtpInput",
  "UMapPicker",
];

export const hasItems = ["USelect", "URadioGroup", "UCheckboxGroup", "USelectMenu"];

export const colTypeOptions = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
];

export const sectionStyleOptions = [
  { label: "Card", value: "card" },
  { label: "Collapse", value: "collapse" },
  { label: "Plain", value: "plain" },
];

export const colSpanOptions = [
  { label: "Full (12)", value: 12 },
  { label: "Half (6)", value: 6 },
  { label: "Third (4)", value: 4 },
  { label: "Two-thirds (8)", value: 8 },
  { label: "Quarter (3)", value: 3 },
];

export const ADDRESS_LEVELS = ["province", "district", "commune", "village"] as const;
export const addressLevelLabels: Record<string, string> = {
  province: "Province (ខេត្ត/ក្រុង)",
  district: "District (ស្រុក/ក្រុង)",
  commune: "Commune (ឃុំ/សង្កាត់)",
  village: "Village (ភូមិ)",
};

//  Composable ─

export function useFieldEditor(params: {
  pages: Ref<CanvasPage[]>;
  selectedId: Ref<string | null>;
  selectedField: ComputedRef<CanvasField | null>;
  rightPanel: Ref<"field" | "row" | "section" | "page" | null>;
  modal: ReturnType<typeof useConfirmModal>;
}) {
  const { pages, selectedId, selectedField, rightPanel, modal } = params;

  function updateSelected(patch: Partial<CanvasField>) {
    if (!selectedId.value) return;
    for (const page of pages.value)
      for (const sec of page.sections)
        for (const row of sec.rows) {
          const f = row.fields.find((f) => f._id === selectedId.value);
          if (f) { Object.assign(f, patch); return; }
        }
  }

  function removeField(id: string) {
    let field: CanvasField | undefined = selectedField.value ?? undefined;
    if (!field) {
      outer: for (const page of pages.value)
        for (const sec of page.sections)
          for (const row of sec.rows)
            for (const f of row.fields)
              if (f._id === id) { field = f; break outer; }
    }
    modal.openConfirm({
      title: "Remove Field",
      description: `"${field?.label || field?.name || "This field"}" will be removed.`,
      icon: "i-heroicons-trash",
      confirmLabel: "Remove",
      onConfirm: () => {
        for (const page of pages.value)
          for (const sec of page.sections)
            for (const row of sec.rows) {
              const idx = row.fields.findIndex((f) => f._id === id);
              if (idx >= 0) { row.fields.splice(idx, 1); break; }
            }
        if (selectedId.value === id) { selectedId.value = null; rightPanel.value = null; }
      },
    });
  }

  //  Full Address sub-field 

  function updateFullAddressSubField(field: CanvasField, level: string, patch: Record<string, any>) {
    const subFields = { ...(field.props?.subFields ?? {}) };
    subFields[level] = { ...(subFields[level] ?? {}), ...patch };
    updateSelected({ props: { ...field.props, subFields } });
  }

  //  Validation rules 

  function addRule(field: CanvasField) {
    updateSelected({
      validation: [
        ...(field.validation ?? []),
        { type: "min" as const, value: 1, message: "This field is required" },
      ],
    });
  }
  function removeRule(field: CanvasField, idx: number) {
    const rules = [...(field.validation ?? [])];
    rules.splice(idx, 1);
    updateSelected({ validation: rules });
  }
  function updateRule(field: CanvasField, idx: number, patch: Partial<ValidationRule>) {
    const rules = [...(field.validation ?? [])] as ValidationRule[];
    rules[idx] = { ...rules[idx], ...patch };
    updateSelected({ validation: rules });
  }
  function getAddressRequiredMessage(field: CanvasField): string {
    return field.validation?.[0]?.message ?? "";
  }
  function setAddressRequiredMessage(message: string) {
    updateSelected({
      validation: message.trim() ? [{ type: "required" as const, message }] : [],
    });
  }

  //  Select / Radio / Checkbox items 

  function addItem(field: CanvasField) {
    const items = [...(field.items ?? [])];
    items.push({ label: `Option ${items.length + 1}`, value: `opt${items.length + 1}` });
    updateSelected({ items });
  }
  function removeItem(field: CanvasField, idx: number) {
    const items = [...(field.items ?? [])];
    items.splice(idx, 1);
    updateSelected({ items });
  }
  function updateItem(field: CanvasField, idx: number, key: "label" | "value", val: string) {
    const items = [...(field.items ?? [])];
    items[idx] = { ...items[idx], [key]: val };
    updateSelected({ items });
  }

  //  Table columns ─

  function addTableColumn(field: CanvasField) {
    const cols = [...(field.props?.columns ?? [])];
    const n = cols.length + 1;
    cols.push({ key: `col${n}`, label: `Column ${n}`, type: "text" });
    updateSelected({ props: { ...field.props, columns: cols } });
  }
  function removeTableColumn(field: CanvasField, idx: number) {
    const cols = [...(field.props?.columns ?? [])];
    cols.splice(idx, 1);
    updateSelected({ props: { ...field.props, columns: cols } });
  }
  function updateTableColumn(field: CanvasField, idx: number, patch: Record<string, any>) {
    const cols = [...(field.props?.columns ?? [])] as any[];
    cols[idx] = { ...cols[idx], ...patch };
    updateSelected({ props: { ...field.props, columns: cols } });
  }
  function addTableColOption(field: CanvasField, colIdx: number) {
    const cols = [...(field.props?.columns ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts.push({ label: `Option ${opts.length + 1}`, value: `opt${opts.length + 1}` });
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, columns: cols } });
  }
  function removeTableColOption(field: CanvasField, colIdx: number, optIdx: number) {
    const cols = [...(field.props?.columns ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts.splice(optIdx, 1);
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, columns: cols } });
  }
  function updateTableColOption(field: CanvasField, colIdx: number, optIdx: number, key: "label" | "value", val: string) {
    const cols = [...(field.props?.columns ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts[optIdx] = { ...opts[optIdx], [key]: val };
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, columns: cols } });
  }

  //  Repeater sub-fields 

  function addRepeaterField(field: CanvasField) {
    const cols = [...(field.props?.fields ?? [])];
    const n = cols.length + 1;
    cols.push({ key: `field${n}`, label: `Field ${n}`, type: "text" });
    updateSelected({ props: { ...field.props, fields: cols } });
  }
  function removeRepeaterField(field: CanvasField, idx: number) {
    const cols = [...(field.props?.fields ?? [])];
    cols.splice(idx, 1);
    updateSelected({ props: { ...field.props, fields: cols } });
  }
  function updateRepeaterField(field: CanvasField, idx: number, patch: Record<string, any>) {
    const cols = [...(field.props?.fields ?? [])] as any[];
    cols[idx] = { ...cols[idx], ...patch };
    updateSelected({ props: { ...field.props, fields: cols } });
  }
  function addRepeaterFieldOption(field: CanvasField, colIdx: number) {
    const cols = [...(field.props?.fields ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts.push({ label: `Option ${opts.length + 1}`, value: `opt${opts.length + 1}` });
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, fields: cols } });
  }
  function removeRepeaterFieldOption(field: CanvasField, colIdx: number, optIdx: number) {
    const cols = [...(field.props?.fields ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts.splice(optIdx, 1);
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, fields: cols } });
  }
  function updateRepeaterFieldOption(field: CanvasField, colIdx: number, optIdx: number, key: "label" | "value", val: string) {
    const cols = [...(field.props?.fields ?? [])] as any[];
    const opts = [...(cols[colIdx].options ?? [])];
    opts[optIdx] = { ...opts[optIdx], [key]: val };
    cols[colIdx] = { ...cols[colIdx], options: opts };
    updateSelected({ props: { ...field.props, fields: cols } });
  }

  return {
    updateSelected,
    removeField,
    updateFullAddressSubField,
    addRule, removeRule, updateRule,
    getAddressRequiredMessage, setAddressRequiredMessage,
    addItem, removeItem, updateItem,
    addTableColumn, removeTableColumn, updateTableColumn,
    addTableColOption, removeTableColOption, updateTableColOption,
    addRepeaterField, removeRepeaterField, updateRepeaterField,
    addRepeaterFieldOption, removeRepeaterFieldOption, updateRepeaterFieldOption,
  };
}
