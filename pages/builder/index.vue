<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFormStorage } from "~/composables/useFormStorage";
import { useConfirmModal } from "~/composables/useConfirmModal";
import { interpretConfig } from "~/utils/form-schema";
import type { JSONFormConfig, JSONField, JSONSection, ValidationRule } from "~/utils/form-schema";

definePageMeta({ title: "Form Builder" });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CanvasField extends JSONField {
  _id: string;
  _group?: string;
}

interface CanvasSection {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
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
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const palette: PaletteItem[] = [
  { component: "UInput", label: "Text Input", icon: "i-heroicons-pencil" },
  { component: "UTextarea", label: "Textarea", icon: "i-heroicons-bars-3-bottom-left", defaultProps: { rows: 3 } },
  { component: "USelect", label: "Select", icon: "i-heroicons-chevron-up-down", defaultItems: [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }] },
  { component: "URadioGroup", label: "Radio Group", icon: "i-heroicons-radio", defaultItems: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }], defaultProps: { orientation: "horizontal" } },
  { component: "UCheckboxGroup", label: "Checkbox Group", icon: "i-heroicons-check-circle", defaultItems: [{ label: "Item 1", value: "1" }, { label: "Item 2", value: "2" }] },
  { component: "UInputNumber", label: "Number", icon: "i-heroicons-hashtag", defaultProps: { min: 0 } },
  { component: "UInput", label: "Email", icon: "i-heroicons-envelope", defaultProps: { type: "email" } },
  { component: "UFileInput", label: "File Upload", icon: "i-heroicons-paper-clip", isFile: true },
  { component: "UAddress", label: "Full Address", icon: "i-heroicons-map-pin", isAddressGroup: true },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const { savedForms, saveForm, loadForm, deleteForm } = useFormStorage();
const toast = useToast();
const route = useRoute();
const modal = useConfirmModal();

let _seq = 0;
function uid() { return `id_${Date.now()}_${++_seq}`; }

function newSection(title = "Section"): CanvasSection {
  return { _id: uid(), title, fields: [] };
}

function newPage(title = "Step"): CanvasPage {
  return { _id: uid(), title, sections: [newSection("Section 1")] };
}

const isMultiStep = ref(false);
const formTitle = ref("My Form");
const formId = ref(`form-${Date.now()}`);
const pages = ref<CanvasPage[]>([newPage("Page 1")]);
const activePageIdx = ref(0);
const activeSectionIdx = ref(0);
const selectedId = ref<string | null>(null); // selected field _id

// right-panel mode: "field" | "section" | "page" | null
const rightPanel = ref<"field" | "section" | "page" | null>(null);

const currentPage = computed(() => pages.value[activePageIdx.value]);
const currentSection = computed(() => currentPage.value?.sections[activeSectionIdx.value]);

const selectedField = computed(() => {
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const f of sec.fields)
        if (f._id === selectedId.value) return f;
  return null;
});

function selectField(id: string) {
  selectedId.value = id;
  rightPanel.value = "field";
}

// ---------------------------------------------------------------------------
// Page management
// ---------------------------------------------------------------------------

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
      activePageIdx.value = Math.min(activePageIdx.value, pages.value.length - 1);
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

// ---------------------------------------------------------------------------
// Section management
// ---------------------------------------------------------------------------

function addSection() {
  currentPage.value.sections.push(newSection(`Section ${currentPage.value.sections.length + 1}`));
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
      activeSectionIdx.value = Math.min(activeSectionIdx.value, currentPage.value.sections.length - 1);
      selectedId.value = null;
    },
  });
}

function setActiveSection(idx: number) {
  activeSectionIdx.value = idx;
  selectedId.value = null;
  rightPanel.value = "section";
}

// ---------------------------------------------------------------------------
// Drag & drop
// ---------------------------------------------------------------------------

const draggingFrom = ref<"palette" | "canvas" | null>(null);
const draggingPaletteItem = ref<PaletteItem | null>(null);
const draggingCanvasId = ref<string | null>(null);
const draggingCanvasSectionId = ref<string | null>(null);
const dragOverSectionId = ref<string | null>(null);
const dragOverIndex = ref<number | null>(null);

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

