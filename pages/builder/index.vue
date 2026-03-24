<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFormStorage } from "~/composables/useFormStorage";
import { useConfirmModal } from "~/composables/useConfirmModal";
import { interpretConfig } from "~/utils/form-schema";
import type {
  JSONFormConfig,
  JSONField,
  JSONSection,
  ValidationRule,
} from "~/utils/form-schema";

definePageMeta({ title: "Form Builder" });

// Types

interface CanvasField extends JSONField {
  _id: string;
  _group?: string;
}

interface CanvasSection {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  displayStyle?: "card" | "collapse" | "plain";
  fields: CanvasField[];
}

interface CanvasPage {
  _id: string;
  title: string;
  description?: string;
  sections: CanvasSection[];
}

interface PaletteItem {
  component: string;
  label: string;
  icon: string;
  defaultProps?: Record<string, any>;
  defaultItems?: Array<{ label: string; value: string }>;
  isAddressGroup?: boolean;
  isFile?: boolean;
  isDatePicker?: boolean;
  isAsyncSelect?: boolean;
  isFileUpload?: boolean;
  isTable?: boolean;
  isOtp?: boolean;
  isRepeater?: boolean;
}

// Palette

const palette: PaletteItem[] = [
  { component: "UInput", label: "Text Input", icon: "i-heroicons-pencil" },
  {
    component: "UTextarea",
    label: "Textarea",
    icon: "i-heroicons-bars-3-bottom-left",
    defaultProps: { rows: 3 },
  },
  {
    component: "USelect",
    label: "Select",
    icon: "i-heroicons-chevron-up-down",
    defaultItems: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
  },
  {
    component: "USelectMenu",
    label: "Select Menu",
    icon: "i-heroicons-magnifying-glass-circle",
    defaultItems: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
  },
  {
    component: "URadioGroup",
    label: "Radio Group",
    icon: "i-heroicons-radio",
    defaultItems: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
    defaultProps: { orientation: "horizontal" },
  },
  {
    component: "UCheckboxGroup",
    label: "Checkbox Group",
    icon: "i-heroicons-check-circle",
    defaultItems: [
      { label: "Item 1", value: "1" },
      { label: "Item 2", value: "2" },
    ],
  },
  {
    component: "UInputNumber",
    label: "Number",
    icon: "i-heroicons-hashtag",
    defaultProps: { min: 0 },
  },
  {
    component: "UInput",
    label: "Email",
    icon: "i-heroicons-envelope",
    defaultProps: { type: "email" },
  },
  {
    component: "UCalendar",
    label: "Date Picker",
    icon: "i-heroicons-calendar-days",
    isDatePicker: true,
  },
  {
    component: "UAsyncSelect",
    label: "Async Search",
    icon: "i-heroicons-magnifying-glass",
    isAsyncSelect: true,
  },
  { component: "USwitch", label: "Switch", icon: "i-heroicons-toggle-left" },
  {
    component: "UFileUpload",
    label: "Photo / Avatar",
    icon: "i-heroicons-photo",
    isFileUpload: true,
  },
  {
    component: "UFileInput",
    label: "File Upload",
    icon: "i-heroicons-paper-clip",
    isFile: true,
  },
  {
    component: "UAddress",
    label: "Full Address",
    icon: "i-heroicons-map-pin",
    isAddressGroup: true,
  },
  {
    component: "UTableField",
    label: "Table",
    icon: "i-heroicons-table-cells",
    isTable: true,
  },
  {
    component: "UTagInput",
    label: "Tag Input",
    icon: "i-heroicons-tag",
  },
  {
    component: "UDateRange",
    label: "Date Range",
    icon: "i-heroicons-calendar-days",
  },
  {
    component: "UOtpInput",
    label: "OTP / PIN",
    icon: "i-heroicons-key",
    isOtp: true,
  },
  {
    component: "URepeater",
    label: "Repeater Group",
    icon: "i-heroicons-queue-list",
    isRepeater: true,
  },
];

// State

const { savedForms, saveForm, loadForm, deleteForm } = useFormStorage();
const toast = useToast();
const route = useRoute();
const modal = useConfirmModal();

let _seq = 0;
function uid() {
  return `id_${Date.now()}_${++_seq}`;
}

function newSection(title = "Section"): CanvasSection {
  return { _id: uid(), title, fields: [] };
}

function newPage(title = "Step"): CanvasPage {
  return { _id: uid(), title, sections: [newSection("Section 1")] };
}

const isMultiStep = ref(false);
const formTitle = ref("My Form");
const formId = ref(`form-${Date.now()}`);
const pages = ref<CanvasPage[]>([newPage("Step 1")]);
const activePageIdx = ref(0);
const activeSectionIdx = ref(0);
const selectedId = ref<string | null>(null); // selected field _id

// right-panel mode: "field" | "section" | "page" | null
const rightPanel = ref<"field" | "section" | "page" | null>(null);

const currentPage = computed(() => pages.value[activePageIdx.value]);
const currentSection = computed(
  () => currentPage.value?.sections[activeSectionIdx.value],
);

const selectedField = computed(() => {
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const f of sec.fields) if (f._id === selectedId.value) return f;
  return null;
});

// detect duplicate field names across all pages/sections
const duplicateNames = computed<Set<string>>(() => {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const f of sec.fields) {
        if (seen.has(f.name)) dupes.add(f.name);
        else seen.add(f.name);
      }
  return dupes;
});

function selectField(id: string) {
  selectedId.value = id;
  rightPanel.value = "field";
}

// Page management

function addPage() {
  pages.value.push(newPage(`Step ${pages.value.length + 1}`));
  activePageIdx.value = pages.value.length - 1;
  activeSectionIdx.value = 0;
  selectedId.value = null;
  rightPanel.value = "page";
}

function removePage(idx: number) {
  if (pages.value.length === 1) return;
  const page = pages.value[idx];
  modal.openConfirm({
    title: "Remove Step",
    description: `"${page.title}" and all its sections and fields will be deleted.`,
    icon: "i-heroicons-trash",
    confirmLabel: "Remove",
    onConfirm: () => {
      pages.value.splice(idx, 1);
      activePageIdx.value = Math.min(
        activePageIdx.value,
        pages.value.length - 1,
      );
      activeSectionIdx.value = 0;
      selectedId.value = null;
    },
  });
}

function setActivePage(idx: number) {
  activePageIdx.value = idx;
  activeSectionIdx.value = 0;
  selectedId.value = null;
  rightPanel.value = "page";
}

// Section management

function addSection() {
  currentPage.value.sections.push(
    newSection(`Section ${currentPage.value.sections.length + 1}`),
  );
  activeSectionIdx.value = currentPage.value.sections.length - 1;
  selectedId.value = null;
  rightPanel.value = "section";
}

