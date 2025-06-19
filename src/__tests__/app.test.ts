import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentPublicInstance } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "../app.vue";

// Type for App component instance
interface AppInstance extends ComponentPublicInstance {
  barcode: string;
  clock: string;
  showHelpDialog: boolean;
  isHome: boolean;
  getSyncStatus: (dbName: string) => {
    text: string;
    color: string;
    textColor: string;
    icon: string;
  };
  addProduct: () => Promise<void>;
  completeOrder: () => Promise<void>;
  abandonOrder: () => Promise<void>;
  clearOperator: () => void;
  clearCustomer: () => void;
  selectOperator: () => void;
  selectCustomer: () => void;
  openProducts: () => void;
  openCustomers: () => void;
  openOrders: () => void;
  showHelp: () => void;
}

vi.mock("../composables/use-keyboard-shortcuts", () => ({
  createPOSShortcuts: vi.fn(() => ({})),
  useKeyboardShortcuts: vi.fn(),
}));

// Mock child components to avoid complex dependencies
vi.mock("../components/app-modal.vue", () => ({
  default: {
    name: "AppModal",
    template: '<div data-test="app-modal"></div>',
  },
}));

vi.mock("../components/help-dialog.vue", () => ({
  default: {
    name: "HelpDialog",
    template: '<div data-test="help-dialog"></div>',
  },
}));

vi.mock("../components/setup-loading.vue", () => ({
  default: {
    name: "SetupLoading",
    template: '<div data-test="setup-loading"></div>',
  },
}));

vi.mock("../components/toast-container.vue", () => ({
  default: {
    name: "ToastContainer",
    template: '<div data-test="toast-container"></div>',
  },
}));

// Mock store modules
const mockProductStore = {
  findProductByBarcode: vi.fn(),
};

const mockOrderStore = {
  id: "",
  addProduct: vi.fn(),
  complete: vi.fn(),
  abandon: vi.fn(),
  values: [],
  total: 0,
};

const mockOnlineStatusStore = {
  isOnline: true,
  isSyncEnabled: true,
};

const mockOperatorStore = {
  clearOperator: vi.fn(),
  operatorId: "",
  operatorName: "",
};

const mockCustomerStore = {
  clearCustomer: vi.fn(),
  customerId: "",
  customerName: "",
};

const mockNotificationStore = {
  showWarning: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showConfirm: vi.fn(),
  toasts: [],
};

const mockSetupStore = {
  shouldBlockUI: vi.fn(() => false),
  initializeSystem: vi.fn(() => Promise.resolve()),
};

vi.mock("../stores/product-store", () => ({
  useProductStore: () => mockProductStore,
}));

vi.mock("../stores/order-store", () => ({
  useOrderStore: () => mockOrderStore,
}));

vi.mock("../stores/online-status-store", () => ({
  useOnlineStatusStore: () => mockOnlineStatusStore,
}));

vi.mock("../stores/operator-store", () => ({
  useOperatorStore: () => mockOperatorStore,
}));

vi.mock("../stores/customer-store", () => ({
  useCustomerStore: () => mockCustomerStore,
}));

vi.mock("../stores/notification-store", () => ({
  useNotificationStore: () => mockNotificationStore,
}));

vi.mock("../stores/setup-store", () => ({
  useSetupStore: () => mockSetupStore,
}));

