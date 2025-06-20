<script setup lang="ts">
defineOptions({
  name: "EditProduct",
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as z from "zod";
import { productService } from "@/services/product-service";
import { useNotificationStore } from "@/stores/notification-store";
import type { Product } from "@/types/product";

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const isLoading = ref(true);
const isSaving = ref(false);
const product = ref<Product | null>(null);

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Name is required"),
    barcode: z.string().min(8, "Barcode must be at least 8 characters long"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    stock: z.coerce.number().min(0, "Stock must be a positive number"),
    category: z.string().optional(),
    description: z.string().optional(),
    dosageForm: z.string().optional(),
    drugClass: z.string().optional(),
    isProprietary: z.boolean().optional(),
    manufacturer: z.string().optional(),
    nonProprietaryName: z.string().optional(),
    prescriptionStatus: z
      .enum(["OTC", "PrescriptionOnly", "Controlled"])
      .optional(),
    contraindication: z.string().optional(),
    activeIngredient: z.string().optional(),
  }),
);

const { handleSubmit, errors, setValues } = useForm({
  validationSchema,
});

const { value: name } = useField<string>("name");
const { value: barcode } = useField<string>("barcode");
const { value: price } = useField<number>("price");
const { value: stock } = useField<number>("stock");
const { value: category } = useField<string>("category");
const { value: description } = useField<string>("description");
const { value: dosageForm } = useField<string>("dosageForm");
const { value: drugClass } = useField<string>("drugClass");
const { value: isProprietary } = useField<boolean>("isProprietary");
const { value: manufacturer } = useField<string>("manufacturer");
const { value: nonProprietaryName } = useField<string>("nonProprietaryName");
const { value: prescriptionStatus } = useField<
  "OTC" | "PrescriptionOnly" | "Controlled"
>("prescriptionStatus");
const { value: contraindication } = useField<string>("contraindication");
const { value: activeIngredient } = useField<string>("activeIngredient");

const loadProduct = async () => {
  try {
    isLoading.value = true;
    const productId = route.params.id as string;

    // Get the product from the database
    const db = await import("@/db").then((m) => m.getProductDB());
    const productDoc = await db.get(productId);

    product.value = productDoc;

    // Set form values
    setValues({
      name: productDoc.name,
      barcode: productDoc.barcode,
      price: productDoc.price,
      stock: productDoc.stock,
      category: productDoc.category || "",
      description: productDoc.description || "",
      dosageForm: productDoc.dosageForm || "",
      drugClass: productDoc.drugClass || "",
      isProprietary: productDoc.isProprietary || false,
      manufacturer: productDoc.manufacturer || "",
      nonProprietaryName: productDoc.nonProprietaryName || "",
      prescriptionStatus: productDoc.prescriptionStatus || "OTC",
      contraindication: productDoc.contraindication || "",
      activeIngredient: productDoc.activeIngredient || "",
    });
  } catch (error) {
    notificationStore.showError(
      "Loading Error",
      `Failed to load product. Please try again. ${error}`,
    );
    router.push("/products");
  } finally {
    isLoading.value = false;
  }
};

const onSubmit = handleSubmit(async (values) => {
  if (!product.value) return;

  try {
    isSaving.value = true;

    const updatedProduct: Product = {
      ...product.value,
      name: values.name,
      barcode: values.barcode,
      price: values.price,
      stock: values.stock,
      ...(values.category && { category: values.category }),
      ...(values.description && { description: values.description }),
      ...(values.dosageForm && { dosageForm: values.dosageForm }),
      ...(values.drugClass && { drugClass: values.drugClass }),
      ...(values.isProprietary !== undefined && {
        isProprietary: values.isProprietary,
      }),
      ...(values.manufacturer && { manufacturer: values.manufacturer }),
      ...(values.nonProprietaryName && {
        nonProprietaryName: values.nonProprietaryName,
      }),
      ...(values.prescriptionStatus && {
        prescriptionStatus: values.prescriptionStatus,
      }),
      ...(values.contraindication && {
        contraindication: values.contraindication,
      }),
      ...(values.activeIngredient && {
        activeIngredient: values.activeIngredient,
      }),
    };

    await productService.updateProduct(updatedProduct);

    notificationStore.showSuccess(
      "Product Updated",
      `${updatedProduct.name} has been updated successfully.`,
    );

    router.push("/products");
  } catch (error) {
    notificationStore.showError(
      "Update Error",
      `Failed to update product. Please try again. ${error}`,
    );
  } finally {
    isSaving.value = false;
  }
});

const goBack = () => {
  router.push("/products");
};

