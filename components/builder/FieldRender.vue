<template>
  <div class="field-wrapper" :class="{ 'has-error': error }">
    <!-- Label -->
    <label v-if="field.label" :for="field.name" class="field-label">
      {{ field.label }}
      <span v-if="field.required" class="required-indicator">*</span>
    </label>

    <!-- Dynamic Component Rendering -->
    <component
      :is="getFieldComponent()"
      :id="field.name"
      :field="field"
      :model-value="modelValue"
      :disabled="disabled"
      :form-values="formValues"
      v-bind="getComponentProps()"
      @update:model-value="$emit('update:model-value', $event)"
      @file-change="$emit('file-change', $event)"
    />

    <!-- Error Message -->
    <p v-if="error" class="field-error">{{ error }}</p>

    <!-- Helper Text -->
    <p v-if="field?.hint && !error" class="field-hint">{{ field.hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FieldWithConditions } from '~/types/form-builder'
import { useFieldComponentRegistry } from '~/composables/useFieldComponentRegistry'

interface Props {
  field: FieldWithConditions
  modelValue?: any
  error?: string
  disabled?: boolean
  formValues?: Record<string, any>
}

const emit = defineEmits<{
  'update:model-value': [value: any]
  'file-change': [files: FileList | null]
}>()

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  formValues: () => ({}),
})

// ==========================================
// Component Registry
// ==========================================
const { getComponent } = useFieldComponentRegistry()

/**
 * Get the appropriate field component based on field type
 */
const getFieldComponent = () => {
  const componentName = props.field.component
  const component = getComponent(componentName)

  if (!component) {
    console.warn(`Component not found: ${componentName}`)
    return 'div'
  }

  return component
}

/**
 * Get component-specific props based on field type
 */
const getComponentProps = () => {
  const baseProps: Record<string, any> = {}

  // Add field options if available
  if (props.field.options) {
    if (typeof props.field.options === 'function') {
      baseProps.options = props.field.options(props.formValues)
      baseProps.items = props.field.options(props.formValues)
    } else {
      baseProps.options = props.field.options
      baseProps.items = props.field.options
    }
  }

  // Merge with field props
  if (props.field.props) {
    Object.assign(baseProps, props.field.props)
  }

  // Handle file input
  if (props.field.type === 'file' || props.field.component === 'UFileInput') {
    baseProps.multiple = props.field.props?.multiple ?? false
    baseProps.accept = props.field.props?.accept ?? ''
  }

  // Type for input elements
  if (props.field.type) {
    baseProps.type = props.field.type
  }

  return baseProps
}

/**
 * Handle file input changes
 * Emits to parent (FormBuilder) for processing
 */
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('file-change', target.files)
}
</script>

<style scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-wrapper.has-error {
  --color-red: #dc2626;
}

.field-label {
  display: block;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.required-indicator {
  color: #dc2626;
  margin-left: 0.25rem;
}

.field-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
}

.field-hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1rem;
  font-style: italic;
}

/* Style error inputs if needed */
.field-wrapper.has-error :deep(input),
.field-wrapper.has-error :deep(textarea),
.field-wrapper.has-error :deep(select) {
  border-color: #dc2626;
}
</style>