function makeField(item: PaletteItem, sectionFields: CanvasField[]): CanvasField[] {
  if (item.isAddressGroup) {
    return [
      { _id: uid(), _group: "Address", name: "province", label: "ខេត្ត/ក្រុង", component: "UAddress", type: "select", colSpan: 6, clearOnChange: true, props: { apiEndpoint: "/api/address/provinces", searchable: true, labelKey: "name_kh", valueKey: "code", placeholder: "ជ្រើសរើសខេត្ត..." } },
      { _id: uid(), _group: "Address", name: "district", label: "ស្រុក/ក្រុង", component: "UAddress", type: "select", colSpan: 6, clearOnChange: true, dependsOn: ["province"], props: { apiEndpoint: "/api/address/districts", searchable: true, labelKey: "name_kh", valueKey: "code", placeholder: "ជ្រើសរើសស្រុក...", addressQueryParamKey: "province_code", addressQueryParamSourceField: "province" } },
      { _id: uid(), _group: "Address", name: "commune", label: "ឃុំ/សង្កាត់", component: "UAddress", type: "select", colSpan: 6, clearOnChange: true, dependsOn: ["district", "province"], props: { apiEndpoint: "/api/address/communes", searchable: true, labelKey: "name_kh", valueKey: "code", placeholder: "ជ្រើសរើសឃុំ...", addressQueryParamKey: "district_code", addressQueryParamSourceField: "district" } },
      { _id: uid(), _group: "Address", name: "village", label: "ភូមិ", component: "UAddress", type: "select", colSpan: 6, clearOnChange: true, dependsOn: ["commune", "district", "province"], props: { apiEndpoint: "/api/address/villages", searchable: true, labelKey: "name_kh", valueKey: "code", placeholder: "ជ្រើសរើសភូមិ...", addressQueryParamKey: "commune_code", addressQueryParamSourceField: "commune" } },
    ];
  }
  return [{
    _id: uid(),
    name: `field_${++_seq}`,
    label: item.label,
    component: item.component,
    type: item.isFile ? "file" : (item.defaultProps?.type ?? (item.component === "UTextarea" ? "textarea" : "text")),
    placeholder: item.isFile ? undefined : `Enter ${item.label.toLowerCase()}`,
    colSpan: 12,
    row: sectionFields.length + 1,
    ...(item.defaultItems ? { items: item.defaultItems } : {}),
    ...(item.defaultProps ? { props: item.defaultProps } : {}),
  }];
}

function onDrop(sectionId: string, index: number, e: DragEvent) {
  e.preventDefault();
  dragOverSectionId.value = null;
  dragOverIndex.value = null;

  const targetSection = currentPage.value.sections.find(s => s._id === sectionId);
  if (!targetSection) return;

  if (draggingFrom.value === "palette" && draggingPaletteItem.value) {
    const newFields = makeField(draggingPaletteItem.value, targetSection.fields);
    targetSection.fields.splice(index, 0, ...newFields);
    selectedId.value = newFields[0]._id;
    rightPanel.value = "field";
  } else if (draggingFrom.value === "canvas" && draggingCanvasId.value) {
    const srcSection = currentPage.value.sections.find(s => s._id === draggingCanvasSectionId.value);
    if (!srcSection) return;
    const fromIdx = srcSection.fields.findIndex(f => f._id === draggingCanvasId.value);
    if (fromIdx < 0) return;
    const [moved] = srcSection.fields.splice(fromIdx, 1);
    const insertAt = (srcSection === targetSection && fromIdx < index) ? index - 1 : index;
    targetSection.fields.splice(insertAt, 0, moved);
  }

  draggingFrom.value = null;
  draggingPaletteItem.value = null;
  draggingCanvasId.value = null;
  draggingCanvasSectionId.value = null;
  recalcRows();
}

function recalcRows() {
  for (const page of pages.value)
    for (const sec of page.sections)
      sec.fields.forEach((f, i) => { f.row = i + 1; });
}

// ---------------------------------------------------------------------------
// Config panel — field editing
// ---------------------------------------------------------------------------

function updateSelected(patch: Partial<CanvasField>) {
  if (!selectedId.value) return;
  for (const page of pages.value)
    for (const sec of page.sections) {
      const f = sec.fields.find(f => f._id === selectedId.value);
      if (f) { Object.assign(f, patch); return; }
    }
}

