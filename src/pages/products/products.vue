<script setup lang="ts">
defineOptions({
  name: "ProductsPage",
});

import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { productService } from "../../services/product-service";
import { searchService } from "../../services/search-service";
import { useNotificationStore } from "../../stores/notification-store";
import { useOrderStore } from "../../stores/order-store";
import type { Product } from "../../types/product";

const notificationStore = useNotificationStore();
const orderStore = useOrderStore();

const products = ref<{ count: number; products: Product[] }>({
  count: 0,
  products: [],
});
const limit = ref(12);
const skip = ref(0);
const isLoading = ref(false);
const searchQuery = ref("");
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const isSearchIndexReady = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Computed properties
const totalPages = computed(() =>
  Math.ceil(products.value.count / limit.value)
);
const currentPage = computed(() => Math.floor(skip.value / limit.value) + 1);
const hasNextPage = computed(
  () => skip.value + limit.value < products.value.count
);
const hasPreviousPage = computed(() => skip.value > 0);

// Pagination display logic
const paginationRange = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Computed property to determine search type
const searchType = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return "all";
  return /^\d+$/.test(query) ? "barcode" : "name";
});

// Search status computed property
const searchStatus = computed(() => {
  if (isSearchIndexReady.value) {
    return {
      text: "Fuzzy Search Ready",
      color: "bg-green-100 text-green-700",
      icon: "⚡",
    };
  } else if (searchService.isReady()) {
    return {
      text: "Search Index Ready",
      color: "bg-blue-100 text-blue-700",
      icon: "🔍",
    };
  } else {
    return {
      text: "Building Search Index...",
      color: "bg-yellow-100 text-yellow-700",
      icon: "⏳",
    };
  }
});

const loadProducts = async () => {
  isLoading.value = true;
  try {
    if (searchQuery.value.trim()) {
      products.value = await productService.searchProducts(
        searchQuery.value.trim(),
        {
          limit: limit.value,
          skip: skip.value,
        }
      );
    } else {
      // Use regular list when no search query
      products.value = await productService.listProducts({
        limit: limit.value,
        skip: skip.value,
      });
    }

    // Check if search service is ready
    isSearchIndexReady.value = searchService.isReady();
  } catch (error) {
    notificationStore.showError(
      "Loading Error",
      `Failed to load products. Please try again. ${error}`
    );
  } finally {
    isLoading.value = false;
  }
};

const deleteProduct = async (product: Product) => {
  const result = await notificationStore.showConfirm(
    "Delete Product",
    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    { type: "error" }
  );

  if (result.confirmed) {
    try {
      await productService.deleteProduct(product._id);
      notificationStore.showSuccess(
        "Product Deleted",
        `${product.name} has been deleted successfully.`
      );
      await loadProducts();
    } catch (error) {
      notificationStore.showError(
        "Delete Error",
        `Failed to delete product. Please try again. ${error}`
      );
    }
  }
};

const addToOrder = async (product: Product) => {
  try {
    await orderStore.addProduct(product);
    notificationStore.showSuccess(
      "Product Added",
      `${product.name} has been added to the order.`
    );
  } catch (error) {
    notificationStore.showError(
      "Add to Order Error",
      `Failed to add product to order. Please try again. ${error}`
    );
  }
};

// Real-time search with debouncing
const performSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(async () => {
    skip.value = 0; // Reset to first page when searching
    await loadProducts();
  }, 200);
};

const nextPage = () => {
  if (hasNextPage.value) {
    skip.value += limit.value;
    loadProducts();
  }
};

const previousPage = () => {
  if (hasPreviousPage.value) {
    skip.value -= limit.value;
    loadProducts();
  }
};

const goToPage = (page: number) => {
  skip.value = (page - 1) * limit.value;
  loadProducts();
};

const copyEAN = async (barcode: string) => {
  try {
    await navigator.clipboard.writeText(barcode);
    notificationStore.showSuccess(
      "EAN Copied",
      `Barcode ${barcode} copied to clipboard`
    );
  } catch {
    // Fallback for older browsers or when clipboard API is not available
    const textArea = document.createElement("textarea");
    textArea.value = barcode;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    notificationStore.showSuccess(
      "EAN Copied",
      `Barcode ${barcode} copied to clipboard`
    );
  }
};

// Watch for search query changes for real-time search
watch(searchQuery, () => {
  performSearch();
});

// Keyboard shortcut handler
const handleKeydown = (event: KeyboardEvent) => {
  // Alt + Shift + F to focus search
  if (
    event.altKey &&
    event.shiftKey &&
    (event.key === "F" || event.key === "f")
  ) {
    event.preventDefault();
    searchInputRef.value?.focus();
    notificationStore.showInfo(
      "Search Focus",
      "Search input focused. Use Alt+Shift+F to focus search anytime."
    );
  }
};

const escapeSearch = (event: KeyboardEvent) => {
  (event.target as HTMLElement | null)?.blur();
  searchQuery.value = "";
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
};

