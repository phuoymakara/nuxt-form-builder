import { ref } from "vue";
import type { JSONFormConfig } from "~/utils/form-schema";

export interface SavedForm {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  config: JSONFormConfig;
}

const STORAGE_KEY = "nuxt-form-builder:saved-forms";

// shared reactive state across composable calls
const savedForms = ref<SavedForm[]>([]);

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    savedForms.value = raw ? JSON.parse(raw) : [];
  } catch {
    savedForms.value = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedForms.value));
}

export function useFormStorage() {
  // hydrate on first use
  if (savedForms.value.length === 0) load();

  function saveForm(config: JSONFormConfig, name?: string): SavedForm {
    const now = new Date().toISOString();
    const entry: SavedForm = {
      id: config.id,
      name: name ?? config.title,
      createdAt: now,
      updatedAt: now,
      config,
    };
    const idx = savedForms.value.findIndex((f) => f.id === config.id);
    if (idx >= 0) {
      savedForms.value[idx] = { ...entry, createdAt: savedForms.value[idx].createdAt };
    } else {
      savedForms.value.push(entry);
    }
    persist();
    return entry;
  }

  function loadForm(id: string): SavedForm | undefined {
    return savedForms.value.find((f) => f.id === id);
  }

  function deleteForm(id: string) {
    savedForms.value = savedForms.value.filter((f) => f.id !== id);
    persist();
  }

  function updateForm(id: string, patch: Partial<Pick<SavedForm, "name" | "config">>) {
    const idx = savedForms.value.findIndex((f) => f.id === id);
    if (idx < 0) return;
    savedForms.value[idx] = {
      ...savedForms.value[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    persist();
  }

  function refresh() {
    load();
  }

  return { savedForms, saveForm, loadForm, deleteForm, updateForm, refresh };
}
