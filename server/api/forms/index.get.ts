import { formTemplates } from "./_data";

export default defineEventHandler(() => {
  return formTemplates.map(({ id, title, description, pages }) => ({
    id,
    title,
    description,
    pageCount: pages.length,
  }));
});
