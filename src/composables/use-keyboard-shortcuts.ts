import { onMounted, onUnmounted, ref } from "vue";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const activeShortcuts = ref<KeyboardShortcut[]>(shortcuts);
  const isListening = ref(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isListening.value) return;

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of activeShortcuts.value) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrl === !!event.ctrlKey;
      const altMatches = !!shortcut.alt === !!event.altKey;
      const shiftMatches = !!shortcut.shift === !!event.shiftKey;
      const metaMatches = !!shortcut.meta === !!event.metaKey;

      if (
        keyMatches &&
        ctrlMatches &&
        altMatches &&
        shiftMatches &&
        metaMatches
      ) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  };

  const addShortcut = (shortcut: KeyboardShortcut) => {
    activeShortcuts.value.push(shortcut);
  };

  const removeShortcut = (key: string) => {
    const index = activeShortcuts.value.findIndex((s) => s.key === key);
    if (index !== -1) {
      activeShortcuts.value.splice(index, 1);
    }
  };

  const startListening = () => {
    isListening.value = true;
  };

  const stopListening = () => {
    isListening.value = false;
  };

  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.meta) parts.push("Cmd");

    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  };

  onMounted(() => {
    document.addEventListener("keydown", handleKeyDown);
    startListening();
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
    stopListening();
  });

  return {
    activeShortcuts,
    isListening,
    addShortcut,
    removeShortcut,
    startListening,
    stopListening,
    getShortcutDisplay,
  };
};

// Predefined common shortcuts for POS system
export const createPOSShortcuts = (callbacks: {
  focusBarcode?: () => void;
  removeOperator?: () => void;
  gotoOperatorSelection?: () => void;
  removeCustomer?: () => void;
  gotoCustomerSelection?: () => void;
  completeOrder?: () => void;
  abandonOrder?: () => void;
  openProducts?: () => void;
  openCustomers?: () => void;
  showHelp?: () => void;
  showOrderInfo?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (callbacks.focusBarcode) {
    shortcuts.push({
      key: "F1",
      description: "Focus barcode input",
      action: callbacks.focusBarcode,
    });
  }

  if (callbacks.removeOperator) {
    shortcuts.push({
      key: "F2",
      description: "Remove operator",
      action: callbacks.removeOperator,
    });
  }

  if (callbacks.gotoOperatorSelection) {
    shortcuts.push({
      key: "F3",
      description: "Operator selection",
      action: callbacks.gotoOperatorSelection,
    });
  }

  if (callbacks.removeCustomer) {
    shortcuts.push({
      key: "F4",
      description: "Remove customer",
      action: callbacks.removeCustomer,
    });
  }

  if (callbacks.gotoCustomerSelection) {
    shortcuts.push({
      key: "F5",
      description: "Customer selection",
      action: callbacks.gotoCustomerSelection,
    });
  }

  if (callbacks.completeOrder) {
    shortcuts.push({
      key: "F6",
      description: "Complete order / Go to checkout",
      action: callbacks.completeOrder,
    });
  }

  if (callbacks.abandonOrder) {
    shortcuts.push({
      key: "F7",
      description: "Abandon order",
      action: callbacks.abandonOrder,
    });
  }

  if (callbacks.openProducts) {
    shortcuts.push({
      key: "l",
      alt: true,
      shift: true,
      description: "Open products",
      action: callbacks.openProducts,
    });
  }

  if (callbacks.openCustomers) {
    shortcuts.push({
      key: "u",
      alt: true,
      shift: true,
      description: "Open customers",
      action: callbacks.openCustomers,
    });
  }

  if (callbacks.showOrderInfo) {
    shortcuts.push({
      key: "o",
      alt: true,
      shift: true,
      description: "Show order details",
      action: callbacks.showOrderInfo,
    });
  }

  if (callbacks.showHelp) {
    shortcuts.push({
      key: "?",
      shift: true,
      description: "Show help",
      action: callbacks.showHelp,
    });
  }

  return shortcuts;
};