function removeSection(idx: number) {
  if (currentPage.value.sections.length === 1) return;
  const sec = currentPage.value.sections[idx];
  modal.openConfirm({
    title: "Remove Section",
    description: `"${sec.title}" and all its fields will be deleted.`,
    icon: "i-heroicons-trash",
    confirmLabel: "Remove",
    onConfirm: () => {
      currentPage.value.sections.splice(idx, 1);
      activeSectionIdx.value = Math.min(
        activeSectionIdx.value,
        currentPage.value.sections.length - 1,
      );
      selectedId.value = null;
    },
  });
}

function setActiveSection(idx: number) {
  activeSectionIdx.value = idx;
  selectedId.value = null;
  rightPanel.value = "section";
}

// Drag & drop

const draggingFrom = ref<"palette" | "canvas" | null>(null);
const draggingPaletteItem = ref<PaletteItem | null>(null);
const draggingCanvasId = ref<string | null>(null);
const draggingCanvasSectionId = ref<string | null>(null);
const dragOverSectionId = ref<string | null>(null);
const dragOverIndex = ref<number | null>(null);

// Page tab drag & drop
const draggingPageIdx = ref<number | null>(null);
const dragOverPageIdx = ref<number | null>(null);

function onPageTabDragStart(idx: number, e: DragEvent) {
  draggingPageIdx.value = idx;
  e.dataTransfer!.effectAllowed = "move";
  e.stopPropagation();
}
function onPageTabDragOver(idx: number, e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  dragOverPageIdx.value = idx;
}
function onPageTabDrop(idx: number, e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const from = draggingPageIdx.value;
  draggingPageIdx.value = null;
  dragOverPageIdx.value = null;
  if (from === null || from === idx) return;
  const [page] = pages.value.splice(from, 1);
  pages.value.splice(idx, 0, page);
  activePageIdx.value = idx;
}
function onPageTabDragEnd() {
  draggingPageIdx.value = null;
  dragOverPageIdx.value = null;
}

// Section tab drag & drop
const draggingSectionIdx = ref<number | null>(null);
const dragOverSectionTabIdx = ref<number | null>(null);

function onSectionTabDragStart(idx: number, e: DragEvent) {
  draggingSectionIdx.value = idx;
  e.dataTransfer!.effectAllowed = "move";
  e.stopPropagation();
}
function onSectionTabDragOver(idx: number, e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  dragOverSectionTabIdx.value = idx;
}
function onSectionTabDrop(idx: number, e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const from = draggingSectionIdx.value;
  draggingSectionIdx.value = null;
  dragOverSectionTabIdx.value = null;
  if (from === null || from === idx) return;
  const [section] = currentPage.value.sections.splice(from, 1);
  currentPage.value.sections.splice(idx, 0, section);
  activeSectionIdx.value = idx;
}
function onSectionTabDragEnd() {
  draggingSectionIdx.value = null;
  dragOverSectionTabIdx.value = null;
}

function onPaletteDragStart(item: PaletteItem, e: DragEvent) {
  draggingFrom.value = "palette";
  draggingPaletteItem.value = item;
  e.dataTransfer!.effectAllowed = "copy";
}

function onCanvasDragStart(fieldId: string, sectionId: string, e: DragEvent) {
  draggingFrom.value = "canvas";
  draggingCanvasId.value = fieldId;
  draggingCanvasSectionId.value = sectionId;
  e.dataTransfer!.effectAllowed = "move";
}

function onDragOver(sectionId: string, index: number, e: DragEvent) {
  e.preventDefault();
  dragOverSectionId.value = sectionId;
  dragOverIndex.value = index;
}

function onDragLeave() {
  dragOverSectionId.value = null;
  dragOverIndex.value = null;
}

function makeField(
  item: PaletteItem,
  sectionFields: CanvasField[],
): CanvasField[] {
  if (item.isAddressGroup) {
    return [
      {
        _id: uid(),
        name: `full_address_${++_seq}`,
        label: "Full Address",
        component: "UFullAddress",
        type: "address",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: {
          subFields: {
            province: {
              label: "ខេត្ត/ក្រុង",
              required: false,
              colSpan: 6,
              apiEndpoint: "/api/address/provinces",
              labelKey: "name_kh",
              valueKey: "code",
              placeholder: "ជ្រើសរើសខេត្ត...",
              searchable: true,
            },
            district: {
              label: "ស្រុក/ក្រុង",
              required: false,
              colSpan: 6,
              apiEndpoint: "/api/address/districts",
              labelKey: "name_kh",
              valueKey: "code",
              placeholder: "ជ្រើសរើសស្រុក...",
              searchable: true,
            },
            commune: {
              label: "ឃុំ/សង្កាត់",
              required: false,
              colSpan: 6,
              apiEndpoint: "/api/address/communes",
              labelKey: "name_kh",
              valueKey: "code",
              placeholder: "ជ្រើសរើសឃុំ...",
              searchable: true,
            },
            village: {
              label: "ភូមិ",
              required: false,
              colSpan: 6,
              apiEndpoint: "/api/address/villages",
              labelKey: "name_kh",
              valueKey: "code",
              placeholder: "ជ្រើសរើសភូមិ...",
              searchable: true,
            },
          },
        },
      },
    ];
  }
  if (item.isDatePicker) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "UCalendar",
        type: "date",
        placeholder: "Select date...",
        colSpan: 12,
        row: sectionFields.length + 1,
      },
    ];
  }
  if (item.isAsyncSelect) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "UAsyncSelect",
        type: "select",
        placeholder: "Search...",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: {
          apiEndpoint: "",
          searchParam: "q",
          debounce: 300,
          minChars: 2,
          placeholder: "Search...",
          noResultsText: "No results found",
          loadingText: "Loading...",
        },
      },
    ];
  }
  if (item.isFileUpload) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "UFileUpload",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: {
          accept: "image/*",
          multiple: false,
        },
      },
    ];
  }
  if (item.isOtp) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "UOtpInput",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: { length: 6 },
      },
    ];
  }
  if (item.isRepeater) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "URepeater",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: {
          fields: [
            { key: "field1", label: "Field 1", type: "text" },
            { key: "field2", label: "Field 2", type: "text" },
          ],
        },
      },
    ];
  }
  if (item.isTable) {
    return [
      {
        _id: uid(),
        name: `field_${++_seq}`,
        label: item.label,
        component: "UTableField",
        colSpan: 12,
        row: sectionFields.length + 1,
        props: {
          columns: [
            { key: "col1", label: "Column 1", type: "text" },
            { key: "col2", label: "Column 2", type: "text" },
          ],
        },
      },
    ];
  }
  return [
    {
      _id: uid(),
      name: `field_${++_seq}`,
      label: item.label,
      component: item.component,
      type: item.isFile
        ? "file"
        : (item.defaultProps?.type ??
          (item.component === "UTextarea" ? "textarea" : "text")),
      placeholder: item.isFile
        ? undefined
        : `Enter ${item.label.toLowerCase()}`,
      colSpan: 12,
      row: sectionFields.length + 1,
      ...(item.defaultItems ? { items: item.defaultItems } : {}),
      ...(item.defaultProps ? { props: item.defaultProps } : {}),
    },
  ];
}

