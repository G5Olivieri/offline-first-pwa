<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="bg-red-50 rounded-lg p-8 max-w-md mx-auto">
          <svg
            class="w-12 h-12 text-red-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h2 class="text-xl font-semibold text-red-800 mb-2">
            Product Not Found
          </h2>
          <p class="text-red-600 mb-4">{{ error }}</p>
          <RouterLink
            to="/products"
            class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
              ></path>
            </svg>
            Back to Products
          </RouterLink>
        </div>
      </div>

      <!-- Product Detail Content -->
      <div v-else-if="product" class="space-y-8">
        <!-- Header with Navigation -->
        <div
          class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <RouterLink
                to="/products"
                class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                Back to Products
              </RouterLink>
              <div class="h-6 w-px bg-gray-300"></div>
              <h1 class="text-2xl font-bold text-gray-900">Product Details</h1>
            </div>

            <div class="flex items-center gap-3">
              <!-- Stock Status Badge -->
              <div
                class="px-3 py-1 rounded-full text-sm font-medium"
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
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Product Information -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Information Card -->
            <div
              class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4"
              >
                <h2 class="text-xl font-semibold text-white">
                  Basic Information
                </h2>
              </div>
              <div class="p-6 space-y-6">
                <!-- Product Name -->
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 mb-2">
                    {{ product.name }}
                  </h3>
                  <p
                    v-if="
                      product.nonProprietaryName &&
                      product.nonProprietaryName !== product.name
                    "
                    class="text-lg text-gray-600 italic"
                  >
                    {{ product.nonProprietaryName }}
                  </p>
                </div>

                <!-- Key Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Barcode -->
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <svg
                        class="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        ></path>
                      </svg>
                      <span class="font-medium text-gray-700">Barcode</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-lg">{{
                        product.barcode
                      }}</span>
                      <button
                        @click="copyToClipboard(product.barcode)"
                        class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy barcode"
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
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="bg-green-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <svg
                        class="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        ></path>
                      </svg>
                      <span class="font-medium text-gray-700">Price</span>
                    </div>
                    <span class="text-3xl font-bold text-green-600"
                      >${{ product.price }}</span
                    >
                  </div>

                  <!-- Stock -->
                  <div class="bg-blue-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <svg
                        class="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        ></path>
                      </svg>
                      <span class="font-medium text-gray-700">Stock Level</span>
                    </div>
                    <span class="text-2xl font-bold text-blue-600">{{
                      product.stock
                    }}</span>
                    <span class="text-gray-600 ml-2">units</span>
                  </div>

                  <!-- Product ID -->
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                      <svg
                        class="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        ></path>
                      </svg>
                      <span class="font-medium text-gray-700">Product ID</span>
                    </div>
                    <span class="font-mono text-sm text-gray-800">{{
                      product._id
                    }}</span>
                  </div>
                </div>

                <!-- Description -->
                <div
                  v-if="product.description"
                  class="bg-gray-50 rounded-lg p-4"
                >
                  <h4 class="font-medium text-gray-700 mb-3">Description</h4>
                  <p class="text-gray-800 leading-relaxed">
                    {{ product.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Additional Information Card -->
            <div
              v-if="hasAdditionalInfo"
              class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4"
              >
                <h2 class="text-xl font-semibold text-white">
                  Additional Information
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <!-- Category and Manufacturer -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-if="product.category"
                    class="p-3 bg-gray-50 rounded-lg"
                  >
                    <span class="font-medium text-gray-700 block mb-2"
                      >Category</span
                    >
                    <span
                      class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >{{ product.category }}</span
                    >
                  </div>

                  <div
                    v-if="product.manufacturer"
                    class="p-3 bg-gray-50 rounded-lg"
                  >
                    <span class="font-medium text-gray-700 block mb-2"
                      >Manufacturer</span
                    >
                    <span
                      class="text-gray-800 bg-white px-3 py-1 rounded text-sm"
                      >{{ product.manufacturer }}</span
                    >
                  </div>
                </div>

                <!-- Tags -->
                <div
                  v-if="product.tags && product.tags.length > 0"
                  class="p-4 bg-gray-50 rounded-lg"
                >
                  <h4 class="font-medium text-gray-700 mb-3">Tags</h4>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in product.tags"
                      :key="tag"
                      class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <!-- Pharmaceutical Information -->
                <div v-if="hasPharmaceuticalInfo" class="space-y-4">
                  <h4 class="font-medium text-gray-700">
                    Pharmaceutical Details
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      v-if="product.prescriptionStatus"
                      class="p-3 bg-yellow-50 rounded-lg"
                    >
                      <span class="font-medium text-gray-700 block mb-2">{{
                        product.prescriptionStatus
                      }}</span>
                    </div>

                    <div
                      v-if="product.dosageForm"
                      class="p-3 bg-gray-50 rounded-lg"
                    >
                      <span class="font-medium text-gray-700 block mb-2"
                        >Dosage Form</span
                      >
                      <span
                        class="text-gray-800 bg-white px-3 py-1 rounded text-sm"
                        >{{ product.dosageForm }}</span
                      >
                    </div>

                    <div
                      v-if="product.drugClass"
                      class="p-3 bg-purple-50 rounded-lg"
                    >
                      <span class="font-medium text-gray-700 block mb-2"
                        >Drug Class</span
                      >
                      <span
                        class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                        >{{ product.drugClass }}</span
                      >
                    </div>

                    <div
                      v-if="product.isProprietary !== undefined"
                      class="p-3 bg-gray-50 rounded-lg"
                    >
                      <span class="font-medium text-gray-700 block mb-2"
                        >Type</span
                      >
                      <span
                        class="px-3 py-1 rounded-full text-sm font-medium"
                        :class="{
                          'bg-blue-100 text-blue-700': product.isProprietary,
                          'bg-gray-100 text-gray-700': !product.isProprietary,
                        }"
                      >
                        {{ product.isProprietary ? "Brand Name" : "Generic" }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="product.activeIngredient"
                    class="p-4 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <h5 class="font-medium text-orange-800 mb-2">
                      Active Ingredient
                    </h5>
                    <p class="text-orange-700">
                      {{ product.activeIngredient }}
                    </p>
                  </div>

                  <div
                    v-if="product.contraindication"
                    class="p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div class="flex items-start gap-3">
                      <svg
                        class="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        ></path>
                      </svg>
                      <div>
                        <h5 class="font-medium text-red-800 mb-2">
                          Contraindication Warning
                        </h5>
                        <p class="text-red-700 leading-relaxed">
                          {{ product.contraindication }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Quick Actions Card -->
            <div
              class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4"
              >
                <h2 class="text-xl font-semibold text-white">Quick Actions</h2>
              </div>
              <div class="p-6 space-y-3">
                <button
                  @click="addToOrder"
                  :disabled="product.stock === 0"
                  class="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L4 3H2m5 10v6a1 1 0 001 1h10a1 1 0 001-1v-6m-4 3a1 1 0 11-2 0 1 1 0 012 0zm-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                    ></path>
                  </svg>
                  {{ product.stock === 0 ? "Out of Stock" : "Add to Order" }}
                </button>

                <button
                  @click="copyToClipboard(product.barcode)"
                  class="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Copy Barcode
                </button>

                <button
                  @click="deleteProduct"
                  class="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  Delete Product
                </button>
              </div>
            </div>

            <!-- Stock Information Card -->
            <div
              class="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
            >
              <div
                class="bg-gradient-to-r from-gray-600 to-slate-600 px-6 py-4"
              >
                <h2 class="text-xl font-semibold text-white">
                  Inventory Status
                </h2>
              </div>
              <div class="p-6 space-y-4">
                <div class="text-center">
                  <div
                    class="text-4xl font-bold mb-2"
                    :class="{
                      'text-green-600': product.stock > 10,
                      'text-yellow-600':
                        product.stock > 0 && product.stock <= 10,
                      'text-red-600': product.stock === 0,
                    }"
                  >
                    {{ product.stock }}
                  </div>
                  <p class="text-gray-600">Units in Stock</p>
                </div>

                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Stock Level:</span>
                    <span
                      class="font-medium"
                      :class="{
                        'text-green-600': product.stock > 10,
                        'text-yellow-600':
                          product.stock > 0 && product.stock <= 10,
                        'text-red-600': product.stock === 0,
                      }"
                    >
                      {{ getStockLevelText(product.stock) }}
                    </span>
                  </div>

                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Value:</span>
                    <span class="font-medium text-gray-900"
                      >${{ (product.stock * product.price).toFixed(2) }}</span
                    >
                  </div>
                </div>

                <!-- Stock Level Progress Bar -->
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-300"
                    :class="{
                      'bg-green-500': product.stock > 10,
                      'bg-yellow-500': product.stock > 0 && product.stock <= 10,
                      'bg-red-500': product.stock === 0,
                    }"
                    :style="{
                      width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "ProductDetailPage",
});

