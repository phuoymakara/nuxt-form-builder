<script setup lang="ts">
import { ref, computed } from "vue";
import { useConfirmModal } from "~/composables/useConfirmModal";
import { palette } from "~/pages/builder/config";
import type { CanvasRow, CanvasPage } from "~/pages/builder/config";
import { uid, newRow, newSection, newPage } from "~/utils/canvas-factories";
import { useBuilderDragDrop } from "~/composables/useBuilderDragDrop";
import {
  useFieldEditor,
  ruleTypeOptions, ruleNeedsValue,
  supportsValidation, supportsRequiredMessage,
  hasItems, colTypeOptions, sectionStyleOptions, colSpanOptions,
  ADDRESS_LEVELS, addressLevelLabels,
} from "~/composables/useFieldEditor";
import { useFormPersistence } from "~/composables/useFormPersistence";

definePageMeta({ title: "Form Builder" });

// ── Core state 

const modal = useConfirmModal();

const isMultiStep = ref(false);
const formTitle = ref("My Form");
const formId = ref(`form-${Date.now()}`);
const pages = ref<CanvasPage[]>([newPage("Step 1")]);
const activePageIdx = ref(0);
const activeSectionIdx = ref(0);
const selectedId = ref<string | null>(null);
const rightPanel = ref<"field" | "row" | "section" | "page" | null>(null);

const currentPage = computed(() => pages.value[activePageIdx.value]);
const currentSection = computed(() => currentPage.value?.sections[activeSectionIdx.value]);

const selectedField = computed(() => {
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const row of sec.rows)
        for (const f of row.fields)
          if (f._id === selectedId.value) return f;
  return null;
});

const duplicateNames = computed<Set<string>>(() => {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const row of sec.rows)
        for (const f of row.fields) {
          if (seen.has(f.name)) dupes.add(f.name);
          else seen.add(f.name);
        }
  return dupes;
});

function selectField(id: string) {
  selectedId.value = id;
  rightPanel.value = "field";
}

// ── Page management 

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

function duplicatePage(pi: number) {
  const taken = new Set(
    pages.value.flatMap((p) => p.sections.flatMap((s) => s.rows.flatMap((r) => r.fields.map((f) => f.name))))
  );
  const page = pages.value[pi];
  const clone = {
    ...page,
    _id: uid(),
    title: page.title + " (copy)",
    sections: page.sections.map((sec) => ({
      ...sec,
      _id: uid(),
      rows: sec.rows.map((row) => ({
        ...row,
        _id: uid(),
        fields: row.fields.map((f) => ({ ...f, _id: uid(), name: _uniqueName(f.name, taken) })),
      })),
    })),
  };
  pages.value.splice(pi + 1, 0, clone);
  activePageIdx.value = pi + 1;
  activeSectionIdx.value = 0;
  selectedId.value = null;
  rightPanel.value = "page";
}

// ── Section management 

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

function _uniqueName(base: string, taken: Set<string>): string {
  let name = `${base}_2`;
  let n = 2;
  while (taken.has(name)) name = `${base}_${++n}`;
  taken.add(name);
  return name;
}

function duplicateSection(si: number) {
  const taken = new Set(
    pages.value.flatMap((p) => p.sections.flatMap((s) => s.rows.flatMap((r) => r.fields.map((f) => f.name))))
  );
  const sec = currentPage.value.sections[si];
  const clone = {
    ...sec,
    _id: uid(),
    title: sec.title + " (copy)",
    rows: sec.rows.map((row) => ({
      ...row,
      _id: uid(),
      fields: row.fields.map((f) => ({ ...f, _id: uid(), name: _uniqueName(f.name, taken) })),
    })),
  };
  currentPage.value.sections.splice(si + 1, 0, clone);
  activeSectionIdx.value = si + 1;
  selectedId.value = null;
  rightPanel.value = "section";
}