function onDrop(sectionId: string, index: number, e: DragEvent) {
  e.preventDefault();
  dragOverSectionId.value = null;
  dragOverIndex.value = null;
  if (draggingPageIdx.value !== null || draggingSectionIdx.value !== null)
    return;

  const targetSection = currentPage.value.sections.find(
    (s) => s._id === sectionId,
  );
  if (!targetSection) return;

  if (draggingFrom.value === "palette" && draggingPaletteItem.value) {
    const newFields = makeField(
      draggingPaletteItem.value,
      targetSection.fields,
    );
    targetSection.fields.splice(index, 0, ...newFields);
    selectedId.value = newFields[0]._id;
    rightPanel.value = "field";
  } else if (draggingFrom.value === "canvas" && draggingCanvasId.value) {
    const srcSection = currentPage.value.sections.find(
      (s) => s._id === draggingCanvasSectionId.value,
    );
    if (!srcSection) return;
    const fromIdx = srcSection.fields.findIndex(
      (f) => f._id === draggingCanvasId.value,
    );
    if (fromIdx < 0) return;
    const [moved] = srcSection.fields.splice(fromIdx, 1);
    const insertAt =
      srcSection === targetSection && fromIdx < index ? index - 1 : index;
    targetSection.fields.splice(insertAt, 0, moved);
  }

  draggingFrom.value = null;
  draggingPaletteItem.value = null;
  draggingCanvasId.value = null;
  draggingCanvasSectionId.value = null;
  recalcRows();
}

function recalcRows() {
  for (const page of pages.value) {
    for (const sec of page.sections) {
      let row = 1;
      let used = 0;
      for (const field of sec.fields) {
        const span = field.colSpan ?? 12;
        if (used + span > 12) {
          row++;
          used = 0;
        }
        field.row = row;
        used += span;
      }
    }
  }
}

// Config panel — field editing

function updateSelected(patch: Partial<CanvasField>) {
  if (!selectedId.value) return;
  for (const page of pages.value)
    for (const sec of page.sections) {
      const f = sec.fields.find((f) => f._id === selectedId.value);
      if (f) {
        Object.assign(f, patch);
        return;
      }
    }
}

// Full Address sub-field config
const ADDRESS_LEVELS = ["province", "district", "commune", "village"] as const;
const addressLevelLabels: Record<string, string> = {
  province: "Province (ខេត្ត/ក្រុង)",
  district: "District (ស្រុក/ក្រុង)",
  commune: "Commune (ឃុំ/សង្កាត់)",
  village: "Village (ភូមិ)",
};

function updateFullAddressSubField(
  field: CanvasField,
  level: string,
  patch: Record<string, any>,
) {
  const subFields = { ...(field.props?.subFields ?? {}) };
  subFields[level] = { ...(subFields[level] ?? {}), ...patch };
  updateSelected({ props: { ...field.props, subFields } });
}

function removeField(id: string) {
  const field =
    selectedField.value ??
    pages.value
      .flatMap((p) => p.sections.flatMap((s) => s.fields))
      .find((f) => f._id === id);
  modal.openConfirm({
    title: "Remove Field",
    description: `"${field?.label || field?.name || "This field"}" will be removed.`,
    icon: "i-heroicons-trash",
    confirmLabel: "Remove",
    onConfirm: () => {
      for (const page of pages.value)
        for (const sec of page.sections) {
          const idx = sec.fields.findIndex((f) => f._id === id);
          if (idx >= 0) {
            sec.fields.splice(idx, 1);
            break;
          }
        }
      if (selectedId.value === id) {
        selectedId.value = null;
        rightPanel.value = null;
      }
      recalcRows();
    },
  });
}

// validation rules
const ruleTypeOptions = [
  { label: "Min length", value: "min" },
  { label: "Max length", value: "max" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
  { label: "Regex pattern", value: "regex" },
];
const ruleNeedsValue = ["min", "max", "regex"];

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
function updateRule(
  field: CanvasField,
  idx: number,
  patch: Partial<ValidationRule>,
) {
  const rules = [...(field.validation ?? [])] as ValidationRule[];
  rules[idx] = { ...rules[idx], ...patch };
  updateSelected({ validation: rules });
}

const supportsValidation = [
  "UInput",
  "UTextarea",
  "UInputNumber",
  "USelect",
  "URadioGroup",
  "USelectMenu",
];
const supportsRequiredMessage = [
  "UAddress",
  "UAsyncSelect",
  "UCalendar",
  "UTagInput",
  "UDateRange",
  "UOtpInput",
];

function getAddressRequiredMessage(field: CanvasField): string {
  return field.validation?.[0]?.message ?? "";
}
function setAddressRequiredMessage(message: string) {
  updateSelected({
    validation: message.trim() ? [{ type: "required" as const, message }] : [],
  });
}

const hasItems = ["USelect", "URadioGroup", "UCheckboxGroup", "USelectMenu"];

function addItem(field: CanvasField) {
  const items = [...(field.items ?? [])];
  items.push({
    label: `Option ${items.length + 1}`,
    value: `opt${items.length + 1}`,
  });
  updateSelected({ items });
}
function removeItem(field: CanvasField, idx: number) {
  const items = [...(field.items ?? [])];
  items.splice(idx, 1);
  updateSelected({ items });
}
function updateItem(
  field: CanvasField,
  idx: number,
  key: "label" | "value",
  val: string,
) {
  const items = [...(field.items ?? [])];
  items[idx] = { ...items[idx], [key]: val };
  updateSelected({ items });
}

// Table column management
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
function updateTableColumn(
  field: CanvasField,
  idx: number,
  patch: Record<string, any>,
) {
  const cols = [...(field.props?.columns ?? [])] as any[];
  cols[idx] = { ...cols[idx], ...patch };
  updateSelected({ props: { ...field.props, columns: cols } });
}
function addTableColOption(field: CanvasField, colIdx: number) {
  const cols = [...(field.props?.columns ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts.push({
    label: `Option ${opts.length + 1}`,
    value: `opt${opts.length + 1}`,
  });
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, columns: cols } });
}
function removeTableColOption(
  field: CanvasField,
  colIdx: number,
  optIdx: number,
) {
  const cols = [...(field.props?.columns ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts.splice(optIdx, 1);
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, columns: cols } });
}
function updateTableColOption(
  field: CanvasField,
  colIdx: number,
  optIdx: number,
  key: "label" | "value",
  val: string,
) {
  const cols = [...(field.props?.columns ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts[optIdx] = { ...opts[optIdx], [key]: val };
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, columns: cols } });
}

