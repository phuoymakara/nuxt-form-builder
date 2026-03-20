import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import type { FieldWithConditions } from "~/types/form-builder";
import FormRenderer from "./FormRenderer.vue";

export default class FormBuilder {
  private fields: FieldWithConditions[] = [];
  private rowCounter = 0;

  // single full-width field, auto-increments row
  addField(
    field: Omit<FieldWithConditions, "row" | "colSpan"> & {
      row?: number;
      colSpan?: number;
    },
  ): this {
    this.rowCounter++;
    this.fields.push({
      ...field,
      row: field.row ?? this.rowCounter,
      colSpan: field.colSpan ?? 12,
    } as FieldWithConditions);
    return this;
  }

  // multiple fields on same row, last field absorbs remainder to sum 12
  addRow(
    fields: Array<
      Omit<FieldWithConditions, "row" | "colSpan"> & { colSpan?: number }
    >,
  ): this {
    this.rowCounter++;
    const defaultSpan = Math.floor(12 / fields.length);

    fields.forEach((field, i) => {
      const isLast = i === fields.length - 1;
      const colSpan =
        field.colSpan ??
        (isLast ? 12 - defaultSpan * (fields.length - 1) : defaultSpan);

      this.fields.push({
        ...field,
        row: this.rowCounter,
        colSpan,
      } as FieldWithConditions);
    });

    return this;
  }

  // returns a Vue component ready to use in template
  build() {
    const fields = [...this.fields];

    return defineComponent({
      name: "DynamicForm",
      props: {
        initialValues: {
          type: Object as PropType<Record<string, any>>,
          default: () => ({}),
        },
      },
      emits: ["submit", "change"],
      setup(props, { emit, slots }) {
        return () =>
          h(
            FormRenderer,
            {
              fields,
              initialValues: props.initialValues,
              onSubmit: (data: any) => emit("submit", data),
              onChange: (field: string, value: any) =>
                emit("change", field, value),
            },
            slots,
          );
      },
    });
  }
}
