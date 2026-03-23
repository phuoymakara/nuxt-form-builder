import type { FieldWithConditions } from "~/types/form-builder";

// -------------------------------------------------------------------
// Get column class based on colSpan
// -------------------------------------------------------------------
export const getColumnClass = (field: FieldWithConditions): string => {
  const colSpan = field.colSpan ?? 1; // Default to 1 column

  const colClasses: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  };

  // Mobile responsive - full width on small screens
  return `sm:${colClasses[colSpan] || "col-span-1"} col-span-12`;
};

// -------------------------------------------------------------------
// Get grid class based on columns in row
// -------------------------------------------------------------------
export const getGridClass = (rowNumber: number, length: number): string => {
  const gridClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return gridClasses[length] || "grid-cols-1";
};