// Repeater sub-field management (same shape as table columns, stored in props.fields)
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
function updateRepeaterField(
  field: CanvasField,
  idx: number,
  patch: Record<string, any>,
) {
  const cols = [...(field.props?.fields ?? [])] as any[];
  cols[idx] = { ...cols[idx], ...patch };
  updateSelected({ props: { ...field.props, fields: cols } });
}
function addRepeaterFieldOption(field: CanvasField, colIdx: number) {
  const cols = [...(field.props?.fields ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts.push({
    label: `Option ${opts.length + 1}`,
    value: `opt${opts.length + 1}`,
  });
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, fields: cols } });
}
function removeRepeaterFieldOption(
  field: CanvasField,
  colIdx: number,
  optIdx: number,
) {
  const cols = [...(field.props?.fields ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts.splice(optIdx, 1);
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, fields: cols } });
}
function updateRepeaterFieldOption(
  field: CanvasField,
  colIdx: number,
  optIdx: number,
  key: "label" | "value",
  val: string,
) {
  const cols = [...(field.props?.fields ?? [])] as any[];
  const opts = [...(cols[colIdx].options ?? [])];
  opts[optIdx] = { ...opts[optIdx], [key]: val };
  cols[colIdx] = { ...cols[colIdx], options: opts };
  updateSelected({ props: { ...field.props, fields: cols } });
}

const colTypeOptions = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
];

const sectionStyleOptions = [
  { label: "Card", value: "card" },
  { label: "Collapse", value: "collapse" },
  { label: "Plain", value: "plain" },
];

const colSpanOptions = [
  { label: "Full (12)", value: 12 },
  { label: "Half (6)", value: 6 },
  { label: "Third (4)", value: 4 },
  { label: "Two-thirds (8)", value: 8 },
  { label: "Quarter (3)", value: 3 },
];

// Serialise → JSONFormConfig

function toJSONField(f: CanvasField): JSONField {
  const { _id, _group, ...rest } = f;
  return rest as JSONField;
}

function buildConfig(): JSONFormConfig {
  const jsonPages = pages.value.map((page) => {
    // collapse to flat fields only when it's a single plain unnamed section with no style set
    const hasSingleUnnamedSection =
      page.sections.length === 1 &&
      !page.sections[0].description &&
      !page.sections[0].icon &&
      !page.sections[0].displayStyle;

    if (hasSingleUnnamedSection) {
      return {
        id: page._id,
        title: page.title,
        description: page.description,
        fields: page.sections[0].fields.map(toJSONField),
      };
    }

    return {
      id: page._id,
      title: page.title,
      description: page.description,
      sections: page.sections.map(
        (sec) =>
          ({
            id: sec._id,
            title: sec.title,
            description: sec.description,
            icon: sec.icon,
            displayStyle: sec.displayStyle,
            fields: sec.fields.map(toJSONField),
          }) as JSONSection,
      ),
    };
  });

  return {
    id: formId.value,
    title: formTitle.value,
    pages: isMultiStep.value ? jsonPages : [jsonPages[0]],
  };
}

// Save / Load / Export / Preview

const { refresh } = useFormStorage();
const showPreview = ref(false);
const showLoad = ref(false);
const previewConfig = ref<ReturnType<typeof interpretConfig> | null>(null);
const previewKey = ref(0);

function save() {
  saveForm(buildConfig(), formTitle.value);
  refresh();
  toast.add({
    title: "Saved!",
    color: "success",
    icon: "i-heroicons-check-circle",
  });
}

function loadSaved(id: string) {
  const entry = loadForm(id);
  if (!entry) return;
  formTitle.value = entry.config.title;
  formId.value = entry.config.id;
  isMultiStep.value = entry.config.pages.length > 1;

  pages.value = entry.config.pages.map((jp) => ({
    _id: jp.id,
    title: jp.title,
    description: jp.description,
    sections: jp.sections
      ? jp.sections.map((js) => ({
          _id: js.id,
          title: js.title ?? "Section",
          description: js.description,
          icon: js.icon,
          displayStyle: js.displayStyle,
          fields: js.fields.map((f) => ({ ...f, _id: uid() }) as CanvasField),
        }))
      : [
          {
            _id: uid(),
            title: "Section 1",
            fields: (jp.fields ?? []).map(
              (f) => ({ ...f, _id: uid() }) as CanvasField,
            ),
          },
        ],
  }));

  activePageIdx.value = 0;
  activeSectionIdx.value = 0;
  selectedId.value = null;
  rightPanel.value = null;
  showLoad.value = false;
}

