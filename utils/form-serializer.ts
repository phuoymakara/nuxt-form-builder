import type { JSONField, JSONFormConfig, JSONSection } from "~/utils/form-schema";
import type { CanvasField, CanvasRow, CanvasPage } from "~/pages/builder/config";

export function toJSONField(f: CanvasField): JSONField {
  const { _id, _group, ...rest } = f;
  return rest as JSONField;
}

export function toJSONRow(row: CanvasRow) {
  return {
    id: row._id,
    layout: row.layout,
    cols: row.cols,
    gap: row.gap,
    fields: row.fields.map(toJSONField),
  };
}

export function buildConfig(
  pages: CanvasPage[],
  formId: string,
  formTitle: string,
  isMultiStep: boolean,
): JSONFormConfig {
  const jsonPages = pages.map((page) => ({
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
          rows: sec.rows.map(toJSONRow),
        }) as JSONSection,
    ),
  }));

  return {
    id: formId,
    title: formTitle,
    pages: isMultiStep ? jsonPages : [jsonPages[0]],
  };
}