describe("App Component", () => {
  let wrapper: ReturnType<typeof mount>;
  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create router with minimal routes
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: "/", component: { template: "<div>Home</div>" } },
        { path: "/products", component: { template: "<div>Products</div>" } },
        { path: "/customers", component: { template: "<div>Customers</div>" } },
        { path: "/operators", component: { template: "<div>Operators</div>" } },
        { path: "/orders", component: { template: "<div>Orders</div>" } },
      ],
    });

    pinia = createPinia();

    // Mock timers for clock functionality
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-18T10:30:45.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const mountComponent = async () => {
    wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: {
          RouterView: true,
        },
      },
    });
    await router.isReady();
    return wrapper;
  };

  describe("Component Mount and Setup", () => {
    it("should mount without errors", async () => {
      await mountComponent();
      expect(wrapper.exists()).toBe(true);
    });

    it("should not show setup loading when shouldBlockUI returns false", async () => {
      mockSetupStore.shouldBlockUI.mockReturnValue(false);
      await mountComponent();

      expect(wrapper.find('[data-test="setup-loading"]').exists()).toBe(false);
    });

    it("should show setup loading when shouldBlockUI returns true", async () => {
      mockSetupStore.shouldBlockUI.mockReturnValue(true);
      await mountComponent();

      expect(wrapper.find('[data-test="setup-loading"]').exists()).toBe(true);
    });

    it("should initialize system on mount", async () => {
      await mountComponent();
      expect(mockSetupStore.initializeSystem).toHaveBeenCalled();
    });
  });

  describe("Database Status", () => {
    it("should compute database status correctly when online and sync enabled", async () => {
      mockOnlineStatusStore.isOnline = true;
      mockOnlineStatusStore.isSyncEnabled = true;

      await mountComponent();

      // Access the component's computed properties through vm
      const vm = wrapper.vm as AppInstance;
      const status = vm.getSyncStatus("products");

      expect(status).toEqual({
        text: "Ready",
        color: "bg-green-400",
        textColor: "text-green-700",
        icon: "↕",
      });
    });

    it("should show offline status when not online", async () => {
      mockOnlineStatusStore.isOnline = false;
      mockOnlineStatusStore.isSyncEnabled = true;

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const status = vm.getSyncStatus("products");

      expect(status).toEqual({
        text: "Offline",
        color: "bg-yellow-400",
        textColor: "text-yellow-700",
        icon: "●",
      });
    });

    it("should show disabled status when sync is disabled", async () => {
      mockOnlineStatusStore.isOnline = true;
      mockOnlineStatusStore.isSyncEnabled = false;

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const status = vm.getSyncStatus("products");

      expect(status).toEqual({
        text: "Disabled",
        color: "bg-gray-400",
        textColor: "text-gray-700",
        icon: "●",
      });
    });

    it("should show push only status for orders database", async () => {
      mockOnlineStatusStore.isOnline = true;
      mockOnlineStatusStore.isSyncEnabled = true;

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const status = vm.getSyncStatus("orders");

      expect(status).toEqual({
        text: "Push Only",
        color: "bg-blue-400",
        textColor: "text-blue-700",
        icon: "↑",
      });
    });
  });

  describe("Barcode Functionality", () => {
    it("should add product when valid barcode is entered", async () => {
      const mockProduct = {
        _id: "prod1",
        name: "Test Product",
        barcode: "123456789",
        price: 10.99,
        stock: 50,
      };

      mockProductStore.findProductByBarcode.mockResolvedValue(mockProduct);

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.barcode = "123456789";
      await vm.addProduct();

      expect(mockProductStore.findProductByBarcode).toHaveBeenCalledWith(
        "123456789"
      );
      expect(mockOrderStore.addProduct).toHaveBeenCalledWith(mockProduct);
      expect(mockNotificationStore.showSuccess).toHaveBeenCalledWith(
        "Product Added",
        "Test Product added to order"
      );
      expect(vm.barcode).toBe("");
    });

    it("should show warning when barcode is empty", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.barcode = "";
      await vm.addProduct();

      expect(mockNotificationStore.showWarning).toHaveBeenCalledWith(
        "Invalid Input",
        "Please enter a barcode."
      );
      expect(mockProductStore.findProductByBarcode).not.toHaveBeenCalled();
    });

    it("should show warning when product is not found", async () => {
      mockProductStore.findProductByBarcode.mockResolvedValue(null);

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.barcode = "999999999";
      await vm.addProduct();

      expect(mockNotificationStore.showWarning).toHaveBeenCalledWith(
        "Product Not Found",
        "No product found with this barcode"
      );
      expect(vm.barcode).toBe("");
    });

    it("should handle errors when fetching product", async () => {
      const error = new Error("Network error");
      mockProductStore.findProductByBarcode.mockRejectedValue(error);

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.barcode = "123456789";
      await vm.addProduct();

      expect(mockNotificationStore.showError).toHaveBeenCalledWith(
        "Error",
        "Failed to fetch product. Please try again."
      );
      expect(vm.barcode).toBe("");
    });
  });

  describe("Order Management", () => {
    it("should complete order successfully", async () => {
      mockOrderStore.id = "order-123";

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.completeOrder();

      expect(mockOrderStore.complete).toHaveBeenCalled();
      expect(mockNotificationStore.showSuccess).toHaveBeenCalledWith(
        "Order Completed",
        "Thank you for your order!"
      );
    });

    it("should show warning when trying to complete without active order", async () => {
      mockOrderStore.id = "";

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.completeOrder();

      expect(mockOrderStore.complete).not.toHaveBeenCalled();
      expect(mockNotificationStore.showWarning).toHaveBeenCalledWith(
        "No Order",
        "No active order to complete"
      );
    });

    it("should abandon order when confirmed", async () => {
      mockOrderStore.id = "order-123";
      mockNotificationStore.showConfirm.mockResolvedValue({ confirmed: true });

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.abandonOrder();

      expect(mockNotificationStore.showConfirm).toHaveBeenCalledWith(
        "Abandon Order",
        "Are you sure you want to abandon this order? All items will be lost.",
        { type: "warning" }
      );
      expect(mockOrderStore.abandon).toHaveBeenCalled();
      expect(mockNotificationStore.showInfo).toHaveBeenCalledWith(
        "Order Abandoned",
        "Order has been cancelled"
      );
    });

    it("should not abandon order when not confirmed", async () => {
      mockOrderStore.id = "order-123";
      mockNotificationStore.showConfirm.mockResolvedValue({ confirmed: false });

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.abandonOrder();

      expect(mockOrderStore.abandon).not.toHaveBeenCalled();
    });
  });

  describe("Navigation Functions", () => {
    it("should navigate to products page", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const pushSpy = vi.spyOn(router, "push");

      vm.openProducts();

      expect(pushSpy).toHaveBeenCalledWith("/products");
    });

    it("should navigate to customers page", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const pushSpy = vi.spyOn(router, "push");

      vm.openCustomers();

      expect(pushSpy).toHaveBeenCalledWith("/customers");
    });

    it("should navigate to orders page", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const pushSpy = vi.spyOn(router, "push");

      vm.openOrders();

      expect(pushSpy).toHaveBeenCalledWith("/orders");
    });
  });

  describe("Store Management", () => {
    it("should clear operator", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.clearOperator();

      expect(mockOperatorStore.clearOperator).toHaveBeenCalled();
      expect(mockNotificationStore.showInfo).toHaveBeenCalledWith(
        "Operator cleared",
        "Please select a new operator"
      );
    });

    it("should clear customer", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      vm.clearCustomer();

      expect(mockCustomerStore.clearCustomer).toHaveBeenCalled();
      expect(mockNotificationStore.showInfo).toHaveBeenCalledWith(
        "Customer cleared"
      );
    });

    it("should navigate to operator selection", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const pushSpy = vi.spyOn(router, "push");

      vm.selectOperator();

      expect(pushSpy).toHaveBeenCalledWith("/operators");
    });

    it("should navigate to customer selection", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const pushSpy = vi.spyOn(router, "push");

      vm.selectCustomer();

      expect(pushSpy).toHaveBeenCalledWith("/customers");
    });
  });

  describe("Help Dialog", () => {
    it("should show help dialog when showHelp is called", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      expect(vm.showHelpDialog).toBe(false);

      vm.showHelp();

      expect(vm.showHelpDialog).toBe(true);
    });
  });

  describe("Clock Functionality", () => {
    it("should update clock every second", async () => {
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      const initialTime = vm.clock;

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      expect(vm.clock).not.toBe(initialTime);
    });

    it("should clear interval on unmount", async () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      await mountComponent();
      wrapper.unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("Computed Properties", () => {
    it("should detect home route correctly", async () => {
      await router.push("/");
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      expect(vm.isHome).toBe(true);
    });

    it("should detect non-home route correctly", async () => {
      await router.push("/products");
      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      expect(vm.isHome).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle order completion errors", async () => {
      mockOrderStore.id = "order-123";
      const error = new Error("Completion failed");
      mockOrderStore.complete.mockRejectedValue(error);

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.completeOrder();

      expect(mockNotificationStore.showError).toHaveBeenCalledWith(
        "Error",
        "Failed to complete order"
      );
    });

    it("should handle order abandon errors", async () => {
      mockOrderStore.id = "order-123";
      mockNotificationStore.showConfirm.mockResolvedValue({ confirmed: true });
      const error = new Error("Abandon failed");
      mockOrderStore.abandon.mockRejectedValue(error);

      await mountComponent();

      const vm = wrapper.vm as AppInstance;
      await vm.abandonOrder();

      expect(mockNotificationStore.showError).toHaveBeenCalledWith(
        "Error",
        "Failed to abandon order"
      );
    });

    it("should handle system initialization errors", async () => {
      const error = new Error("Init failed");
      mockSetupStore.initializeSystem.mockRejectedValue(error);

      await mountComponent();

      // Wait for next tick to allow promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Error is handled gracefully
      // This test mainly ensures the component doesn't crash on initialization errors
      expect(wrapper.exists()).toBe(true);
    });
  });
});
