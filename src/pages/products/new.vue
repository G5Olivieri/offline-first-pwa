<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <ErrorBoundary
        title="Product Form Error"
        fallback-message="There was an error with the product form. Please try refreshing the page."
        :show-retry="true"
        :show-reset="true"
        @retry="handleRetry"
      >
        <div class="bg-white shadow-lg rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-900">New Product</h1>
            <p class="mt-1 text-sm text-gray-600">
              Add a new product to your inventory
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="px-6 py-6 space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700"
                >
                  Product Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  v-model="form.name"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': hasFieldError('name') }"
                />
                <span v-if="hasFieldError('name')" class="text-sm text-red-600">
                  {{ getFieldError("name") }}
                </span>
              </div>

              <div class="space-y-2">
                <label
                  for="barcode"
                  class="block text-sm font-medium text-gray-700"
                >
                  Barcode <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  placeholder="Enter barcode"
                  v-model="form.barcode"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': hasFieldError('barcode') }"
                />
                <span
                  v-if="hasFieldError('barcode')"
                  class="text-sm text-red-600"
                >
                  {{ getFieldError("barcode") }}
                </span>
              </div>

              <div class="space-y-2">
                <label
                  for="price"
                  class="block text-sm font-medium text-gray-700"
                >
                  Price <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  v-model.number="form.price"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': hasFieldError('price') }"
                />
                <span
                  v-if="hasFieldError('price')"
                  class="text-sm text-red-600"
                >
                  {{ getFieldError("price") }}
                </span>
              </div>

              <div class="space-y-2">
                <label
                  for="stock"
                  class="block text-sm font-medium text-gray-700"
                >
                  Initial Stock <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  placeholder="0"
                  min="0"
                  v-model.number="form.stock"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': hasFieldError('stock') }"
                />
                <span
                  v-if="hasFieldError('stock')"
                  class="text-sm text-red-600"
                >
                  {{ getFieldError("stock") }}
                </span>
              </div>
            </div>

            <!-- Optional Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="category"
                  class="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  placeholder="Enter category"
                  v-model="form.category"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="manufacturer"
                  class="block text-sm font-medium text-gray-700"
                >
                  Manufacturer
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  placeholder="Enter manufacturer"
                  v-model="form.manufacturer"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <label
                for="description"
                class="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Enter product description"
                v-model="form.description"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            <!-- Form Actions -->
            <div
              class="flex justify-end space-x-3 pt-6 border-t border-gray-200"
            >
              <button
                type="button"
                @click="handleCancel"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || hasErrors"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSubmitting" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                  Creating Product...
                </span>
                <span v-else>Create Product</span>
              </button>
            </div>
          </form>
        </div>
      </ErrorBoundary>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useFormErrors } from "@/composables/use-form-errors";
import { productService } from "@/services/product-service";
import ErrorBoundary from "@/components/error-boundary.vue";
import type { Product } from "@/types/product";

defineOptions({
  name: "NewProduct",
});

const router = useRouter();

// Form state
const form = reactive({
  name: "",
  barcode: "",
  price: 0,
  stock: 0,
  category: "",
  manufacturer: "",
  description: "",
});

// Error handling composables
const {
  hasErrors,
  isSubmitting,
  hasFieldError,
  getFieldError,
  setFieldError,
  withSubmission,
} = useFormErrors();

// Form submission
const handleSubmit = async () => {
  // Client-side validation
  if (!validateForm()) return;

  const result = await withSubmission(async () => {
    const productData: Omit<Product, "_id" | "rev"> = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      price: form.price,
      stock: form.stock,
      ...(form.category && { category: form.category.trim() }),
      ...(form.manufacturer && { manufacturer: form.manufacturer.trim() }),
      ...(form.description && { description: form.description.trim() }),
    };

    return await productService.createProduct(productData);
  });

  if (result) {
    router.push("/products");
  }
};

// Client-side validation
const validateForm = (): boolean => {
  const validationErrors: Record<string, string> = {};

  if (!form.name.trim()) {
    validationErrors.name = "Product name is required";
  }

  if (!form.barcode.trim()) {
    validationErrors.barcode = "Barcode is required";
  } else if (form.barcode.length < 8) {
    validationErrors.barcode = "Barcode must be at least 8 characters long";
  }

  if (form.price < 0) {
    validationErrors.price = "Price must be a positive number";
  }

  if (form.stock < 0) {
    validationErrors.stock = "Stock cannot be negative";
  }

  if (Object.keys(validationErrors).length > 0) {
    // Use the setErrors method from the composable
    Object.entries(validationErrors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
    return false;
  }

  return true;
};

// Navigation
const handleCancel = () => {
  router.push("/products");
};

const handleRetry = () => {
  // Reset form state or perform other retry logic
  console.log("Retrying form operation...");
};
</script>
