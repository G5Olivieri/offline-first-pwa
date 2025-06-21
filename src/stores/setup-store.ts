import { getProductDB } from "@/db";
import type { Product } from "@/product/product";
import { searchService } from "@/product/singleton";
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
  const productDB = getProductDB();

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
      const totalCountResult = await productDB.info();
      const totalDocCount = totalCountResult.doc_count;
      setupState.value.totalProducts = totalDocCount;

      // Handle case where there are no products
      if (totalDocCount === 0) {
        setupState.value.progress = 90;
        setupState.value.currentStepDescription =
          "No products found - system ready";
      } else {
        const BATCH_SIZE = 1000;
        let processedCount = 0;
        let startkey: string | undefined = undefined;
        let hasMoreData = true;

        setupState.value.currentStep = SetupStep.BUILDING_SEARCH_INDEX;

        while (hasMoreData) {
          // Load a batch of products
          const batchResult: PouchDB.Core.AllDocsResponse<Product> =
            await productDB.allDocs({
              include_docs: true,
              limit: BATCH_SIZE,
              startkey: startkey,
              skip: startkey ? 1 : 0, // Skip the last doc from previous batch to avoid duplicates
            });

          if (batchResult.rows.length === 0) {
            hasMoreData = false;
            break; // No more products to process
          }

          // Extract products from the batch
          const batchProducts = batchResult.rows
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((row: any) => row.doc as Product)
            .filter(
              (product: Product | null): product is Product => product !== null,
            );

          // Update progress for loading
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

          // Add batch to search index
          await searchService.bulkAdd(indexableProducts);

          // Update progress for indexing
          const indexingProgress = 70 + (processedCount / totalDocCount) * 20; // 70-90% for indexing
          setupState.value.progress = Math.min(indexingProgress, 90);
          setupState.value.currentStepDescription = `Building search index... ${processedCount}/${totalDocCount} products indexed`;

          // Set up for next batch
          if (batchResult.rows.length === BATCH_SIZE) {
            startkey = batchResult.rows[batchResult.rows.length - 1].id;
          } else {
            hasMoreData = false; // Last batch was smaller than BATCH_SIZE, we're done
          }

          // Small delay to prevent blocking the UI thread
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