import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getProductDB } from "@/db";
import { useNotificationStore } from "@/stores/notification-store";
import { useOrderStore } from "@/stores/order-store";
import type { Product } from "@/types/product";
import { productService } from "@/services/product-service";

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const notificationStore = useNotificationStore();

// State
const product = ref<Product | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed properties
const hasPharmaceuticalInfo = computed(() => {
  if (!product.value) return false;
  return !!(
    product.value.prescriptionStatus ||
    product.value.dosageForm ||
    product.value.drugClass ||
    product.value.activeIngredient ||
    product.value.contraindication ||
    product.value.isProprietary !== undefined
  );
});

const hasAdditionalInfo = computed(() => {
  if (!product.value) return false;
  return !!(
    product.value.category ||
    product.value.manufacturer ||
    (product.value.tags && product.value.tags.length > 0) ||
    hasPharmaceuticalInfo.value
  );
});

// Methods
async function loadProduct(): Promise<void> {
  const productId = route.params.id as string;

  if (!productId) {
    error.value = "Product ID is required";
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const productDB = getProductDB();
    const foundProduct = await productDB.get(productId);
    if (foundProduct) {
      product.value = foundProduct;
    } else {
      error.value = "Product not found";
    }
  } catch (err) {
    if (err instanceof Error && err.name === "not_found") {
      error.value = "Product not found";
    } else {
      error.value =
        err instanceof Error ? err.message : "Failed to load product";
    }
  } finally {
    isLoading.value = false;
  }
}

