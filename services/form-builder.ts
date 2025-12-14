import { z } from "zod";
import type { FormConfig, FormPage } from "~/constants/form-builder";
import type { FieldWithConditions } from "~/types/form-builder";

/**
 * FormBuilder - Builds and manages Zod schema from FormConfig
 * Provides type-safe validation schema generation
 */
export class FormBuilder {
  private config: FormConfig;
  private schemaMap: Map<string, z.ZodTypeAny> = new Map();

  constructor(config: FormConfig) {
    this.config = config;
    this.buildSchemas();
  }

  /**
   * Build all field schemas from config
   */
  private buildSchemas(): void {
    const fields = this.getAllFields();
    fields.forEach((field) => {
      this.schemaMap.set(field.name, field.validation);
    });
  }

  /**
   * Get all fields from all pages and sections
   */
  private getAllFields(): FieldWithConditions[] {
    const fields: FieldWithConditions[] = [];

    this.config.pages.forEach((page) => {
      // Handle flat fields (legacy)
      if (page.fields) {
        fields.push(...page.fields);
      }

      // Handle sections
      if (page.sections) {
        page.sections.forEach((section) => {
          fields.push(...section.fields);
        });
      }
    });

    return fields;
  }

  /**
   * Get Zod schema for entire form
   */
  getFormSchema(): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};

    this.schemaMap.forEach((schema, fieldName) => {
      shape[fieldName] = schema;
    });

    return z.object(shape);
  }

  /**
   * Get schema for specific page
   */
  getPageSchema(pageId: string): z.ZodObject<any> | null {
    const page = this.config.pages.find((p) => p.id === pageId);
    if (!page) return null;

    const shape: Record<string, z.ZodTypeAny> = {};

    const fields = this.getPageFields(page);
    fields.forEach((field) => {
      const schema = this.schemaMap.get(field.name);
      if (schema) {
        shape[field.name] = schema;
      }
    });

    return z.object(shape);
  }

  /**
   * Get all fields for a specific page
   */
  private getPageFields(page: FormPage): FieldWithConditions[] {
    const fields: FieldWithConditions[] = [];

    if (page.fields) {
      fields.push(...page.fields);
    }

    if (page.sections) {
      page.sections.forEach((section) => {
        fields.push(...section.fields);
      });
    }

    return fields;
  }

  /**
   * Get schema for specific field
   */
  getFieldSchema(fieldName: string): z.ZodTypeAny | undefined {
    return this.schemaMap.get(fieldName);
  }

  /**
   * Get all form fields
   */
  getAllFormFields(): FieldWithConditions[] {
    return this.getAllFields();
  }

  /**
   * Get all form fields with default values injected into props
   */
  getAllFormFieldsWithDefaults(
    data?: Record<string, any>,
  ): FieldWithConditions[] {
    const valuesBuilder = new InitialValuesBuilder(this.config);
    const initialValues = data
      ? valuesBuilder.getEditInitialValues(data)
      : valuesBuilder.getInitialValues();

    return this.getAllFields().map((field) => ({
      ...field,
      props: {
        ...field.props,
        defaultValue: initialValues[field.name],
      },
    }));
  }

  /**
   * Get field by name
   */
  getField(fieldName: string): FieldWithConditions | undefined {
    return this.getAllFields().find((f) => f.name === fieldName);
  }

  /**
   * Get field by name with default value injected
   */
  getFieldWithDefault(
    fieldName: string,
    data?: Record<string, any>,
  ): FieldWithConditions | undefined {
    const valuesBuilder = new InitialValuesBuilder(this.config);
    const initialValues = data
      ? valuesBuilder.getEditInitialValues(data)
      : valuesBuilder.getInitialValues();

    const field = this.getAllFields().find((f) => f.name === fieldName);
    if (!field) return undefined;

    return {
      ...field,
      props: {
        ...field.props,
        defaultValue: initialValues[fieldName],
      },
    };
  }

  /**
   * Get schema shape for type inference
   */
  getSchemaShape(): Record<string, z.ZodTypeAny> {
    const shape: Record<string, z.ZodTypeAny> = {};
    this.schemaMap.forEach((schema, fieldName) => {
      shape[fieldName] = schema;
    });
    return shape;
  }
}

/**
 * InitialValuesBuilder - Generates type-safe initial values from FormConfig
 * Supports both create (defaults from config) and edit (user data) modes
 */
export class InitialValuesBuilder {
  private config: FormConfig;
  private builder: FormBuilder;

  constructor(config: FormConfig) {
    this.config = config;
    this.builder = new FormBuilder(config);
  }

  /**
   * Generate initial values for CREATE mode (use config defaults)
   */
  getInitialValues(): Record<string, any> {
    const fields = this.builder.getAllFormFields();
    const values: Record<string, any> = {};

    fields.forEach((field) => {
      values[field.name] = this.getFieldDefaultValue(field);
    });

    return values;
  }

  /**
   * Generate initial values for EDIT mode (merge user data with defaults)
   * User data takes precedence over config defaults
   *
   * @param userData - Existing data from API/database
   * @returns Merged initial values with all fields populated
   */
  getEditInitialValues(userData: Record<string, any>): Record<string, any> {
    const defaultValues = this.getInitialValues();

    // Merge: defaults first, then override with user data
    const merged: Record<string, any> = {
      ...defaultValues,
      ...userData,
    };

    return merged;
  }

  /**
   * Get type-safe initial values
   * Usage: const values = builder.getTypedInitialValues<typeof yourType>();
   */
  getTypedInitialValues<T = Record<string, any>>(): T {
    return this.getInitialValues() as T;
  }

