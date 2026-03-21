<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Render fields by row -->
    <div
      v-for="rowNumber in uniqueRows"
      :key="rowNumber"
      class="grid gap-6"
      :class="getGridClass(rowNumber)"
    >
      <!-- Render each field in the row -->
      <BuilderFieldRender
        v-for="field in fieldsByRow(rowNumber)"
        :key="field.name"
        :field="field"
        :model-value="values[field.name]"
        :error="errors[field.name]"
        :disabled="isFieldDisabled(field)"
        :form-values="values"
        @update:model-value="handleFieldChange($event, field)"
        @file-change="handleFileChange($event, field)"
      />
    </div>

    <!-- Form Actions Slot -->
    <slot name="actions" :is-valid="isValid" :values="values">
      <button type="submit" class="btn btn-primary" :disabled="!isValid">
        Submit
      </button>
    </slot>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ZodError, type ZodTypeAny } from 'zod'
import type { FieldWithConditions, ObjectGeneric } from '~/types/form-builder'

interface Props {
  modelValue?: Record<string, any>
  fields: FieldWithConditions[]
}

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  validate: [payload: any]
  submit: [values: Record<string, any>]
  error: [errors: Record<string, string>]
}>()

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
})

// ==========================================
// State
// ==========================================
const values = ref<ObjectGeneric>({})
const errors = ref<ObjectGeneric>({})
const addressFieldRefs = ref<Record<string, any>>({})

// ==========================================
// Initialize Form Values
// ==========================================
const initializeValues = () => {
  props.fields.forEach((field) => {
    let defaultValue: any

    if (props.modelValue?.[field.name] !== undefined) {
      defaultValue = props.modelValue[field.name]
    } else if (field.defaultValue && typeof field.defaultValue === 'function') {
      defaultValue = field.defaultValue(values.value)
    } else if (field.props?.defaultValue !== undefined) {
      defaultValue = field.props.defaultValue
    } else if (field.props?.value !== undefined) {
      defaultValue = field.props.value
    } else if (field.component === 'UCheckboxGroup') {
      defaultValue = []
    } else {
      defaultValue = ''
    }

    values.value[field.name] = defaultValue
  })
}

initializeValues()

// ==========================================
// Watchers
// ==========================================
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(values.value, newVal)
    }
  }
)

watch(values, (newVal) => {
  emit('update:modelValue', { ...newVal })
}, { deep: true })

// ==========================================
// Computed Properties
// ==========================================
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.hidden) return true
    return !field.hidden(values.value)
  })
})

const uniqueRows = computed(() => {
  const rows = new Set<number>()
  visibleFields.value.forEach((field) => {
    const rowNum = field.row ?? 0
    rows.add(rowNum)
  })
  return Array.from(rows).sort((a, b) => a - b)
})

const isValid = computed(() => {
  return Object.values(errors.value).every((v) => v === undefined)
})

// ==========================================
// Grid Layout
// ==========================================
const fieldsByRow = (rowNumber: number): FieldWithConditions[] => {
  return visibleFields.value.filter((field) => (field.row ?? 0) === rowNumber)
}

const getGridClass = (rowNumber: number): string => {
  const fieldsInRow = fieldsByRow(rowNumber).length
  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }
  return gridClasses[fieldsInRow] || 'grid-cols-1'
}

// ==========================================
// Field State Management
// ==========================================
const isFieldDisabled = (field: FieldWithConditions): boolean => {
  if (!field.disabled) return false
  return field.disabled(values.value)
}

const getFieldOptions = (field: FieldWithConditions) => {
  if (field.options && typeof field.options === 'function') {
    return field.options(values.value)
  }
  return field.props?.options || []
}

// ==========================================
// Validation
// ==========================================
const validateField = (
  name: string,
  value: any,
  validator?: ZodTypeAny
): { valid: boolean; message?: string } => {
  if (!validator) return { valid: true }

  try {
    validator.parse(value)
    return { valid: true }
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        valid: false,
        message: e.issues[0].message,
      }
    }
  }
  return { valid: false, message: 'Invalid value' }
}

const validateAll = (): boolean => {
  let allValid = true

  visibleFields.value.forEach((field) => {
    const { valid, message } = validateField(
      field.name,
      values.value[field.name],
      field.validation
    )
    if (!valid) allValid = false
    errors.value[field.name] = valid ? undefined : message
  })

  return allValid
}

// ==========================================
// Field Change Handlers (ALL LOGIC HERE)
// ==========================================
const handleFieldChange = (value: any, field: FieldWithConditions) => {
  // Handle checkbox groups
  if (field.component === 'UCheckboxGroup' && !Array.isArray(value)) {
    value = [value]
  }

  // Handle address special case
  if (
    field.component === 'UAddress' &&
    typeof value === 'object' &&
    value !== null &&
    value.code
  ) {
    // Keep as object
  }

  values.value[field.name] = value

  // Handle dependencies
  clearDependentFields(field.name)
  applyDependentDefaults()

  // Validate
  const { valid, message } = validateField(
    field.name,
    value,
    field.validation
  )
  errors.value[field.name] = valid ? undefined : message

  // Emit validation event
  emit('validate', {
    field: field.name,
    valid,
    message,
    values: { ...values.value },
  })
}

const handleFileChange = (files: FileList | null, field: FieldWithConditions) => {
  let finalValue: any = null

  if (files && files.length > 0) {
    const allowMultiple = field.props?.multiple ?? false
    finalValue = allowMultiple ? Array.from(files) : files[0]
  }

  values.value[field.name] = finalValue

  // Handle dependencies
  clearDependentFields(field.name)
  applyDependentDefaults()

  // Validate
  const { valid, message } = validateField(
    field.name,
    finalValue,
    field.validation
  )
  errors.value[field.name] = valid ? undefined : message

  // Emit validation event
  emit('validate', {
    field: field.name,
    valid,
    message,
    values: { ...values.value },
  })
}

// ==========================================
// Dependent Fields Management
// ==========================================
const clearDependentFields = (changedFieldName: string) => {
  props.fields.forEach((field) => {
    if (field.dependsOn?.includes(changedFieldName)) {
      const shouldClear = field.clearOnChange !== false

      if (shouldClear) {
        const emptyValue = field.component === 'UCheckboxGroup' ? [] : ''
        values.value[field.name] = emptyValue
        errors.value[field.name] = undefined
      }
    }
  })
}

const applyDependentDefaults = () => {
  props.fields.forEach((field) => {
    if (field.defaultValue && typeof field.defaultValue === 'function') {
      const currentValue = values.value[field.name]
      const newDefault = field.defaultValue(values.value)

      if (newDefault !== undefined && (currentValue === '' || currentValue === null)) {
        values.value[field.name] = newDefault
      }
    }
  })
}

// ==========================================
// Form Submission
// ==========================================
const handleSubmit = () => {
  const allValid = validateAll()

  if (allValid) {
    emit('submit', { ...values.value })
  } else {
    emit('error', {//@ts-ignore
      errors: Object.entries(errors.value)
        .filter(([, error]) => error !== undefined)
        .reduce((acc, [field, error]) => {
          acc[field] = error
          return acc
        }, {} as Record<string, string>),
    })
  }
}

// ==========================================
// Public API
// ==========================================
defineExpose({
  validateAll,
  submit: handleSubmit,
  values,
  errors,
})
</script>