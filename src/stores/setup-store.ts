import type { Product } from "@/product/product";
import { getProductService, searchService } from "@/product/get-product-service";
import { defineStore } from "pinia";
import { ref } from "vue";

export enum SetupStep {
  IDLE = "idle",
  LOADING_PRODUCTS = "loading-products",
  BUILDING_SEARCH_INDEX = "building-search-index",
  COMPLETED = "completed",
  ERROR = "error",
}

export const SETUP_STEP_DESCRIPTIONS = {
  [SetupStep.IDLE]: "System ready",
  [SetupStep.LOADING_PRODUCTS]: "Loading products from database...",
  [SetupStep.BUILDING_SEARCH_INDEX]: "Building search index...",
  [SetupStep.COMPLETED]: "System ready",
  [SetupStep.ERROR]: "System initialization failed",
} as const;

export interface SetupState {
  isInitialized: boolean;
  isLoading: boolean;
  currentStep: SetupStep;
  currentStepDescription: string;
  progress: number;
  error: string | null;
  totalProducts: number;
}

export const useSetupStore = defineStore("setupStore", () => {
  // Reactive state
  const setupState = ref<SetupState>({
    isInitialized: false,
    isLoading: false,
    currentStep: SetupStep.IDLE,
    currentStepDescription: SETUP_STEP_DESCRIPTIONS[SetupStep.IDLE],
    progress: 0,
    error: null,
    totalProducts: 0,
  });

  const initializeSystem = async (): Promise<void> => {
    if (setupState.value.isInitialized) {
      return;
    }

    setupState.value.isLoading = true;
    setupState.value.error = null;
    setupState.value.progress = 0;

    try {
      // Step 1: Wait for search service to be ready
      setupState.value.currentStep = SetupStep.BUILDING_SEARCH_INDEX;
      setupState.value.currentStepDescription =
        "Waiting for search service to be ready...";
      setupState.value.progress = 10;

      // The search service initializes automatically in its constructor
      // We just need to wait a bit for IndexedDB to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));
      setupState.value.progress = 30;

      // Step 2: Stream products from CouchDB in batches
      setupState.value.currentStep = SetupStep.LOADING_PRODUCTS;
      setupState.value.currentStepDescription =
        SETUP_STEP_DESCRIPTIONS[SetupStep.LOADING_PRODUCTS];
      setupState.value.progress = 40;

      // Get total count first for progress tracking
      const productService = await getProductService();
      const totalCountResult = await productService.count();
      const totalDocCount = totalCountResult;
      setupState.value.totalProducts = totalDocCount;

      // Handle case where there are no products
      if (totalDocCount === 0) {
        setupState.value.progress = 90;
        setupState.value.currentStepDescription =
          "No products found - system ready";
      } else {
        const BATCH_SIZE = 1000;
        let processedCount = 0;
        let hasMoreData = true;

        setupState.value.currentStep = SetupStep.BUILDING_SEARCH_INDEX;

        while (hasMoreData) {
          const batchResult = await productService.listProducts({
            limit: BATCH_SIZE,
            skip: processedCount,
          });

          if (batchResult.products.length === 0) {
            hasMoreData = false;
            break;
          }

          const batchProducts = batchResult.products;

          processedCount += batchProducts.length;
          const loadingProgress = 40 + (processedCount / totalDocCount) * 30; // 40-70% for loading
          setupState.value.progress = Math.min(loadingProgress, 70);
          setupState.value.currentStepDescription = `Loading products... ${processedCount}/${totalDocCount}`;

          // Convert to IndexableProduct format and add to search index
          const indexableProducts = batchProducts.map((product: Product) => ({
            id: product._id,
            name: product.name,
            nonProprietaryName: product.nonProprietaryName || undefined,
            barcode: product.barcode,
          }));

          await searchService.bulkAdd(indexableProducts);

          const indexingProgress = 70 + (processedCount / totalDocCount) * 20; // 70-90% for indexing
          setupState.value.progress = Math.min(indexingProgress, 90);
          setupState.value.currentStepDescription = `Building search index... ${processedCount}/${totalDocCount} products indexed`;

          if (
            processedCount >= totalDocCount ||
            batchProducts.length < BATCH_SIZE
          ) {
            hasMoreData = false;
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        setupState.value.progress = 90;
      }

      // Step 4: Complete setup
      setupState.value.currentStep = SetupStep.COMPLETED;
      setupState.value.currentStepDescription =
        SETUP_STEP_DESCRIPTIONS[SetupStep.COMPLETED];
      setupState.value.progress = 100;
      setupState.value.isInitialized = true;
    } catch (error) {
      console.error("System initialization failed:", error);
      setupState.value.currentStep = SetupStep.ERROR;
      setupState.value.currentStepDescription =
        SETUP_STEP_DESCRIPTIONS[SetupStep.ERROR];
      setupState.value.error =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw error;
    } finally {
      setupState.value.isLoading = false;
    }
  };

  const resetSetup = async (): Promise<void> => {
    setupState.value.isInitialized = false;
    setupState.value.isLoading = false;
    setupState.value.currentStep = SetupStep.IDLE;
    setupState.value.currentStepDescription =
      SETUP_STEP_DESCRIPTIONS[SetupStep.IDLE];
    setupState.value.progress = 0;
    setupState.value.error = null;
    setupState.value.totalProducts = 0;

    // Clear search cache
    try {
      await searchService.clearCache();
    } catch (error) {
      console.error("Failed to clear search cache:", error);
    }
  };

  const retrySetup = async (): Promise<void> => {
    await resetSetup();
    await initializeSystem();
  };

  // Computed-like getters
  const isSystemReady = () =>
    setupState.value.isInitialized && !setupState.value.isLoading;
  const shouldBlockUI = () => setupState.value.isLoading;
  const hasError = () => setupState.value.error !== null;

  return {
    setupState,
    initializeSystem,
    resetSetup,
    retrySetup,
    isSystemReady,
    shouldBlockUI,
    hasError,
    // Export enum and constants for external use
    SetupStep,
    SETUP_STEP_DESCRIPTIONS,
  };
});
