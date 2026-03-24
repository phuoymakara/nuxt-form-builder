import type { Component } from "vue";
import BaseDatePicker from "~/components/base/date-picker.vue";
import BaseAddress from "~/components/base/address.vue";
import BaseAsyncSelect from "~/components/base/asyn-select.vue";
import { resolveComponentMap } from "~/utils/ui-helper";
// import BaseFileInput from '~/components/form/BaseFileInput.vue'

/**
 * Component registry for all form field types
 * Map component names to actual Vue components
 */
const componentRegistry: Map<string, Component> = new Map();

/**
 * Initialize default components
 */
const initializeDefaults = () => {
  // Custom components
  componentRegistry.set("UCalendar", BaseDatePicker);
  componentRegistry.set("UAddress", BaseAddress);
  componentRegistry.set("UAsyncSelect", BaseAsyncSelect);
  // componentRegistry.set('UFileInput', BaseFileInput)

  // Nuxt UI components - these will be resolved dynamically
  // We import them from 'nuxt-ui' package which auto-imports them
  componentRegistry.set("UInput", resolveNuxtUIComponent("UInput"));
  componentRegistry.set("UTextarea", resolveNuxtUIComponent("UTextarea"));
  componentRegistry.set("USelect", resolveNuxtUIComponent("USelect"));
  componentRegistry.set("URadioGroup", resolveNuxtUIComponent("URadioGroup"));
  componentRegistry.set(
    "UCheckboxGroup",
    resolveNuxtUIComponent("UCheckboxGroup"),
  );
  componentRegistry.set("USwitch", resolveNuxtUIComponent("USwitch"));
  componentRegistry.set("UToggle", resolveNuxtUIComponent("UToggle"));
  componentRegistry.set("UFileUpload", resolveNuxtUIComponent("UFileUpload"));
  // componentRegistry.set('UFileInput', BaseFileInput)
};

/**
 * Resolve Nuxt UI components
 * Since Nuxt UI uses auto-imports, we can resolve them globally
 */
const resolveNuxtUIComponent = (componentName: string): Component => {
  // Return as string - Nuxt will resolve it via auto-imports
  return resolveComponentMap[componentName] || componentName;
};

/**
 * Initialize on first use
 */
let initialized = false;

const ensureInitialized = () => {
  if (!initialized) {
    initializeDefaults();
    initialized = true;
  }
};

/**
 * Main composable
 */
export const useFieldComponentRegistry = () => {
  ensureInitialized();

  /**
   * Get component by name
   */
  const getComponent = (componentName: string): Component | null => {
    const component = componentRegistry.get(componentName);
    if (!component) {
      console.warn(`⚠️ Component "${componentName}" not found in registry`);
      return null;
    }
    return component;
  };

  /**
   * Register new component
   */
  const registerComponent = (name: string, component: Component): void => {
    componentRegistry.set(name, component);
  };

  /**
   * Register multiple components
   */
  const registerComponents = (components: Record<string, Component>): void => {
    Object.entries(components).forEach(([name, component]) => {
      componentRegistry.set(name, component);
    });
  };

  /**
   * Unregister component
   */
  const unregisterComponent = (name: string): boolean => {
    return componentRegistry.delete(name);
  };

  /**
   * Get all registered components
   */
  const getAllComponents = (): Record<string, Component> => {
    const result: Record<string, Component> = {};
    componentRegistry.forEach((component, name) => {
      result[name] = component;
    });
    return result;
  };

  /**
   * Check if component is registered
   */
  const hasComponent = (name: string): boolean => {
    return componentRegistry.has(name);
  };

  return {
    getComponent,
    registerComponent,
    registerComponents,
    unregisterComponent,
    getAllComponents,
    hasComponent,
  };
};
