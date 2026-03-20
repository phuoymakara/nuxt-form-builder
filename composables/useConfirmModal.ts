import { ref, reactive } from "vue";

export interface ConfirmModalOptions {
  title: string;
  description?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nuxt UI color for the confirm button — default "error" */
  confirmColor?: "error" | "primary" | "warning" | "success" | "neutral";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// module-level singleton — shared across all composable calls
const open = ref(false);
const options = ref<ConfirmModalOptions | null>(null);
const loading = ref(false);

export function useConfirmModal() {
  function openConfirm(opts: ConfirmModalOptions) {
    options.value = opts;
    open.value = true;
  }

  function close() {
    open.value = false;
    loading.value = false;
  }

  async function confirm() {
    if (!options.value) return;
    loading.value = true;
    try {
      await options.value.onConfirm();
    } finally {
      close();
    }
  }

  function cancel() {
    options.value?.onCancel?.();
    close();
  }

  return { open, options, loading, openConfirm, confirm, cancel };
}