onMounted(() => {
  loadProduct();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow-lg rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p class="mt-1 text-sm text-gray-600">
                Update product information and details
              </p>
            </div>
            <button
              @click="goBack"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Products
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-6">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div class="h-10 bg-gray-200 rounded mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div class="h-10 bg-gray-200 rounded mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div class="h-10 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="onSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                id="name"
                v-model="name"
                type="text"
                :class="{
                  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500': true,
                  'border-red-300 focus:ring-red-500 focus:border-red-500':
                    errors.name,
                }"
                placeholder="Enter product name"
              />
              <p v-if="errors.name" class="mt-2 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label
                for="barcode"
                class="block text-sm font-medium text-gray-700"
              >
                Barcode *
              </label>
              <input
                id="barcode"
                v-model="barcode"
                type="text"
                :class="{
                  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500': true,
                  'border-red-300 focus:ring-red-500 focus:border-red-500':
                    errors.barcode,
                }"
                placeholder="Enter barcode"
              />
              <p v-if="errors.barcode" class="mt-2 text-sm text-red-600">
                {{ errors.barcode }}
              </p>
            </div>

            <div>
              <label
                for="price"
                class="block text-sm font-medium text-gray-700"
              >
                Price *
              </label>
              <input
                id="price"
                v-model="price"
                type="number"
                min="0"
                step="0.01"
                :class="{
                  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500': true,
                  'border-red-300 focus:ring-red-500 focus:border-red-500':
                    errors.price,
                }"
                placeholder="0.00"
              />
              <p v-if="errors.price" class="mt-2 text-sm text-red-600">
                {{ errors.price }}
              </p>
            </div>

            <div>
              <label
                for="stock"
                class="block text-sm font-medium text-gray-700"
              >
                Stock *
              </label>
              <input
                id="stock"
                v-model="stock"
                type="number"
                min="0"
                :class="{
                  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500': true,
                  'border-red-300 focus:ring-red-500 focus:border-red-500':
                    errors.stock,
                }"
                placeholder="0"
              />
              <p v-if="errors.stock" class="mt-2 text-sm text-red-600">
                {{ errors.stock }}
              </p>
            </div>
          </div>

          <!-- Optional Information -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Optional Information
            </h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  for="category"
                  class="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <input
                  id="category"
                  v-model="category"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category"
                />
              </div>

              <div>
                <label
                  for="manufacturer"
                  class="block text-sm font-medium text-gray-700"
                >
                  Manufacturer
                </label>
                <input
                  id="manufacturer"
                  v-model="manufacturer"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter manufacturer"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  v-model="description"
                  rows="3"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Medical/Drug Information -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Medical Information
            </h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  for="dosageForm"
                  class="block text-sm font-medium text-gray-700"
                >
                  Dosage Form
                </label>
                <input
                  id="dosageForm"
                  v-model="dosageForm"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Tablet, Capsule, Syrup"
                />
              </div>

              <div>
                <label
                  for="drugClass"
                  class="block text-sm font-medium text-gray-700"
                >
                  Drug Class
                </label>
                <input
                  id="drugClass"
                  v-model="drugClass"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter drug classification"
                />
              </div>

              <div>
                <label
                  for="prescriptionStatus"
                  class="block text-sm font-medium text-gray-700"
                >
                  Prescription Status
                </label>
                <select
                  id="prescriptionStatus"
                  v-model="prescriptionStatus"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OTC">Over-the-Counter</option>
                  <option value="PrescriptionOnly">Prescription Only</option>
                  <option value="Controlled">Controlled Substance</option>
                </select>
              </div>

              <div class="flex items-center">
                <input
                  id="isProprietary"
                  v-model="isProprietary"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  for="isProprietary"
                  class="ml-2 block text-sm text-gray-900"
                >
                  Is Proprietary
                </label>
              </div>

              <div>
                <label
                  for="nonProprietaryName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Non-Proprietary Name
                </label>
                <input
                  id="nonProprietaryName"
                  v-model="nonProprietaryName"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Generic name"
                />
              </div>

              <div>
                <label
                  for="activeIngredient"
                  class="block text-sm font-medium text-gray-700"
                >
                  Active Ingredient
                </label>
                <input
                  id="activeIngredient"
                  v-model="activeIngredient"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter active ingredient"
                />
              </div>

              <div class="sm:col-span-2">
                <label
                  for="contraindication"
                  class="block text-sm font-medium text-gray-700"
                >
                  Contraindication
                </label>
                <textarea
                  id="contraindication"
                  v-model="contraindication"
                  rows="3"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contraindications"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="border-t border-gray-200 pt-6">
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                @click="goBack"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  v-if="isSaving"
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                {{ isSaving ? "Updating..." : "Update Product" }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
