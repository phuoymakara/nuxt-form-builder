import { formTemplates } from "../forms/_data";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  const template = formTemplates.find((f) => f.id === id);

  if (!template) {
    throw createError({ statusCode: 404, message: `Form "${id}" not found` });
  }

  return template;
});