function duplicateField(fieldId: string) {
  const taken = new Set(
    pages.value.flatMap((p) => p.sections.flatMap((s) => s.rows.flatMap((r) => r.fields.map((f) => f.name))))
  );
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const row of sec.rows) {
        const idx = row.fields.findIndex((f) => f._id === fieldId);
        if (idx >= 0) {
          const src = row.fields[idx];
          const clone = { ...src, _id: uid(), name: _uniqueName(src.name, taken) };
          row.fields.splice(idx + 1, 0, clone);
          selectedId.value = clone._id;
          rightPanel.value = "field";
          return;
        }
      }
}

// ── Row management

const selectedRowId = ref<string | null>(null);

function selectRow(id: string) {
  selectedRowId.value = id;
  selectedId.value = null;
  rightPanel.value = "row";
}

const selectedRow = computed(() => {
  for (const page of pages.value)
    for (const sec of page.sections)
      for (const row of sec.rows)
        if (row._id === selectedRowId.value) return row;
  return null;
});

function updateSelectedRow(patch: Partial<CanvasRow>) {
  if (!selectedRowId.value) return;
  for (const page of pages.value)
    for (const sec of page.sections) {
      const row = sec.rows.find((r) => r._id === selectedRowId.value);
      if (row) { Object.assign(row, patch); return; }
    }
}

function addRow(sectionId: string) {
  const section = currentPage.value.sections.find((s) => s._id === sectionId);
  if (!section) return;
  const row = newRow();
  section.rows.push(row);
  selectRow(row._id);
}

function removeRow(sectionId: string, rowId: string) {
  const section = currentPage.value.sections.find((s) => s._id === sectionId);
  if (!section) return;
  const row = section.rows.find((r) => r._id === rowId);
  if (!row) return;
  const doRemove = () => {
    section.rows = section.rows.filter((r) => r._id !== rowId);
    if (selectedRowId.value === rowId) { selectedRowId.value = null; rightPanel.value = null; }
  };
  if (row.fields.length > 0) {
    modal.openConfirm({
      title: "Remove Row",
      description: `This row has ${row.fields.length} field(s) that will also be removed.`,
      icon: "i-heroicons-trash",
      confirmLabel: "Remove",
      onConfirm: doRemove,
    });
  } else {
    doRemove();
  }
}

// ── Drag & drop ────

const dnd = useBuilderDragDrop({
  pages, currentPage, activePageIdx, activeSectionIdx, selectedId, rightPanel, uid,
});

const {
  draggingFrom, draggingCanvasId, dragOverSectionId, dragOverIndex,
  draggingPageIdx, dragOverPageIdx,
  onPageTabDragStart, onPageTabDragOver, onPageTabDrop, onPageTabDragEnd,
  draggingSectionIdx, dragOverSectionTabIdx,
  onSectionTabDragStart, onSectionTabDragOver, onSectionTabDrop, onSectionTabDragEnd,
  draggingRowId, dragOverRowId,
  onRowDragStart, onRowDragOver, onRowDrop, onRowDragEnd,
  onPaletteDragStart, onCanvasDragStart, onDragOver, onDragLeave,
  onDropToRow, onDropNewRow, onDrop,
} = dnd;

// ── Field editor ───

const {
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
} = useFieldEditor({ pages, selectedId, selectedField, rightPanel, modal });

// ── Persistence ────