  /**
   * Get type-safe edit initial values
   * Usage: const values = builder.getTypedEditInitialValues<typeof yourType>(userData);
   */
  getTypedEditInitialValues<T = Record<string, any>>(
    userData: Record<string, any>,
  ): T {
    return this.getEditInitialValues(userData) as T;
  }

  /**
   * Get default value for a specific field based on component type and validation
   */
  private getFieldDefaultValue(field: FieldWithConditions): any {
    const schema = this.builder.getFieldSchema(field.name);

    // Priority 1: Check if field has defaultValue in props
    if (field.props?.defaultValue !== undefined) {
      return field.props.defaultValue;
    }

    // Priority 2: Handle different component types
    switch (field.component) {
      case "UCheckboxGroup":
      case "UCheckbox":
        return [];

      case "URadioGroup":
      case "USelect":
      case "UAsyncSelect":
      case "USelectMenu":
        return this.isOptionalField(schema) ? null : "";

      case "UFileInput":
      case "UFileUpload":
        return null;

      case "UCalendar":
      case "UDatePicker":
        return null;

      case "UTextarea":
      case "UInput":
      default:
        if (field.type === "number") {
          return null;
        }
        return this.isOptionalField(schema) ? "" : "";
    }
  }

  /**
   * Check if a Zod schema is optional or nullable
   */
  private isOptionalField(schema: z.ZodTypeAny | undefined): boolean {
    if (!schema) return true;
    return schema instanceof z.ZodOptional || schema instanceof z.ZodNullable;
  }

  /**
   * Get initial values for specific page only
   */
  getPageInitialValues(pageId: string): Record<string, any> {
    const page = this.config.pages.find((p) => p.id === pageId);
    if (!page) return {};

    const values: Record<string, any> = {};
    const fields = this.getPageFields(page);

    fields.forEach((field) => {
      values[field.name] = this.getFieldDefaultValue(field);
    });

    return values;
  }

  /**
   * Get page initial values for EDIT mode
   */
  getPageEditInitialValues(
    pageId: string,
    userData: Record<string, any>,
  ): Record<string, any> {
    const defaultValues = this.getPageInitialValues(pageId);
    return {
      ...defaultValues,
      ...userData,
    };
  }

  /**
   * Get initial values as properly typed object
   * Can be used with Zod's parse method
   */
  getValidatedInitialValues(): Record<string, any> {
    const schema = this.builder.getFormSchema();
    const initialValues = this.getInitialValues();

    try {
      return schema.parse(initialValues);
    } catch (error) {
      console.warn(
        "Initial values validation failed, returning defaults",
        error,
      );
      return initialValues;
    }
  }

  /**
   * Get validated edit initial values
   */
  getValidatedEditInitialValues(
    userData: Record<string, any>,
  ): Record<string, any> {
    const schema = this.builder.getFormSchema();
    const initialValues = this.getEditInitialValues(userData);

    try {
      return schema.parse(initialValues);
    } catch (error) {
      console.warn(
        "Edit initial values validation failed, returning merged values",
        error,
      );
      return initialValues;
    }
  }

  /**
   * Get page fields
   */
  private getPageFields(page: FormPage): FieldWithConditions[] {
    const fields: FieldWithConditions[] = [];

    if (page.fields) {
      fields.push(...page.fields);
    }

    if (page.sections) {
      page.sections.forEach((section) => {
        fields.push(...section.fields);
      });
    }

    return fields;
  }
}

// ============================================================================
// COMPOSABLE: useFormBuilder
// ============================================================================

/**
 * Composable for easy form management
 * Handles both CREATE and EDIT modes
 */
export const useFormBuilder = (
  config: FormConfig,
  mode: "create" | "edit" = "create",
  editData?: Record<string, any>,
) => {
  const builder = new FormBuilder(config);
  const valuesBuilder = new InitialValuesBuilder(config);

  // Get initial values based on mode
  const getInitialFormValues = () => {
    if (mode === "edit" && editData) {
      return valuesBuilder.getEditInitialValues(editData);
    }
    return valuesBuilder.getInitialValues();
  };

  // Get page initial values based on mode
  const getPageValues = (pageId: string) => {
    if (mode === "edit" && editData) {
      return valuesBuilder.getPageEditInitialValues(pageId, editData);
    }
    return valuesBuilder.getPageInitialValues(pageId);
  };

  // Get config with default values injected
  const getConfigWithDefaults = (): FormConfig => {
    const fieldsWithDefaults = builder.getAllFormFieldsWithDefaults(editData);

    return {
      ...config,
      pages: config.pages.map((page) => ({
        ...page,
        fields: page.fields?.map(
          (f) => fieldsWithDefaults.find((fd) => fd.name === f.name) || f,
        ),
        sections: page.sections?.map((section) => ({
          ...section,
          fields: section.fields.map(
            (f) => fieldsWithDefaults.find((fd) => fd.name === f.name) || f,
          ),
        })),
      })),
    };
  };

  return {
    // Schemas
    getFormSchema: () => builder.getFormSchema(),
    getPageSchema: (pageId: string) => builder.getPageSchema(pageId),
    getFieldSchema: (fieldName: string) => builder.getFieldSchema(fieldName),

    // Initial Values
    getInitialValues: getInitialFormValues,
    getPageValues,
    getField: (fieldName: string) => builder.getField(fieldName),
    getAllFields: () => builder.getAllFormFields(),
    getAllFormFieldsWithDefaults: (data?: Record<string, any>) =>
      builder.getAllFormFieldsWithDefaults(data),

    // Config with defaults
    getConfig: () => config,
    getConfigWithDefaults,
    getFieldWithDefault: (fieldName: string) =>
      builder.getFieldWithDefault(fieldName, editData),

    // Utilities
    isEditMode: mode === "edit",
    mode,
    config,
  };
};
