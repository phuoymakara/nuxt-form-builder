import { ref } from "vue";
import type { Ref, ComputedRef } from "vue";
import { makeField } from "~/pages/builder/config";
import type { CanvasField, CanvasRow, CanvasPage, PaletteItem } from "~/pages/builder/config";
import { newRow } from "~/utils/canvas-factories";

export function useBuilderDragDrop(params: {
  pages: Ref<CanvasPage[]>;
  currentPage: ComputedRef<CanvasPage>;
  activePageIdx: Ref<number>;
  activeSectionIdx: Ref<number>;
  selectedId: Ref<string | null>;
  rightPanel: Ref<"field" | "row" | "section" | "page" | null>;
  uid: () => string;
}) {
  const { pages, currentPage, activePageIdx, activeSectionIdx, selectedId, rightPanel, uid } = params;

  // Field drag state 
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

  // Row reorder drag & drop 
  const draggingRowId = ref<string | null>(null);
  const draggingRowSectionId = ref<string | null>(null);
  const dragOverRowId = ref<string | null>(null);

  function onRowDragStart(rowId: string, sectionId: string, e: DragEvent) {
    draggingRowId.value = rowId;
    draggingRowSectionId.value = sectionId;
    e.dataTransfer!.effectAllowed = "move";
    e.stopPropagation();
  }
  function onRowDragOver(rowId: string, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (draggingRowId.value) dragOverRowId.value = rowId;
  }
  function onRowDrop(sectionId: string, toRowIdx: number, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const srcRowId = draggingRowId.value;
    draggingRowId.value = null;
    dragOverRowId.value = null;
    if (!srcRowId || draggingRowSectionId.value !== sectionId) { draggingRowSectionId.value = null; return; }
    draggingRowSectionId.value = null;
    const section = currentPage.value.sections.find((s) => s._id === sectionId);
    if (!section) return;
    const fromIdx = section.rows.findIndex((r) => r._id === srcRowId);
    if (fromIdx < 0 || fromIdx === toRowIdx) return;
    const [row] = section.rows.splice(fromIdx, 1);
    section.rows.splice(fromIdx < toRowIdx ? toRowIdx - 1 : toRowIdx, 0, row);
  }
  function onRowDragEnd() {
    draggingRowId.value = null;
    draggingRowSectionId.value = null;
    dragOverRowId.value = null;
  }

  // Palette & canvas field drag 
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

  function _clearFieldDrag() {
    draggingFrom.value = null;
    draggingPaletteItem.value = null;
    draggingCanvasId.value = null;
    draggingCanvasSectionId.value = null;
  }

  function _isTabDragging() {
    return draggingPageIdx.value !== null
      || draggingSectionIdx.value !== null
      || draggingRowId.value !== null;
  }

  // Drop field INTO an existing row at a field index
  function onDropToRow(sectionId: string, rowId: string, fieldIndex: number, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragOverSectionId.value = null;
    dragOverIndex.value = null;
    if (_isTabDragging()) return;

    const targetSection = currentPage.value.sections.find((s) => s._id === sectionId);
    if (!targetSection) return;
    const targetRow = targetSection.rows.find((r) => r._id === rowId);
    if (!targetRow) return;

    if (draggingFrom.value === "palette" && draggingPaletteItem.value) {
      const newFields = makeField(draggingPaletteItem.value, targetRow.fields, uid);
      targetRow.fields.splice(fieldIndex, 0, ...newFields);
      selectedId.value = newFields[0]._id;
      rightPanel.value = "field";
    } else if (draggingFrom.value === "canvas" && draggingCanvasId.value) {
      const srcSection = currentPage.value.sections.find((s) => s._id === draggingCanvasSectionId.value);
      if (!srcSection) return;
      let srcRow: CanvasRow | undefined;
      for (const row of srcSection.rows) {
        if (row.fields.some((f) => f._id === draggingCanvasId.value)) { srcRow = row; break; }
      }
      if (!srcRow) return;
      const fromIdx = srcRow.fields.findIndex((f) => f._id === draggingCanvasId.value);
      if (fromIdx < 0) return;
      const [moved] = srcRow.fields.splice(fromIdx, 1);
      const insertAt = srcRow === targetRow && fromIdx < fieldIndex ? fieldIndex - 1 : fieldIndex;
      targetRow.fields.splice(Math.max(0, insertAt), 0, moved);
    }

    _clearFieldDrag();
  }

  // Drop field to CREATE a new row at a position in the section
  function onDropNewRow(sectionId: string, rowIdx: number, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragOverSectionId.value = null;
    dragOverIndex.value = null;
    if (_isTabDragging() || draggingFrom.value === null) return;

    const targetSection = currentPage.value.sections.find((s) => s._id === sectionId);
    if (!targetSection) return;

    const newFields: CanvasField[] = [];
    if (draggingFrom.value === "palette" && draggingPaletteItem.value) {
      newFields.push(...makeField(draggingPaletteItem.value, [], uid));
    } else if (draggingFrom.value === "canvas" && draggingCanvasId.value) {
      const srcSection = currentPage.value.sections.find((s) => s._id === draggingCanvasSectionId.value);
      if (srcSection) {
        for (const row of srcSection.rows) {
          const idx = row.fields.findIndex((f) => f._id === draggingCanvasId.value);
          if (idx >= 0) { const [moved] = row.fields.splice(idx, 1); newFields.push(moved); break; }
        }
      }
    }
    if (!newFields.length) return;

    const row = newRow();
    row.fields = newFields;
    targetSection.rows.splice(rowIdx, 0, row);

    if (draggingFrom.value === "palette") { selectedId.value = newFields[0]._id; rightPanel.value = "field"; }
    _clearFieldDrag();
  }

  // Alias for empty-section drop zone
  function onDrop(sectionId: string, _index: number, e: DragEvent) {
    onDropNewRow(sectionId, 0, e);
  }

  return {
    // field drag state (used in template for visual feedback)
    draggingFrom,
    draggingCanvasId,
    dragOverSectionId,
    dragOverIndex,
    // page tab dnd
    draggingPageIdx,
    dragOverPageIdx,
    onPageTabDragStart,
    onPageTabDragOver,
    onPageTabDrop,
    onPageTabDragEnd,
    // section tab dnd
    draggingSectionIdx,
    dragOverSectionTabIdx,
    onSectionTabDragStart,
    onSectionTabDragOver,
    onSectionTabDrop,
    onSectionTabDragEnd,
    // row dnd
    draggingRowId,
    dragOverRowId,
    onRowDragStart,
    onRowDragOver,
    onRowDrop,
    onRowDragEnd,
    // field dnd
    onPaletteDragStart,
    onCanvasDragStart,
    onDragOver,
    onDragLeave,
    onDropToRow,
    onDropNewRow,
    onDrop,
  };
}
