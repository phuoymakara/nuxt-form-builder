import type { CanvasRow, CanvasSection, CanvasPage } from "~/pages/builder/config";

let _seq = 0;

export function uid(): string {
  return `id_${Date.now()}_${++_seq}`;
}

export function newRow(): CanvasRow {
  return { _id: uid(), layout: "auto", gap: "md", fields: [] };
}

export function newSection(title = "Section"): CanvasSection {
  return { _id: uid(), title, rows: [] };
}

export function newPage(title = "Step"): CanvasPage {
  return { _id: uid(), title, sections: [newSection("Section 1")] };
}