const {
  savedForms, refresh, deleteForm,
  showPreview, showLoad, previewConfig, previewKey,
  save, loadSaved, exportJson, openPreview,
} = useFormPersistence({ pages, formTitle, formId, isMultiStep, activePageIdx, activeSectionIdx, selectedId, rightPanel });
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
            class="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-grab active:cursor-grabbing select-none"
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
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-document-duplicate"
              class="size-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="duplicatePage(pi)"
            />
            <UButton
              v-if="pages.length > 1"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-x-mark"
              class="size-4 p-0"
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
          <div class="max-w-4xl mx-auto space-y-4">
            <!-- Section tabs -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="(sec, si) in currentPage.sections"
                :key="sec._id"
                draggable="true"
                class="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-grab active:cursor-grabbing select-none"
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
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-document-duplicate"
                  class="size-3.5 p-0 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click.stop="duplicateSection(si)"
                />
                <UButton
                  v-if="currentPage.sections.length > 1"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-x-mark"
                  class="size-3.5 p-0"
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

              <!-- Section body: rows -->
              <div class="p-3 space-y-1">
                <!-- Empty section -->
                <div
                  v-if="!currentSection?.rows.length"
                  class="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-40 text-center"
                  @dragover.prevent="dragOverSectionId = currentSection?._id ?? null; dragOverIndex = 0"
                  @dragleave="onDragLeave"
                  @drop.prevent="onDrop(currentSection!._id, 0, $event)"
                >
                  <UIcon name="i-heroicons-cursor-arrow-rays" class="size-8 text-gray-300 mb-2" />
                  <p class="text-sm text-gray-400">Drag fields here to create a row</p>
                </div>

                <!-- Rows -->
                <template v-else>
                  <!-- Before-first-row drop zone -->
                  <div
                    class="h-1.5 rounded-full transition-colors"
                    :class="dragOverSectionId === currentSection?._id && dragOverIndex === 0 ? 'bg-primary-400' : 'bg-transparent'"
                    @dragover.prevent="dragOverSectionId = currentSection!._id; dragOverIndex = 0"
                    @dragleave="onDragLeave"
                    @drop.prevent="onDropNewRow(currentSection!._id, 0, $event)"
                  />

                  <template v-for="(row, ri) in currentSection?.rows ?? []" :key="row._id">
                    <!-- Row block -->
                    <div
                      class="border rounded-xl overflow-hidden transition-all"
                      :class="[
                        selectedRowId === row._id ? 'border-primary-300 bg-primary-50/20' : 'border-gray-200 bg-gray-50/30',
                        draggingRowId === row._id ? 'opacity-40' : '',
                        dragOverRowId === row._id && draggingRowId !== row._id ? 'ring-2 ring-primary-400' : '',
                      ]"
                      @dragover.prevent="onRowDragOver(row._id, $event)"
                      @dragleave="dragOverRowId = null"
                      @drop.prevent="onRowDrop(currentSection!._id, ri, $event)"
                    >
                      <!-- Row header -->
                      <div
                        class="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 bg-white/70 cursor-pointer select-none group"
                        draggable="true"
                        @click.stop="selectRow(row._id)"
                        @dragstart="onRowDragStart(row._id, currentSection!._id, $event)"
                        @dragend="onRowDragEnd"
                      >
                        <UIcon name="i-heroicons-bars-2" class="size-4 text-gray-300 shrink-0 cursor-grab" />
                        <UBadge size="xs" :color="row.layout === 'auto' ? 'neutral' : 'primary'" variant="subtle">
                          {{ row.layout === 'auto' ? 'Auto' : row.layout === 'flex' ? 'Flex' : `Grid ${row.cols ?? 2}` }}
                        </UBadge>
                        <span class="text-xs text-gray-400 flex-1">{{ row.fields.length }} field{{ row.fields.length !== 1 ? 's' : '' }}</span>
                        <UButton
                          size="xs" variant="ghost" color="error" icon="i-heroicons-trash"
                          class="opacity-0 group-hover:opacity-100 transition-opacity"
                          @click.stop="removeRow(currentSection!._id, row._id)"
                        />
                      </div>

                      <!-- Fields inside row -->
                      <div
                        class="p-2 grid gap-1 min-h-10 group/row"
                        style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))"
                        @dragover.prevent="dragOverSectionId = currentSection!._id; dragOverIndex = row.fields.length; dragOverRowId = row._id"
                        @dragleave="dragOverSectionId = null; dragOverIndex = null; dragOverRowId = null"
                        @drop.prevent="onDropToRow(currentSection!._id, row._id, row.fields.length, $event)"
                      >
                        <div
                          v-for="(field, fi) in row.fields"
                          :key="field._id"
                          class="group/field min-w-0 flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all text-xs"
                          :class="selectedId === field._id ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'"
                          draggable="true"
                          @click.stop="selectField(field._id)"
                          @dragstart="onCanvasDragStart(field._id, currentSection!._id, $event)"
                          @dragover.prevent.stop="dragOverSectionId = currentSection!._id; dragOverIndex = fi; dragOverRowId = row._id"
                          @drop.prevent.stop="onDropToRow(currentSection!._id, row._id, fi, $event)"
                        >
                          <UIcon name="i-heroicons-bars-2" class="size-3 text-gray-300 shrink-0 cursor-grab" />
                          <div class="min-w-0 flex-1">
                            <p class="font-medium text-gray-800 truncate">{{ field.label || field.name }}</p>
                            <p class="text-gray-400 flex items-center gap-1 truncate">
                              {{ field.component }}
                              <UBadge v-if="field._group" color="primary" variant="subtle" size="xs">{{ field._group }}</UBadge>
                              <span v-if="field.required" class="text-red-400">req</span>
                              <span v-if="duplicateNames.has(field.name)" class="text-orange-500 flex items-center gap-0.5">
                                <UIcon name="i-heroicons-exclamation-triangle" class="size-3" />dup
                              </span>
                            </p>
                          </div>
                          <UButton
                            size="xs" variant="ghost" color="neutral" icon="i-heroicons-document-duplicate"
                            class="opacity-0 group-hover/field:opacity-100 transition-opacity shrink-0"
                            @click.stop="duplicateField(field._id)"
                          />
                          <UButton
                            size="xs" variant="ghost" color="error" icon="i-heroicons-trash"
                            class="opacity-0 group-hover/field:opacity-100 transition-opacity shrink-0"
                            @click.stop="removeField(field._id)"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Between-rows drop zone -->
                    <div
                      class="h-1.5 rounded-full transition-colors"
                      :class="dragOverSectionId === currentSection?._id && dragOverIndex === ri + 1 && !dragOverRowId ? 'bg-primary-400' : 'bg-transparent'"
                      @dragover.prevent="dragOverSectionId = currentSection!._id; dragOverIndex = ri + 1; dragOverRowId = null"
                      @dragleave="onDragLeave"
                      @drop.prevent="onDropNewRow(currentSection!._id, ri + 1, $event)"
                    />
                  </template>

                  <!-- Add Row button -->
                  <div class="pt-1">
                    <UButton size="xs" variant="ghost" color="neutral" leading-icon="i-heroicons-plus" @click="addRow(currentSection!._id)">
                      <!-- Add Row -->
                       Add Container
                    </UButton>
                  </div>
                </template>
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
              @update:model-value="updateSelected({ colSpan: Number($event) })"
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
                        updateTableColumn(selectedField, Number(ci), {
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
                      @click="removeTableColumn(selectedField, Number(ci))"
                    />
                  </div>
                  <div class="flex gap-1.5">
                    <UInput
                      :model-value="col.key"
                      placeholder="key"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateTableColumn(selectedField, Number(ci), {
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
                        updateTableColumn(selectedField, Number(ci), {
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
                              Number(ci),
                              Number(oi),
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
                              Number(ci),
                              Number(oi),
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
                          @click="removeTableColOption(selectedField, Number(ci), Number(oi))"
                        />
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        leading-icon="i-heroicons-plus"
                        type="button"
                        @click="addTableColOption(selectedField, Number(ci))"
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
                        updateRepeaterField(selectedField, Number(ci), {
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
                      @click="removeRepeaterField(selectedField, Number(ci))"
                    />
                  </div>
                  <div class="flex gap-1.5">
                    <UInput
                      :model-value="col.key"
                      placeholder="key"
                      size="xs"
                      class="flex-1"
                      @update:model-value="
                        updateRepeaterField(selectedField, Number(ci), {
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
                        updateRepeaterField(selectedField, Number(ci), {
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
                              Number(ci),
                              Number(oi),
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
                              Number(ci),
                              Number(oi),
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
                            removeRepeaterFieldOption(selectedField, Number(ci), Number(oi))
                          "
                        />
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        leading-icon="i-heroicons-plus"
                        type="button"
                        @click="addRepeaterFieldOption(selectedField, Number(ci))"
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