function exportJson() {
  const json = JSON.stringify(buildConfig(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${formId.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function openPreview() {
  previewConfig.value = interpretConfig(buildConfig());
  previewKey.value++;
  showPreview.value = true;
}

onMounted(() => {
  const id = route.query.load as string | undefined;
  if (id) loadSaved(id);
});
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <div
      class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0"
    >
      <div class="flex items-center gap-3">
        <AppBackButton fallback="/" />
        <UInput
          v-model="formTitle"
          placeholder="Form title…"
          variant="ghost"
          size="sm"
          class="w-48 font-semibold"
        />
        <UBadge color="warning" variant="soft">Builder</UBadge>
      </div>

      <div class="flex items-center gap-3">
        <!-- Multi-step toggle -->
        <div
          class="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <UIcon name="i-heroicons-document" class="size-4 text-gray-400" />
          <span class="text-xs text-gray-600">Multi-step</span>
          <USwitch v-model="isMultiStep" size="sm" />
        </div>

        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          leading-icon="i-heroicons-folder-open"
          @click="showLoad = true"
          >Load</UButton
        >
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          leading-icon="i-heroicons-arrow-down-tray"
          @click="exportJson"
          >Export</UButton
        >
        <UButton
          size="sm"
          variant="outline"
          leading-icon="i-heroicons-eye"
          @click="openPreview"
          >Preview</UButton
        >
        <UButton
          size="sm"
          leading-icon="i-heroicons-cloud-arrow-up"
          @click="save"
          >Save</UButton
        >
      </div>
    </div>

    <!-- Three-panel layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left: field palette -->
      <aside
        class="w-52 bg-white border-r border-gray-200 p-1 flex flex-col shrink-0 overflow-hidden"
      >
        <p
          class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1 shrink-0"
        >
          Fields
        </p>
        <div
          class="space-y-1.5 overflow-y-auto flex-1 py-3"
          style="scrollbar-width: thin; scrollbar-color: #e5e7eb transparent"
        >
          <div
            v-for="item in palette"
            :key="item.label + item.component"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-700 cursor-grab active:cursor-grabbing hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors select-none"
            draggable="true"
            @dragstart="onPaletteDragStart(item, $event)"
          >
            <UIcon :name="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </div>
        </div>
      </aside>

      <!-- Center: canvas -->
      <main class="flex-1 overflow-hidden flex flex-col">
        <!-- Page tabs (multi-step only) -->
        <div
          v-if="isMultiStep"
          class="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0 overflow-x-auto"
        >
          <button
            v-for="(page, pi) in pages"
            :key="page._id"
            draggable="true"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-grab active:cursor-grabbing select-none"
            :class="[
              pi === activePageIdx
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-gray-500 hover:bg-gray-100 border border-transparent',
              dragOverPageIdx === pi && draggingPageIdx !== pi
                ? 'ring-2 ring-primary-400 ring-offset-1'
                : '',
              draggingPageIdx === pi ? 'opacity-40' : '',
            ]"
            @click="setActivePage(pi)"
            @dragstart="onPageTabDragStart(pi, $event)"
            @dragover="onPageTabDragOver(pi, $event)"
            @dragleave="dragOverPageIdx = null"
            @drop="onPageTabDrop(pi, $event)"
            @dragend="onPageTabDragEnd"
          >
            <UIcon
              name="i-heroicons-bars-2"
              class="size-3.5 text-gray-300 shrink-0"
            />
            <span>{{ page.title || `Step ${pi + 1}` }}</span>
            <UButton
              v-if="pages.length > 1"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-x-mark"
              class="size-4 p-0 ml-1"
              @click.stop="removePage(pi)"
            />
          </button>
          <UButton
            size="xs"
            variant="ghost"
            leading-icon="i-heroicons-plus"
            @click="addPage"
          >
            Add Step
          </UButton>
        </div>

        <!-- Scrollable body -->
        <div
          class="flex-1 p-6 overflow-y-auto"
          style="scrollbar-width: none; scrollbar-color: #e5e7eb transparent"
        >
          <div class="max-w-2xl mx-auto space-y-4">
            <!-- Section tabs -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="(sec, si) in currentPage.sections"
                :key="sec._id"
                draggable="true"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-grab active:cursor-grabbing select-none"
                :class="[
                  si === activeSectionIdx
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-50',
                  dragOverSectionTabIdx === si && draggingSectionIdx !== si
                    ? 'ring-2 ring-primary-400 ring-offset-1'
                    : '',
                  draggingSectionIdx === si ? 'opacity-40' : '',
                ]"
                @click="setActiveSection(si)"
                @dragstart="onSectionTabDragStart(si, $event)"
                @dragover="onSectionTabDragOver(si, $event)"
                @dragleave="dragOverSectionTabIdx = null"
                @drop="onSectionTabDrop(si, $event)"
                @dragend="onSectionTabDragEnd"
              >
                <UIcon
                  name="i-heroicons-bars-2"
                  class="size-3 text-gray-300 shrink-0"
                />
                <UIcon name="i-heroicons-rectangle-stack" class="size-3.5" />
                {{ sec.title || `Section ${si + 1}` }}
                <UButton
                  v-if="currentPage.sections.length > 1"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-x-mark"
                  class="size-3.5 p-0 ml-0.5"
                  @click.stop="removeSection(si)"
                />
              </button>
              <UButton
                size="xs"
                variant="ghost"
                leading-icon="i-heroicons-plus"
                @click="addSection"
              >
                Add Section
              </UButton>
            </div>

            <!-- Section card -->
            <div
              class="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              :class="{ 'border-primary-300': activeSectionIdx >= 0 }"
            >
              <!-- Header -->
              <div
                class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 cursor-pointer"
                @click="
                  rightPanel = 'section';
                  selectedId = null;
                "
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-rectangle-stack"
                    class="size-4 text-gray-400"
                  />
                  <span class="text-sm font-semibold text-gray-700">{{
                    currentSection?.title || "Section"
                  }}</span>
                  <span
                    v-if="currentSection?.description"
                    class="text-xs text-gray-400"
                    >· {{ currentSection.description }}</span
                  >
                </div>
                <UIcon
                  name="i-heroicons-pencil-square"
                  class="size-4 text-gray-300"
                />
              </div>

              <!-- Drop zone -->
              <div class="p-4">
                <!-- Empty -->
                <div
                  v-if="currentSection?.fields.length === 0"
                  class="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 text-center"
                  @dragover.prevent="
                    dragOverSectionId = currentSection?._id ?? null;
                    dragOverIndex = 0;
                  "
                  @dragleave="onDragLeave"
                  @drop.prevent="onDrop(currentSection!._id, 0, $event)"
                >
                  <UIcon
                    name="i-heroicons-cursor-arrow-rays"
                    class="size-8 text-gray-300 mb-2"
                  />
                  <p class="text-sm text-gray-400">Drag fields here</p>
                </div>

                <!-- Fields -->
                <div v-else class="space-y-1">
                  <template
                    v-for="(field, fi) in currentSection?.fields ?? []"
                    :key="field._id"
                  >
                    <!-- Drop indicator -->
                    <div
                      class="h-1.5 rounded-full transition-colors"
                      :class="
                        dragOverSectionId === currentSection?._id &&
                        dragOverIndex === fi
                          ? 'bg-primary-400'
                          : 'bg-transparent'
                      "
                      @dragover.prevent="
                        onDragOver(currentSection!._id, fi, $event)
                      "
                      @dragleave="onDragLeave"
                      @drop.prevent="onDrop(currentSection!._id, fi, $event)"
                    />
                    <!-- Field row -->
                    <div
                      class="group flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all"
                      :class="
                        selectedId === field._id
                          ? 'border-primary-400 bg-primary-50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                      "
                      draggable="true"
                      @click="selectField(field._id)"
                      @dragstart="
                        onCanvasDragStart(
                          field._id,
                          currentSection!._id,
                          $event,
                        )
                      "
                      @dragover.prevent="
                        onDragOver(currentSection!._id, fi, $event)
                      "
                      @dragleave="onDragLeave"
                      @drop.prevent="onDrop(currentSection!._id, fi, $event)"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <UIcon
                          name="i-heroicons-bars-2"
                          class="size-4 text-gray-300 shrink-0 cursor-grab"
                        />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-800 truncate">
                            {{ field.label || field.name }}
                          </p>
                          <p
                            class="text-xs text-gray-400 flex items-center gap-1.5"
                          >
                            {{ field.component }}
                            <UBadge
                              v-if="field._group"
                              color="primary"
                              variant="subtle"
                              size="xs"
                              >{{ field._group }}</UBadge
                            >
                            <span v-if="field.required" class="text-red-400"
                              >required</span
                            >
                            <span
                              v-if="duplicateNames.has(field.name)"
                              class="text-orange-500 font-medium flex items-center gap-0.5"
                            >
                              <UIcon
                                name="i-heroicons-exclamation-triangle"
                                class="size-3"
                              />
                              duplicate key
                            </span>
                          </p>
                        </div>
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="error"
                        icon="i-heroicons-trash"
                        class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        @click.stop="removeField(field._id)"
                      />
                    </div>
                  </template>

                  <!-- Tail drop indicator -->
                  <div
                    class="h-1.5 rounded-full transition-colors"
                    :class="
                      dragOverSectionId === currentSection?._id &&
                      dragOverIndex === currentSection?.fields.length
                        ? 'bg-primary-400'
                        : 'bg-transparent'
                    "
                    @dragover.prevent="
                      onDragOver(
                        currentSection!._id,
                        currentSection!.fields.length,
                        $event,
                      )
                    "
                    @dragleave="onDragLeave"
                    @drop.prevent="
                      onDrop(
                        currentSection!._id,
                        currentSection!.fields.length,
                        $event,
                      )
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right: config panel -->
      <aside
        class="w-72 bg-white border-l border-gray-200 overflow-y-auto shrink-0"
        style="scrollbar-width: thin; scrollbar-color: #e5e7eb transparent"
      >
        <!-- Field config -->
        <div
          v-if="rightPanel === 'field' && selectedField"
          class="p-4 space-y-4"
        >
          <p
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Field Config
          </p>

          <div
            v-if="selectedField.component === 'UFullAddress'"
            class="flex items-start gap-2 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2.5 text-xs text-primary-700"
          >
            <UIcon name="i-heroicons-map-pin" class="size-4 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium">Full Address Field</p>
              <p class="text-primary-500 mt-0.5">
                Configure each address level individually below.
              </p>
            </div>
          </div>

          <UFormField label="Label">
            <UInput
              :model-value="selectedField.label"
              placeholder="Field label"
              size="sm"
              @update:model-value="updateSelected({ label: $event as string })"
            />
          </UFormField>
          <UFormField label="Field name (key)">
            <UInput
              :model-value="selectedField.name"
              placeholder="field_name"
              size="sm"
              @update:model-value="updateSelected({ name: $event as string })"
            />
            <p
              v-if="duplicateNames.has(selectedField.name)"
              class="text-xs text-orange-500 flex items-center gap-1 mt-1"
            >
              <UIcon name="i-heroicons-exclamation-triangle" class="size-3.5" />
              Duplicate key — another field uses this name. Form values will
              conflict.
            </p>
          </UFormField>
          <UFormField label="Placeholder">
            <UInput
              :model-value="selectedField.placeholder"
              placeholder="Hint text…"
              size="sm"
              @update:model-value="
                updateSelected({ placeholder: $event as string })
              "
            />
          </UFormField>
          <UFormField label="Width" class="w-full col-span-full">
            <USelect
              class="w-[70%]"
              :model-value="selectedField.colSpan ?? 12"
              :items="colSpanOptions"
              size="sm"
              @update:model-value="
                updateSelected({ colSpan: Number($event) });
                recalcRows();
              "
            />
          </UFormField>
          <div
            v-if="selectedField.component !== 'UFullAddress'"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-700">Required</span>
            <USwitch
              :model-value="selectedField.required ?? false"
              @update:model-value="
                updateSelected({ required: $event as boolean })
              "
            />
          </div>

          <!-- Validation rules -->
          <template v-if="supportsValidation.includes(selectedField.component)">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">
                  Validation Rules
                </p>
                <UButton
                  size="xs"
                  variant="ghost"
                  leading-icon="i-heroicons-plus"
                  @click="addRule(selectedField)"
                  >Add</UButton
                >
              </div>
              <div
                v-if="!selectedField.validation?.length"
                class="text-xs text-gray-400 italic px-1"
              >
                No rules — use Required toggle for basic check.
              </div>
              <div class="space-y-3">
                <div
                  v-for="(rule, idx) in selectedField.validation ?? []"
                  :key="idx"
                  class="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2"
                >
                  <div class="flex items-center gap-1.5">
                    <USelect
                      :model-value="rule.type"
                      :items="ruleTypeOptions"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateRule(selectedField, idx, { type: $event as any })
                      "
                    />
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      icon="i-heroicons-x-mark"
                      @click="removeRule(selectedField, idx)"
                    />
                  </div>
                  <UInput
                    v-if="ruleNeedsValue.includes(rule.type)"
                    :model-value="rule.value"
                    :placeholder="
                      rule.type === 'regex' ? 'e.g. ^[A-Z]+$' : 'e.g. 3'
                    "
                    size="xs"
                    @update:model-value="
                      updateRule(selectedField, idx, {
                        value: $event as string,
                      })
                    "
                  />
                  <UInput
                    :model-value="rule.message"
                    placeholder="Error message"
                    size="xs"
                    @update:model-value="
                      updateRule(selectedField, idx, {
                        message: $event as string,
                      })
                    "
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Required message -->
          <template
            v-if="supportsRequiredMessage.includes(selectedField.component)"
          >
            <div class="space-y-1.5">
              <p class="text-sm font-medium text-gray-700">
                Required Error Message
              </p>
              <p class="text-xs text-gray-400">
                Leave blank to disable validation.
              </p>
              <UInput
                :model-value="getAddressRequiredMessage(selectedField)"
                placeholder="e.g. Please select a province"
                size="sm"
                @update:model-value="
                  setAddressRequiredMessage($event as string)
                "
              />
            </div>
          </template>

          <!-- Async select config -->
          <template v-if="selectedField.component === 'UAsyncSelect'">
            <div class="space-y-3">
              <p class="text-sm font-medium text-gray-700">
                Async Search Config
              </p>
              <UFormField label="API Endpoint">
                <UInput
                  :model-value="selectedField.props?.apiEndpoint ?? ''"
                  placeholder="/api/search"
                  size="sm"
                  @update:model-value="
                    updateSelected({
                      props: {
                        ...selectedField.props,
                        apiEndpoint: $event as string,
                      },
                    })
                  "
                />
              </UFormField>
              <UFormField label="Search Param">
                <UInput
                  :model-value="selectedField.props?.searchParam ?? 'q'"
                  placeholder="q"
                  size="sm"
                  @update:model-value="
                    updateSelected({
                      props: {
                        ...selectedField.props,
                        searchParam: $event as string,
                      },
                    })
                  "
                />
              </UFormField>
              <UFormField label="Min Chars to Search">
                <UInputNumber
                  :model-value="selectedField.props?.minChars ?? 2"
                  :min="0"
                  size="sm"
                  @update:model-value="
                    updateSelected({
                      props: {
                        ...selectedField.props,
                        minChars: Number($event),
                      },
                    })
                  "
                />
              </UFormField>
              <UFormField label="Debounce (ms)">
                <UInputNumber
                  :model-value="selectedField.props?.debounce ?? 300"
                  :min="0"
                  :step="50"
                  size="sm"
                  @update:model-value="
                    updateSelected({
                      props: {
                        ...selectedField.props,
                        debounce: Number($event),
                      },
                    })
                  "
                />
              </UFormField>
              <UFormField label="No Results Text">
                <UInput
                  :model-value="
                    selectedField.props?.noResultsText ?? 'No results found'
                  "
                  size="sm"
                  @update:model-value="
                    updateSelected({
                      props: {
                        ...selectedField.props,
                        noResultsText: $event as string,
                      },
                    })
                  "
                />
              </UFormField>
            </div>
          </template>

          <!-- Options -->
          <template v-if="hasItems.includes(selectedField.component)">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Options</p>
                <UButton
                  size="xs"
                  variant="ghost"
                  leading-icon="i-heroicons-plus"
                  @click="addItem(selectedField)"
                  >Add</UButton
                >
              </div>
              <div class="space-y-2">
                <div
                  v-for="(item, idx) in selectedField.items ?? []"
                  :key="idx"
                  class="flex items-center gap-1.5"
                >
                  <UInput
                    :model-value="item.label"
                    placeholder="Label"
                    size="xs"
                    class="flex-1"
                    @update:model-value="
                      updateItem(selectedField, idx, 'label', $event as string)
                    "
                  />
                  <UInput
                    :model-value="item.value"
                    placeholder="Value"
                    size="xs"
                    class="flex-1"
                    @update:model-value="
                      updateItem(selectedField, idx, 'value', $event as string)
                    "
                  />
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="error"
                    icon="i-heroicons-x-mark"
                    @click="removeItem(selectedField, idx)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Table columns config -->
          <template v-if="selectedField.component === 'UTableField'">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Columns</p>
                <UButton
                  size="xs"
                  variant="ghost"
                  leading-icon="i-heroicons-plus"
                  type="button"
                  @click="addTableColumn(selectedField)"
                  >Add</UButton
                >
              </div>
              <div class="space-y-3">
                <div
                  v-for="(col, ci) in selectedField.props?.columns ?? []"
                  :key="ci"
                  class="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2"
                >
                  <div class="flex items-center gap-1.5">
                    <UInput
                      :model-value="col.label"
                      placeholder="Label"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateTableColumn(selectedField, ci, {
                          label: $event as string,
                        })
                      "
                    />
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      icon="i-heroicons-x-mark"
                      type="button"
                      @click="removeTableColumn(selectedField, ci)"
                    />
                  </div>
                  <div class="flex gap-1.5">
                    <UInput
                      :model-value="col.key"
                      placeholder="key"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateTableColumn(selectedField, ci, {
                          key: $event as string,
                        })
                      "
                    />
                    <USelect
                      :model-value="col.type"
                      :items="colTypeOptions"
                      size="xs"
                      class="w-24"
                      @update:model-value="
                        updateTableColumn(selectedField, ci, {
                          type: $event as string,
                        })
                      "
                    />
                  </div>
                  <!-- select column options -->
                  <template v-if="col.type === 'select'">
                    <div class="space-y-1.5 pl-1 border-l-2 border-gray-200">
                      <div
                        v-for="(opt, oi) in col.options ?? []"
                        :key="oi"
                        class="flex items-center gap-1"
                      >
                        <UInput
                          :model-value="opt.label"
                          placeholder="Label"
                          size="xs"
                          class="flex-1"
                          @update:model-value="
                            updateTableColOption(
                              selectedField,
                              ci,
                              oi,
                              'label',
                              $event as string,
                            )
                          "
                        />
                        <UInput
                          :model-value="opt.value"
                          placeholder="Value"
                          size="xs"
                          class="flex-1"
                          @update:model-value="
                            updateTableColOption(
                              selectedField,
                              ci,
                              oi,
                              'value',
                              $event as string,
                            )
                          "
                        />
                        <UButton
                          size="xs"
                          variant="ghost"
                          color="error"
                          icon="i-heroicons-x-mark"
                          type="button"
                          @click="removeTableColOption(selectedField, ci, oi)"
                        />
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        leading-icon="i-heroicons-plus"
                        type="button"
                        @click="addTableColOption(selectedField, ci)"
                        >Option</UButton
                      >
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- OTP length config -->
          <template v-if="selectedField.component === 'UOtpInput'">
            <UFormField label="PIN Length">
              <UButtonGroup size="sm">
                <UButton
                  v-for="n in [4, 5, 6]"
                  :key="n"
                  type="button"
                  :variant="
                    (selectedField.props?.length ?? 6) === n
                      ? 'solid'
                      : 'outline'
                  "
                  :color="
                    (selectedField.props?.length ?? 6) === n
                      ? 'primary'
                      : 'neutral'
                  "
                  @click="
                    updateSelected({
                      props: { ...selectedField.props, length: n },
                    })
                  "
                  >{{ n }} digits</UButton
                >
              </UButtonGroup>
            </UFormField>
          </template>

          <!-- Repeater sub-fields config -->
          <template v-if="selectedField.component === 'URepeater'">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Sub-fields</p>
                <UButton
                  size="xs"
                  variant="ghost"
                  leading-icon="i-heroicons-plus"
                  type="button"
                  @click="addRepeaterField(selectedField)"
                  >Add</UButton
                >
              </div>
              <div class="space-y-3">
                <div
                  v-for="(col, ci) in selectedField.props?.fields ?? []"
                  :key="ci"
                  class="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2"
                >
                  <div class="flex items-center gap-1.5">
                    <UInput
                      :model-value="col.label"
                      placeholder="Label"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateRepeaterField(selectedField, ci, {
                          label: $event as string,
                        })
                      "
                    />
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      icon="i-heroicons-x-mark"
                      type="button"
                      @click="removeRepeaterField(selectedField, ci)"
                    />
                  </div>
                  <div class="flex gap-1.5">
                    <UInput
                      :model-value="col.key"
                      placeholder="key"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateRepeaterField(selectedField, ci, {
                          key: $event as string,
                        })
                      "
                    />
                    <USelect
                      :model-value="col.type"
                      :items="colTypeOptions"
                      size="xs"
                      class="w-24"
                      @update:model-value="
                        updateRepeaterField(selectedField, ci, {
                          type: $event as string,
                        })
                      "
                    />
                  </div>
                  <template v-if="col.type === 'select'">
                    <div class="space-y-1.5 pl-1 border-l-2 border-gray-200">
                      <div
                        v-for="(opt, oi) in col.options ?? []"
                        :key="oi"
                        class="flex items-center gap-1"
                      >
                        <UInput
                          :model-value="opt.label"
                          placeholder="Label"
                          size="xs"
                          class="flex-1"
                          @update:model-value="
                            updateRepeaterFieldOption(
                              selectedField,
                              ci,
                              oi,
                              'label',
                              $event as string,
                            )
                          "
                        />
                        <UInput
                          :model-value="opt.value"
                          placeholder="Value"
                          size="xs"
                          class="flex-1"
                          @update:model-value="
                            updateRepeaterFieldOption(
                              selectedField,
                              ci,
                              oi,
                              'value',
                              $event as string,
                            )
                          "
                        />
                        <UButton
                          size="xs"
                          variant="ghost"
                          color="error"
                          icon="i-heroicons-x-mark"
                          type="button"
                          @click="
                            removeRepeaterFieldOption(selectedField, ci, oi)
                          "
                        />
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        leading-icon="i-heroicons-plus"
                        type="button"
                        @click="addRepeaterFieldOption(selectedField, ci)"
                        >Option</UButton
                      >
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- Full Address sub-fields config -->
          <template v-if="selectedField.component === 'UFullAddress'">
            <div class="space-y-3">
              <p class="text-sm font-medium text-gray-700">Address Levels</p>
              <div
                v-for="level in ADDRESS_LEVELS"
                :key="level"
                class="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2"
              >
                <p class="text-xs font-semibold text-gray-500">
                  {{ addressLevelLabels[level] }}
                </p>
                <UFormField label="Label">
                  <UInput
                    :model-value="
                      selectedField.props?.subFields?.[level]?.label ?? ''
                    "
                    placeholder="Label"
                    size="xs"
                    @update:model-value="
                      updateFullAddressSubField(selectedField, level, {
                        label: $event as string,
                      })
                    "
                  />
                </UFormField>
                <UFormField label="Placeholder">
                  <UInput
                    :model-value="
                      selectedField.props?.subFields?.[level]?.placeholder ?? ''
                    "
                    placeholder="Placeholder"
                    size="xs"
                    @update:model-value="
                      updateFullAddressSubField(selectedField, level, {
                        placeholder: $event as string,
                      })
                    "
                  />
                </UFormField>
                <UFormField label="API Endpoint">
                  <UInput
                    :model-value="
                      selectedField.props?.subFields?.[level]?.apiEndpoint ?? ''
                    "
                    placeholder="/api/address/..."
                    size="xs"
                    @update:model-value="
                      updateFullAddressSubField(selectedField, level, {
                        apiEndpoint: $event as string,
                      })
                    "
                  />
                </UFormField>
                <UFormField label="Width">
                  <USelect
                    :model-value="
                      selectedField.props?.subFields?.[level]?.colSpan ?? 6
                    "
                    :items="colSpanOptions"
                    size="xs"
                    @update:model-value="
                      updateFullAddressSubField(selectedField, level, {
                        colSpan: Number($event),
                      })
                    "
                  />
                </UFormField>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">Required</span>
                  <USwitch
                    :model-value="
                      selectedField.props?.subFields?.[level]?.required ?? false
                    "
                    size="xs"
                    @update:model-value="
                      updateFullAddressSubField(selectedField, level, {
                        required: $event as boolean,
                      })
                    "
                  />
                </div>
              </div>
            </div>
          </template>

          <UButton
            block
            variant="soft"
            color="error"
            leading-icon="i-heroicons-trash"
            size="sm"
            @click="removeField(selectedField._id)"
            >Remove Field</UButton
          >
        </div>

        <!-- Section config -->
        <div
          v-else-if="rightPanel === 'section' && currentSection"
          class="p-4 space-y-4"
        >
          <p
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Section Config
          </p>
          <UFormField label="Section Title">
            <UInput
              v-model="currentSection.title"
              placeholder="e.g. Personal Info"
              size="sm"
            />
          </UFormField>
          <UFormField label="Description">
            <UInput
              v-model="currentSection.description"
              placeholder="Optional description"
              size="sm"
            />
          </UFormField>
          <UFormField label="Icon (Heroicons)">
            <UInput
              v-model="currentSection.icon"
              placeholder="i-heroicons-user"
              size="sm"
            />
          </UFormField>
          <UFormField label="Display Style">
            <UButtonGroup size="sm">
              <UButton
                v-for="opt in sectionStyleOptions"
                :key="opt.value"
                type="button"
                :variant="
                  (currentSection.displayStyle ?? 'card') === opt.value
                    ? 'solid'
                    : 'outline'
                "
                :color="
                  (currentSection.displayStyle ?? 'card') === opt.value
                    ? 'primary'
                    : 'neutral'
                "
                @click="
                  currentSection.displayStyle = opt.value as
                    | 'card'
                    | 'collapse'
                    | 'plain'
                "
                >{{ opt.label }}</UButton
              >
            </UButtonGroup>
          </UFormField>
        </div>

        <!-- Page config -->
        <div
          v-else-if="rightPanel === 'page' && currentPage"
          class="p-4 space-y-4"
        >
          <p
            class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
          >
            Step Config
          </p>
          <UFormField label="Step Title">
            <UInput
              v-model="currentPage.title"
              placeholder="e.g. Personal Info"
              size="sm"
            />
          </UFormField>
          <UFormField label="Description">
            <UInput
              v-model="currentPage.description"
              placeholder="Optional description"
              size="sm"
            />
          </UFormField>
        </div>

        <!-- Empty -->
        <div
          v-else
          class="flex flex-col items-center justify-center h-full py-16 text-center px-6"
        >
          <UIcon
            name="i-heroicons-cursor-arrow-rays"
            class="size-8 text-gray-200 mb-3"
          />
          <p class="text-sm text-gray-400">
            Click a field, section, or step to configure it
          </p>
        </div>
      </aside>
    </div>

    <!-- Preview modal -->
    <UModal v-model:open="showPreview" class="max-w-2xl">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">
                Preview: {{ formTitle }}
              </h3>
              <UButton
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-heroicons-x-mark"
                @click="showPreview = false"
              />
            </div>
          </template>
          <div v-if="previewConfig" :key="previewKey">
            <!-- single-page with sections → wizard handles section layout -->
            <template
              v-if="
                previewConfig.pages.length === 1 &&
                previewConfig.pages[0].sections
              "
            >
              <V2WizardRenderer
                :config="previewConfig"
                @submit="
                  (d) => {
                    console.log('Preview:', d);
                    showPreview = false;
                  }
                "
              />
            </template>
            <!-- single-page flat fields → simple renderer -->
            <template v-else-if="previewConfig.pages.length === 1">
              <V2FormRenderer
                :fields="previewConfig.pages[0].fields ?? []"
                @submit="
                  (d) => {
                    console.log('Preview:', d);
                    showPreview = false;
                  }
                "
              >
                <template #actions>
                  <div class="flex justify-end pt-2 gap-2">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      @click="showPreview = false"
                      >Close</UButton
                    >
                    <UButton type="submit">Submit</UButton>
                  </div>
                </template>
              </V2FormRenderer>
            </template>
            <!-- multi-page wizard -->
            <template v-else>
              <V2WizardRenderer
                :config="previewConfig"
                @submit="
                  (d: Record<string, any>) => {
                    console.log('Preview:', d);
                    showPreview = false;
                  }
                "
              />
            </template>
          </div>
          <div v-else class="py-8 text-center text-gray-400">
            No fields to preview.
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Load saved forms modal -->
    <UModal v-model:open="showLoad" class="max-w-lg">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Saved Forms</h3>
              <UButton
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-heroicons-x-mark"
                @click="showLoad = false"
              />
            </div>
          </template>
          <div
            v-if="savedForms.length === 0"
            class="py-8 text-center text-gray-400"
          >
            No saved forms yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="form in savedForms"
              :key="form.id"
              class="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-lg hover:bg-gray-50"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ form.name }}</p>
                <p class="text-xs text-gray-400">
                  {{ new Date(form.updatedAt).toLocaleString() }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <UButton size="xs" variant="outline" @click="loadSaved(form.id)"
                  >Load</UButton
                >
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="
                    modal.openConfirm({
                      title: 'Delete Form',
                      description: `'${form.name}' will be permanently deleted.`,
                      icon: 'i-heroicons-trash',
                      confirmLabel: 'Delete',
                      onConfirm: () => {
                        deleteForm(form.id);
                        refresh();
                      },
                    })
                  "
                />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
