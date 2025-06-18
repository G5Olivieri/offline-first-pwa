import { defineStore } from "pinia";
import { ref } from "vue";
import { getProductDB } from "../db";
import { searchService } from "../services/search-service";
import type { Product } from "../types/product";

export enum SetupStep {
  IDLE = 'idle',
  LOADING_PRODUCTS = 'loading-products',
  BUILDING_SEARCH_INDEX = 'building-search-index',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export const SETUP_STEP_DESCRIPTIONS = {
  [SetupStep.IDLE]: 'System ready',
  [SetupStep.LOADING_PRODUCTS]: 'Loading products from database...',
  [SetupStep.BUILDING_SEARCH_INDEX]: 'Building search index...',
  [SetupStep.COMPLETED]: 'System ready',
  [SetupStep.ERROR]: 'System initialization failed'
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
    totalProducts: 0
  });

  const initializeSystem = async (): Promise<void> => {
    if (setupState.value.isInitialized) {
      console.log("System already initialized");
      return;
    }

    setupState.value.isLoading = true;
    setupState.value.error = null;
    setupState.value.progress = 0;

    try {
      // Step 1: Wait for search service to be ready
      setupState.value.currentStep = SetupStep.BUILDING_SEARCH_INDEX;
      setupState.value.currentStepDescription = 'Waiting for search service to be ready...';
      setupState.value.progress = 10;

      console.log("Waiting for search service to be ready...");
      // The search service initializes automatically in its constructor
      // We just need to wait a bit for IndexedDB to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      setupState.value.progress = 30;

      // Step 2: Load products from CouchDB
      setupState.value.currentStep = SetupStep.LOADING_PRODUCTS;
      setupState.value.currentStepDescription = SETUP_STEP_DESCRIPTIONS[SetupStep.LOADING_PRODUCTS];
      setupState.value.progress = 40;

      console.log("Loading products from CouchDB...");
      const allProducts = await productDB.allDocs({
        include_docs: true,
        limit: 10000 // Get all products
      });

      const products = allProducts.rows.map(row => row.doc as Product);
      setupState.value.totalProducts = products.length;
      setupState.value.progress = 60;

      console.log(`Loaded ${products.length} products from CouchDB`);

      // Step 3: Add products to search index (if we have products)
      if (products.length > 0) {
        setupState.value.currentStep = SetupStep.BUILDING_SEARCH_INDEX;
        setupState.value.currentStepDescription = `Building search index for ${products.length} products...`;
        setupState.value.progress = 70;

        console.log("Adding products to search index...");
        // Convert products to IndexableProduct format
        const indexableProducts = products.map(product => ({
          id: product._id,
          name: product.name,
          barcode: product.barcode
        }));

        await searchService.bulkAdd(indexableProducts);
        setupState.value.progress = 90;

        console.log("Search index built successfully");
      } else {
        console.log("No products found, search index ready for future products");
        setupState.value.progress = 90;
      }

      // Step 4: Complete setup
      setupState.value.currentStep = SetupStep.COMPLETED;
      setupState.value.currentStepDescription = SETUP_STEP_DESCRIPTIONS[SetupStep.COMPLETED];
      setupState.value.progress = 100;
      setupState.value.isInitialized = true;

      console.log("System initialization completed");

    } catch (error) {
      console.error("System initialization failed:", error);
      setupState.value.currentStep = SetupStep.ERROR;
      setupState.value.currentStepDescription = SETUP_STEP_DESCRIPTIONS[SetupStep.ERROR];
      setupState.value.error = error instanceof Error ? error.message : 'Unknown error occurred';
      throw error;
    } finally {
      setupState.value.isLoading = false;
    }
  };

  const resetSetup = async (): Promise<void> => {
    console.log("Resetting system setup...");
    setupState.value.isInitialized = false;
    setupState.value.isLoading = false;
    setupState.value.currentStep = SetupStep.IDLE;
    setupState.value.currentStepDescription = SETUP_STEP_DESCRIPTIONS[SetupStep.IDLE];
    setupState.value.progress = 0;
    setupState.value.error = null;
    setupState.value.totalProducts = 0;

    // Clear search cache
    try {
      await searchService.clearCache();
      console.log("Search cache cleared");
    } catch (error) {
      console.error("Failed to clear search cache:", error);
    }
  };

  const retrySetup = async (): Promise<void> => {
    console.log("Retrying system setup...");
    await resetSetup();
    await initializeSystem();
  };

  // Computed-like getters
  const isSystemReady = () => setupState.value.isInitialized && !setupState.value.isLoading;
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