function removeField(id: string) {
  const field = selectedField.value ?? pages.value.flatMap(p => p.sections.flatMap(s => s.fields)).find(f => f._id === id);
  modal.openConfirm({
    title: "Remove Field",
    description: `"${field?.label || field?.name || "This field"}" will be removed.`,
    icon: "i-heroicons-trash",
    confirmLabel: "Remove",
    onConfirm: () => {
      for (const page of pages.value)
        for (const sec of page.sections) {
          const idx = sec.fields.findIndex(f => f._id === id);
          if (idx >= 0) { sec.fields.splice(idx, 1); break; }
        }
      if (selectedId.value === id) { selectedId.value = null; rightPanel.value = null; }
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
  updateSelected({ validation: [...(field.validation ?? []), { type: "min" as const, value: 1, message: "This field is required" }] });
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

const supportsValidation = ["UInput", "UTextarea", "UInputNumber", "USelect", "URadioGroup", "USelectMenu"];
const supportsRequiredMessage = ["UAddress", "UAsyncSelect"];

function getAddressRequiredMessage(field: CanvasField): string { return field.validation?.[0]?.message ?? ""; }
function setAddressRequiredMessage(message: string) {
  updateSelected({ validation: message.trim() ? [{ type: "required" as const, message }] : [] });
}

const hasItems = ["USelect", "URadioGroup", "UCheckboxGroup"];

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

const colSpanOptions = [
  { label: "Full (12)", value: 12 },
  { label: "Half (6)", value: 6 },
  { label: "Third (4)", value: 4 },
  { label: "Two-thirds (8)", value: 8 },
  { label: "Quarter (3)", value: 3 },
];

// ---------------------------------------------------------------------------
// Serialise → JSONFormConfig
// ---------------------------------------------------------------------------

function toJSONField(f: CanvasField): JSONField {
  const { _id, _group, ...rest } = f;
  return rest as JSONField;
}

function buildConfig(): JSONFormConfig {
  const jsonPages = pages.value.map((page) => {
    const hasSingleUnnamedSection = page.sections.length === 1 && !page.sections[0].description && !page.sections[0].icon;

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
      sections: page.sections.map(sec => ({
        id: sec._id,
        title: sec.title,
        description: sec.description,
        icon: sec.icon,
        fields: sec.fields.map(toJSONField),
      } as JSONSection)),
    };
  });

  return {
    id: formId.value,
    title: formTitle.value,
    pages: isMultiStep.value ? jsonPages : [jsonPages[0]],
  };
}

// ---------------------------------------------------------------------------
// Save / Load / Export / Preview
// ---------------------------------------------------------------------------

const { refresh } = useFormStorage();
const showPreview = ref(false);
const showLoad = ref(false);
const previewConfig = ref<ReturnType<typeof interpretConfig> | null>(null);
const previewKey = ref(0);

function save() {
  saveForm(buildConfig(), formTitle.value);
  refresh();
  toast.add({ title: "Saved!", color: "success", icon: "i-heroicons-check-circle" });
}

function loadSaved(id: string) {
  const entry = loadForm(id);
  if (!entry) return;
  formTitle.value = entry.config.title;
  formId.value = entry.config.id;
  isMultiStep.value = entry.config.pages.length > 1;

  pages.value = entry.config.pages.map(jp => ({
    _id: jp.id,
    title: jp.title,
    description: jp.description,
    sections: jp.sections
      ? jp.sections.map(js => ({
          _id: js.id,
          title: js.title ?? "Section",
          description: js.description,
          icon: js.icon,
          fields: js.fields.map(f => ({ ...f, _id: uid() }) as CanvasField),
        }))
      : [{ _id: uid(), title: "Section 1", fields: (jp.fields ?? []).map(f => ({ ...f, _id: uid() }) as CanvasField) }],
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
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Toolbar -->
    <div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-3">
        <AppBackButton fallback="/" />
        <UInput v-model="formTitle" placeholder="Form title…" variant="ghost" size="sm" class="w-48 font-semibold" />
        <UBadge color="warning" variant="soft">Builder</UBadge>
      </div>

      <div class="flex items-center gap-3">
        <!-- Single / Multi-step toggle -->
        <div class="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
          <UIcon name="i-heroicons-document" class="size-4 text-gray-400" />
          <span class="text-xs text-gray-600">Multi-step</span>
          <USwitch v-model="isMultiStep" size="sm" />
        </div>

        <UButton size="sm" variant="outline" color="neutral" leading-icon="i-heroicons-folder-open" @click="showLoad = true">Load</UButton>
        <UButton size="sm" variant="outline" color="neutral" leading-icon="i-heroicons-arrow-down-tray" @click="exportJson">Export</UButton>
        <UButton size="sm" variant="outline" leading-icon="i-heroicons-eye" @click="openPreview">Preview</UButton>
        <UButton size="sm" leading-icon="i-heroicons-cloud-arrow-up" @click="save">Save</UButton>
      </div>
    </div>

    <!-- Three-panel layout -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Palette -->
      <aside class="w-52 bg-white border-r border-gray-200 p-3 overflow-y-auto shrink-0">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Fields</p>
        <div class="space-y-1.5">
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

      <!-- Canvas -->
      <main class="flex-1 overflow-y-auto flex flex-col">

        <!-- Multi-step: page tabs -->
        <div v-if="isMultiStep" class="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            v-for="(page, pi) in pages"
            :key="page._id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            :class="pi === activePageIdx
              ? 'bg-primary-50 text-primary-700 border border-primary-200'
              : 'text-gray-500 hover:bg-gray-100'"
            @click="setActivePage(pi)"
          >
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
          <UButton size="xs" variant="ghost" leading-icon="i-heroicons-plus" @click="addPage">
            Add Step
          </UButton>
        </div>

        <!-- Page canvas area -->
        <div class="flex-1 p-6 overflow-y-auto">
          <div class="max-w-2xl mx-auto space-y-4">

            <!-- Section tabs (within page) -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="(sec, si) in currentPage.sections"
                :key="sec._id"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                :class="si === activeSectionIdx
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'text-gray-500 border-gray-200 hover:bg-gray-50'"
                @click="setActiveSection(si)"
              >
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
              <UButton size="xs" variant="ghost" leading-icon="i-heroicons-plus" @click="addSection">
                Add Section
              </UButton>
            </div>

            <!-- Current section card -->
            <div
              class="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              :class="{ 'border-primary-300': activeSectionIdx >= 0 }"
            >
              <!-- Section header -->
              <div
                class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 cursor-pointer"
                @click="rightPanel = 'section'; selectedId = null"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-rectangle-stack" class="size-4 text-gray-400" />
                  <span class="text-sm font-semibold text-gray-700">{{ currentSection?.title || "Section" }}</span>
                  <span v-if="currentSection?.description" class="text-xs text-gray-400">· {{ currentSection.description }}</span>
                </div>
                <UIcon name="i-heroicons-pencil-square" class="size-4 text-gray-300" />
              </div>

              <!-- Fields drop zone -->
              <div class="p-4">
                <!-- Empty state -->
                <div
                  v-if="currentSection?.fields.length === 0"
                  class="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 text-center"
                  @dragover.prevent="dragOverSectionId = currentSection?._id ?? null; dragOverIndex = 0"
                  @dragleave="onDragLeave"
                  @drop.prevent="onDrop(currentSection!._id, 0, $event)"
                >
                  <UIcon name="i-heroicons-cursor-arrow-rays" class="size-8 text-gray-300 mb-2" />
                  <p class="text-sm text-gray-400">Drag fields here</p>
                </div>

                <!-- Field list -->
                <div v-else class="space-y-1">
                  <template v-for="(field, fi) in currentSection?.fields ?? []" :key="field._id">
                    <!-- Drop zone above -->
                    <div
                      class="h-1.5 rounded-full transition-colors"
                      :class="dragOverSectionId === currentSection?._id && dragOverIndex === fi ? 'bg-primary-400' : 'bg-transparent'"
                      @dragover.prevent="onDragOver(currentSection!._id, fi, $event)"
                      @dragleave="onDragLeave"
                      @drop.prevent="onDrop(currentSection!._id, fi, $event)"
                    />
                    <!-- Field card -->
                    <div
                      class="group flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all"
                      :class="selectedId === field._id
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-300'"
                      draggable="true"
                      @click="selectField(field._id)"
                      @dragstart="onCanvasDragStart(field._id, currentSection!._id, $event)"
                      @dragover.prevent="onDragOver(currentSection!._id, fi, $event)"
                      @dragleave="onDragLeave"
                      @drop.prevent="onDrop(currentSection!._id, fi, $event)"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <UIcon name="i-heroicons-bars-2" class="size-4 text-gray-300 shrink-0 cursor-grab" />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-800 truncate">{{ field.label || field.name }}</p>
                          <p class="text-xs text-gray-400 flex items-center gap-1.5">
                            {{ field.component }}
                            <UBadge v-if="field._group" color="primary" variant="subtle" size="xs">{{ field._group }}</UBadge>
                            <span v-if="field.required" class="text-red-400">required</span>
                          </p>
                        </div>
                      </div>
                      <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash"
                        class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        @click.stop="removeField(field._id)" />
                    </div>
                  </template>

                  <!-- Final drop zone -->
                  <div
                    class="h-1.5 rounded-full transition-colors"
                    :class="dragOverSectionId === currentSection?._id && dragOverIndex === currentSection?.fields.length ? 'bg-primary-400' : 'bg-transparent'"
                    @dragover.prevent="onDragOver(currentSection!._id, currentSection!.fields.length, $event)"
                    @dragleave="onDragLeave"
                    @drop.prevent="onDrop(currentSection!._id, currentSection!.fields.length, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Config panel -->
      <aside class="w-72 bg-white border-l border-gray-200 overflow-y-auto shrink-0">

        <!-- Field config -->
        <div v-if="rightPanel === 'field' && selectedField" class="p-4 space-y-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Field Config</p>

          <div v-if="selectedField.component === 'UAddress'" class="flex items-start gap-2 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2.5 text-xs text-primary-700">
            <UIcon name="i-heroicons-map-pin" class="size-4 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium">Address Group Field</p>
              <p class="text-primary-500 mt-0.5">Part of a cascading address block. Rename the key if needed.</p>
            </div>
          </div>

          <UFormField label="Label">
            <UInput :model-value="selectedField.label" placeholder="Field label" size="sm" @update:model-value="updateSelected({ label: $event as string })" />
          </UFormField>
          <UFormField label="Field name (key)">
            <UInput :model-value="selectedField.name" placeholder="field_name" size="sm" @update:model-value="updateSelected({ name: $event as string })" />
          </UFormField>
          <UFormField label="Placeholder">
            <UInput :model-value="selectedField.placeholder" placeholder="Hint text…" size="sm" @update:model-value="updateSelected({ placeholder: $event as string })" />
          </UFormField>
          <UFormField label="Width">
            <USelect :model-value="selectedField.colSpan ?? 12" :items="colSpanOptions" size="sm" @update:model-value="updateSelected({ colSpan: Number($event) })" />
          </UFormField>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Required</span>
            <USwitch :model-value="selectedField.required ?? false" @update:model-value="updateSelected({ required: $event as boolean })" />
          </div>

          <!-- Validation rules (string components) -->
          <template v-if="supportsValidation.includes(selectedField.component)">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Validation Rules</p>
                <UButton size="xs" variant="ghost" leading-icon="i-heroicons-plus" @click="addRule(selectedField)">Add</UButton>
              </div>
              <div v-if="!selectedField.validation?.length" class="text-xs text-gray-400 italic px-1">No rules — use Required toggle for basic check.</div>
              <div class="space-y-3">
                <div v-for="(rule, idx) in selectedField.validation ?? []" :key="idx" class="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-2">
                  <div class="flex items-center gap-1.5">
                    <USelect :model-value="rule.type" :items="ruleTypeOptions" size="xs" class="flex-1" @update:model-value="updateRule(selectedField, idx, { type: $event as any })" />
                    <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-x-mark" @click="removeRule(selectedField, idx)" />
                  </div>
                  <UInput v-if="ruleNeedsValue.includes(rule.type)" :model-value="rule.value" :placeholder="rule.type === 'regex' ? 'e.g. ^[A-Z]+$' : 'e.g. 3'" size="xs" @update:model-value="updateRule(selectedField, idx, { value: $event as string })" />
                  <UInput :model-value="rule.message" placeholder="Error message" size="xs" @update:model-value="updateRule(selectedField, idx, { message: $event as string })" />
                </div>
              </div>
            </div>
          </template>

          <!-- Required message (address / async select) -->
          <template v-if="supportsRequiredMessage.includes(selectedField.component)">
            <div class="space-y-1.5">
              <p class="text-sm font-medium text-gray-700">Required Error Message</p>
              <p class="text-xs text-gray-400">Leave blank to disable validation.</p>
              <UInput :model-value="getAddressRequiredMessage(selectedField)" placeholder="e.g. Please select a province" size="sm" @update:model-value="setAddressRequiredMessage($event as string)" />
            </div>
          </template>

          <!-- Options (select / radio / checkbox) -->
          <template v-if="hasItems.includes(selectedField.component)">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">Options</p>
                <UButton size="xs" variant="ghost" leading-icon="i-heroicons-plus" @click="addItem(selectedField)">Add</UButton>
              </div>
              <div class="space-y-2">
                <div v-for="(item, idx) in selectedField.items ?? []" :key="idx" class="flex items-center gap-1.5">
                  <UInput :model-value="item.label" placeholder="Label" size="xs" class="flex-1" @update:model-value="updateItem(selectedField, idx, 'label', $event as string)" />
                  <UInput :model-value="item.value" placeholder="Value" size="xs" class="flex-1" @update:model-value="updateItem(selectedField, idx, 'value', $event as string)" />
                  <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-x-mark" @click="removeItem(selectedField, idx)" />
                </div>
              </div>
            </div>
          </template>

          <UButton block variant="soft" color="error" leading-icon="i-heroicons-trash" size="sm" @click="removeField(selectedField._id)">Remove Field</UButton>
        </div>

        <!-- Section config -->
        <div v-else-if="rightPanel === 'section' && currentSection" class="p-4 space-y-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section Config</p>
          <UFormField label="Section Title">
            <UInput v-model="currentSection.title" placeholder="e.g. Personal Info" size="sm" />
          </UFormField>
          <UFormField label="Description">
            <UInput v-model="currentSection.description" placeholder="Optional description" size="sm" />
          </UFormField>
          <UFormField label="Icon (Heroicons)">
            <UInput v-model="currentSection.icon" placeholder="i-heroicons-user" size="sm" />
          </UFormField>
        </div>

        <!-- Page config -->
        <div v-else-if="rightPanel === 'page' && currentPage" class="p-4 space-y-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step Config</p>
          <UFormField label="Step Title">
            <UInput v-model="currentPage.title" placeholder="e.g. Personal Info" size="sm" />
          </UFormField>
          <UFormField label="Description">
            <UInput v-model="currentPage.description" placeholder="Optional description" size="sm" />
          </UFormField>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center justify-center h-full py-16 text-center px-6">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="size-8 text-gray-200 mb-3" />
          <p class="text-sm text-gray-400">Click a field, section, or step to configure it</p>
        </div>
      </aside>
    </div>

    <!-- Preview modal -->
    <UModal v-model:open="showPreview" class="max-w-2xl">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Preview: {{ formTitle }}</h3>
              <UButton variant="ghost" color="neutral" size="sm" icon="i-heroicons-x-mark" @click="showPreview = false" />
            </div>
          </template>
          <div v-if="previewConfig" :key="previewKey">
            <template v-if="previewConfig.pages.length === 1">
              <V2FormRenderer :fields="previewConfig.pages[0].fields ?? previewConfig.pages[0].sections?.[0]?.fields ?? []" @submit="(d) => { console.log('Preview:', d); showPreview = false; }">
                <template #actions>
                  <div class="flex justify-end pt-2 gap-2">
                    <UButton variant="ghost" color="neutral" @click="showPreview = false">Close</UButton>
                    <UButton type="submit">Submit</UButton>
                  </div>
                </template>
              </V2FormRenderer>
            </template>
            <template v-else>
              <V2WizardRenderer :config="previewConfig" @submit="(d) => { console.log('Preview:', d); showPreview = false; }" />
            </template>
          </div>
          <div v-else class="py-8 text-center text-gray-400">No fields to preview.</div>
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
              <UButton variant="ghost" color="neutral" size="sm" icon="i-heroicons-x-mark" @click="showLoad = false" />
            </div>
          </template>
          <div v-if="savedForms.length === 0" class="py-8 text-center text-gray-400">No saved forms yet.</div>
          <div v-else class="space-y-2">
            <div v-for="form in savedForms" :key="form.id" class="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ form.name }}</p>
                <p class="text-xs text-gray-400">{{ new Date(form.updatedAt).toLocaleString() }}</p>
              </div>
              <div class="flex items-center gap-1">
                <UButton size="xs" variant="outline" @click="loadSaved(form.id)">Load</UButton>
                <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" @click="modal.openConfirm({ title: 'Delete Form', description: `'${form.name}' will be permanently deleted.`, icon: 'i-heroicons-trash', confirmLabel: 'Delete', onConfirm: () => { deleteForm(form.id); refresh(); } })" />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