async function addToOrder(): Promise<void> {
  if (!product.value) return;

  try {
    await orderStore.addProduct(product.value);
    notificationStore.showSuccess(
      "Product Added",
      `${product.value.name} has been added to the order.`,
    );
  } catch (error) {
    notificationStore.showError(
      "Add to Order Error",
      `Failed to add product to order. Please try again. ${error}`,
    );
  }
}

async function deleteProduct(): Promise<void> {
  if (!product.value) return;

  const result = await notificationStore.showConfirm(
    "Delete Product",
    `Are you sure you want to delete "${product.value.name}"? This action cannot be undone.`,
    { type: "error" },
  );

  if (result.confirmed) {
    try {
      await productService.deleteProduct(product.value._id);
      notificationStore.showSuccess(
        "Product Deleted",
        `${product.value.name} has been deleted successfully.`,
      );
      router.push("/products");
    } catch (error) {
      notificationStore.showError(
        "Delete Error",
        `Failed to delete product. Please try again. ${error}`,
      );
    }
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    notificationStore.showSuccess(
      "Copied to Clipboard",
      `${text} has been copied to your clipboard.`,
    );
  } catch (error) {
    notificationStore.showError(
      "Copy Error",
      `Failed to copy to clipboard. Please try again ${error}`,
    );
  }
}

function getStockLevelText(stock: number): string {
  if (stock === 0) return "Out of Stock";
  if (stock <= 10) return "Low Stock";
  if (stock <= 50) return "Normal Stock";
  return "High Stock";
}

// Lifecycle
onMounted(() => {
  loadProduct();
});
</script>