onMounted(() => {
  loadProducts();
  window.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  window.removeEventListener("keydown", handleKeydown);
});
</script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1
              class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
            >
              Products
            </h1>
            <p class="text-gray-600 mt-1">
              Manage your product inventory and catalog
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <RouterLink
              to="/products/new"
              class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Product
            </RouterLink>

            <RouterLink
              to="/products/import"
              class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Import Products
            </RouterLink>
          </div>
        </div>

        <!-- Search and Filters -->
        <div
          class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div
            class="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
          >
            <!-- Search Bar -->
            <div class="flex-1 relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  class="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref="searchInputRef"
                @keydown.escape="escapeSearch"
                v-model="searchQuery"
                type="text"
                :placeholder="
                  searchType === 'barcode'
                    ? 'Searching by barcode...'
                    : searchType === 'name'
                    ? 'Searching by name...'
                    : 'Search products by name or barcode...'
                "
                class="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
              <!-- Search type indicator -->
              <div
                v-if="searchQuery.trim()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span
                  class="text-xs font-medium px-2 py-1 rounded-full"
                  :class="{
                    'bg-blue-100 text-blue-700': searchType === 'name',
                    'bg-green-100 text-green-700': searchType === 'barcode',
                  }"
                >
                  {{ searchType === "barcode" ? "Barcode" : "Name" }}
                </span>
              </div>
            </div>

            <!-- Clear Search Button -->
            <button
              v-if="searchQuery.trim()"
              @click="searchQuery = ''"
              class="inline-flex items-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          </div>

          <!-- Keyboard Shortcut Hint -->
          <div class="mt-3 text-center">
            <p class="text-xs text-gray-500">
              <kbd
                class="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded"
                >Alt</kbd
              >
              +
              <kbd
                class="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded"
                >Shift</kbd
              >
              +
              <kbd
                class="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded"
                >F</kbd
              >
              to focus search
            </p>
          </div>
        </div>
      </div>

      <!-- Products Count and Status -->
      <div class="mb-6">
        <div
          class="bg-white/50 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                ></div>
                <span class="text-sm font-medium text-gray-700">
                  {{ products.count }}
                  {{ products.count === 1 ? "product" : "products" }} found
                </span>
              </div>
              <!-- Search Status Indicator -->
              <div class="flex items-center gap-2">
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="searchStatus.color"
                >
                  {{ searchStatus.icon }} {{ searchStatus.text }}
                </span>
              </div>
            </div>
            <div v-if="totalPages > 1" class="text-sm text-gray-500">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading && products.products.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="text-center">
          <svg
            class="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!isLoading && products.products.length === 0"
        class="text-center py-12"
      >
        <div
          class="bg-white/50 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <svg
            class="w-24 h-24 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">
            No products found
          </h3>
          <p class="text-gray-500 mb-6">
            {{
              searchQuery
                ? "Try adjusting your search terms or"
                : "Get started by adding your first product or"
            }}
            <br />import products from a file.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <RouterLink
              to="/products/new"
              class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Product
            </RouterLink>
            <RouterLink
              to="/products/import"
              class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Import Products
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
      >
        <div
          v-for="product in products.products"
          :key="product._id"
          class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl hover:border-white/40 transition-all duration-300 transform hover:-translate-y-1"
        >
          <!-- Product Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3
                  class="text-lg font-semibold text-gray-800 truncate mb-1"
                  :title="product.name"
                >
                  {{ product.name }}
                </h3>
                <!-- Non-proprietary name if available -->
                <p
                  v-if="
                    product.nonProprietaryName &&
                    product.nonProprietaryName !== product.name
                  "
                  class="text-sm text-gray-600 italic mb-2"
                  :title="product.nonProprietaryName"
                >
                  {{ product.nonProprietaryName }}
                </p>
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span class="font-mono">{{ product.barcode }}</span>
                </div>
              </div>
              <!-- Stock Status Badge -->
              <div
                class="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-700': product.stock > 10,
                  'bg-yellow-100 text-yellow-700':
                    product.stock > 0 && product.stock <= 10,
                  'bg-red-100 text-red-700': product.stock === 0,
                }"
              >
                {{
                  product.stock === 0
                    ? "Out of Stock"
                    : `${product.stock} in stock`
                }}
              </div>
            </div>

            <!-- Product Details -->
            <div class="space-y-3">
              <!-- Price -->
              <div class="flex justify-between items-center text-sm">
                <span class="text-sm text-gray-600">Price</span>
                <span class="text-xl font-bold text-green-600">
                  ${{ product.price }}
                </span>
              </div>

              <!-- Manufacturer -->
              <div
                v-if="product.manufacturer"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">Manufacturer:</span>
                <span
                  class="text-gray-800 font-medium text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {{ product.manufacturer }}
                </span>
              </div>

              <!-- Prescription Status -->
              <div
                v-if="product.prescriptionStatus"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">Type:</span>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700':
                      product.prescriptionStatus === 'OTC',
                    'bg-yellow-100 text-yellow-700':
                      product.prescriptionStatus === 'PrescriptionOnly',
                    'bg-red-100 text-red-700':
                      product.prescriptionStatus === 'Controlled',
                  }"
                >
                  {{ product.prescriptionStatus }}
                </span>
              </div>

              <!-- Dosage Form -->
              <div
                v-if="product.dosageForm"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">Form:</span>
                <span
                  class="text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {{ product.dosageForm }}
                </span>
              </div>

              <!-- Drug Class -->
              <div
                v-if="product.drugClass"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">Drug Class:</span>
                <span
                  class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded"
                >
                  {{ product.drugClass }}
                </span>
              </div>

              <!-- Active Ingredient -->
              <div
                v-if="product.activeIngredient"
                class="text-sm flex justify-between"
              >
                <span class="text-gray-600 block mb-1">Active Ingredient:</span>
                <span
                  class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded inline-block"
                >
                  {{ product.activeIngredient }}
                </span>
              </div>

              <!-- Tags -->
              <div
                v-if="product.tags && product.tags.length > 0"
                class="text-sm"
              >
                <span class="text-gray-600 block mb-2">Tags:</span>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in product.tags"
                    :key="tag"
                    class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Proprietary Status -->
              <div
                v-if="product.isProprietary !== undefined"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600">Status:</span>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-700': product.isProprietary,
                    'bg-gray-100 text-gray-700': !product.isProprietary,
                  }"
                >
                  {{ product.isProprietary ? "Brand Name" : "Generic" }}
                </span>
              </div>

              <!-- Product ID -->
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Product ID:</span>
                <span
                  class="font-mono text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {{ product._id }}
                </span>
              </div>

              <!-- Category -->
              <div v-if="product.category" class="flex flex-col text-sm gap-2">
                <span class="text-gray-600">Category</span>
                <span
                  class="flex items-center justify-center bg-blue-100 text-blue-800 px-2 py-1 rounded-xl text-xs font-medium text-center"
                >
                  {{ product.category }}
                </span>
              </div>
            </div>
          </div>

          <!-- Product Actions -->
          <div class="px-6 pb-6">
            <div class="flex flex-col gap-2">
              <RouterLink
                :to="`/products/${product._id}`"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                :title="`View details for ${product.name}`"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Details
              </RouterLink>
              <button
                @click="copyEAN(product.barcode)"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                :title="`Copy EAN: ${product.barcode}`"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy EAN
              </button>
              <button
                @click="addToOrder(product)"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
                :title="`Add ${product.name} to order`"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L4 3H2m5 10v6a1 1 0 001 1h10a1 1 0 001-1v-6m-4 3a1 1 0 11-2 0 1 1 0 012 0zm-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
                Add to Order
              </button>
              <button
                @click="deleteProduct(product)"
                class="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1-1H6a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
      >
        <div
          class="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <!-- Pagination Info -->
          <div class="text-sm text-gray-600">
            Showing {{ skip + 1 }} to
            {{ Math.min(skip + limit, products.count) }} of
            {{ products.count }} products
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-2">
            <!-- Previous Button -->
            <button
              @click="previousPage"
              :disabled="!hasPreviousPage || isLoading"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-700 disabled:text-gray-400 transition-colors disabled:cursor-not-allowed"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <!-- Page Numbers -->
            <div class="hidden sm:flex items-center gap-1">
              <!-- First page button if not in range -->
              <template v-if="paginationRange[0] > 1">
                <button
                  @click="goToPage(1)"
                  :disabled="isLoading"
                  class="w-10 h-10 rounded-lg border border-gray-200 font-medium transition-colors disabled:cursor-not-allowed bg-white hover:bg-gray-50 text-gray-700"
                >
                  1
                </button>
                <span v-if="paginationRange[0] > 2" class="px-1 text-gray-500"
                  >...</span
                >
              </template>

              <!-- Page range -->
              <template v-for="page in paginationRange" :key="page">
                <button
                  @click="goToPage(page)"
                  :disabled="isLoading"
                  :class="{
                    'bg-blue-600 text-white': currentPage === page,
                    'bg-white hover:bg-gray-50 text-gray-700':
                      currentPage !== page,
                  }"
                  class="w-10 h-10 rounded-lg border border-gray-200 font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {{ page }}
                </button>
              </template>

              <!-- Last page button if not in range -->
              <template
                v-if="paginationRange[paginationRange.length - 1] < totalPages"
              >
                <span
                  v-if="
                    paginationRange[paginationRange.length - 1] < totalPages - 1
                  "
                  class="px-1 text-gray-500"
                  >...</span
                >
                <button
                  @click="goToPage(totalPages)"
                  :disabled="isLoading"
                  class="w-10 h-10 rounded-lg border border-gray-200 font-medium transition-colors disabled:cursor-not-allowed bg-white hover:bg-gray-50 text-gray-700"
                >
                  {{ totalPages }}
                </button>
              </template>
            </div>

            <!-- Next Button -->
            <button
              @click="nextPage"
              :disabled="!hasNextPage || isLoading"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-700 disabled:text-gray-400 transition-colors disabled:cursor-not-allowed"
            >
              Next
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
