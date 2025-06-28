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

          <form @submit.prevent="onSubmit" class="px-6 py-6 space-y-6">
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
                  v-model="name"
                  v-bind="nameAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': errors.name }"
                />
                <span v-if="errors.name" class="text-sm text-red-600">
                  {{ errors.name }}
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
                  v-model="barcode"
                  v-bind="barcodeAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': errors.barcode }"
                />
                <span v-if="errors.barcode" class="text-sm text-red-600">
                  {{ errors.barcode }}
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
                  v-model.number="price"
                  v-bind="priceAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': errors.price }"
                />
                <span v-if="errors.price" class="text-sm text-red-600">
                  {{ errors.price }}
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
                  v-model.number="stock"
                  v-bind="stockAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  :class="{ 'border-red-500': errors.stock }"
                />
                <span v-if="errors.stock" class="text-sm text-red-600">
                  {{ errors.stock }}
                </span>
              </div>
            </div>

            <!-- Optional Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="activeIngredient"
                  class="block text-sm font-medium text-gray-700"
                >
                  Active Ingredient
                </label>
                <input
                  type="text"
                  id="activeIngredient"
                  name="activeIngredient"
                  placeholder="Enter active ingredient"
                  v-model="activeIngredient"
                  v-bind="activeIngredientAttrs"
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
                  v-model="manufacturer"
                  v-bind="manufacturerAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
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
                v-model="category"
                v-bind="categoryAttrs"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
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
                v-model="description"
                v-bind="descriptionAttrs"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            <!-- Additional Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="dosageForm"
                  class="block text-sm font-medium text-gray-700"
                >
                  Dosage Form
                </label>
                <input
                  type="text"
                  id="dosageForm"
                  name="dosageForm"
                  placeholder="Enter dosage form"
                  v-model="dosageForm"
                  v-bind="dosageFormAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="drugClass"
                  class="block text-sm font-medium text-gray-700"
                >
                  Drug Class
                </label>
                <input
                  type="text"
                  id="drugClass"
                  name="drugClass"
                  placeholder="Enter drug class"
                  v-model="drugClass"
                  v-bind="drugClassAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="isProprietary"
                  class="block text-sm font-medium text-gray-700"
                >
                  Proprietary
                </label>
                <input
                  type="checkbox"
                  id="isProprietary"
                  name="isProprietary"
                  v-model="isProprietary"
                  v-bind="isProprietaryAttrs"
                  :disabled="isSubmitting"
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="nonProprietaryName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Non-Proprietary Name
                </label>
                <input
                  type="text"
                  id="nonProprietaryName"
                  name="nonProprietaryName"
                  placeholder="Enter non-proprietary name"
                  v-model="nonProprietaryName"
                  v-bind="nonProprietaryNameAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="prescriptionStatus"
                  class="block text-sm font-medium text-gray-700"
                >
                  Prescription Status
                </label>
                <select
                  id="prescriptionStatus"
                  name="prescriptionStatus"
                  v-model="prescriptionStatus"
                  v-bind="prescriptionStatusAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="OTC">OTC</option>
                  <option value="PrescriptionOnly">Prescription Only</option>
                  <option value="Controlled">Controlled</option>
                </select>
              </div>

              <div class="space-y-2">
                <label
                  for="contraindication"
                  class="block text-sm font-medium text-gray-700"
                >
                  Contraindication
                </label>
                <textarea
                  id="contraindication"
                  name="contraindication"
                  rows="3"
                  placeholder="Enter contraindication"
                  v-model="contraindication"
                  v-bind="contraindicationAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                ></textarea>
              </div>

              <div class="space-y-2">
                <label
                  for="tags"
                  class="block text-sm font-medium text-gray-700"
                >
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  placeholder="Enter tags separated by commas"
                  v-model="tags"
                  v-bind="tagsAttrs"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
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
                :disabled="isSubmitting || !meta.valid"
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
import ErrorBoundary from "@/components/error-boundary.vue";
import { getProductService } from "@/product/get-product-service";
import type { Product } from "@/product/product";
import { trackingService } from "@/tracking/singleton";
import { EventType } from "@/tracking/tracking";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
defineOptions({
  name: "NewProduct",
});

const router = useRouter();
const isSubmitting = ref(false);

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  barcode: z
    .string()
    .min(8, "Barcode must be at least 8 characters long")
    .trim(),
  price: z.number().min(0, "Price must be a positive number"),
  stock: z
    .number()
    .min(0, "Stock cannot be negative")
    .int("Stock must be a whole number"),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  dosageForm: z.string().optional(),
  drugClass: z.string().optional(),
  isProprietary: z.boolean().optional(),
  nonProprietaryName: z.string().optional(),
  prescriptionStatus: z
    .enum(["OTC", "PrescriptionOnly", "Controlled"])
    .optional(),
  contraindication: z.string().optional(),
  activeIngredient: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const { handleSubmit, errors, defineField, meta } = useForm<ProductFormData>({
  validationSchema: toTypedSchema(productSchema),
  initialValues: {
    name: "",
    barcode: "",
    price: 0,
    stock: 0,
    category: "",
    manufacturer: "",
    description: "",
    dosageForm: "",
    drugClass: "",
    isProprietary: false,
    nonProprietaryName: "",
    prescriptionStatus: "OTC",
    contraindication: "",
    activeIngredient: "",
    tags: "",
  },
});

const [name, nameAttrs] = defineField("name");
const [barcode, barcodeAttrs] = defineField("barcode");
const [price, priceAttrs] = defineField("price");
const [stock, stockAttrs] = defineField("stock");
const [category, categoryAttrs] = defineField("category");
const [manufacturer, manufacturerAttrs] = defineField("manufacturer");
const [description, descriptionAttrs] = defineField("description");
const [dosageForm, dosageFormAttrs] = defineField("dosageForm");
const [drugClass, drugClassAttrs] = defineField("drugClass");
const [isProprietary, isProprietaryAttrs] = defineField("isProprietary");
const [nonProprietaryName, nonProprietaryNameAttrs] =
  defineField("nonProprietaryName");
const [prescriptionStatus, prescriptionStatusAttrs] =
  defineField("prescriptionStatus");
const [contraindication, contraindicationAttrs] =
  defineField("contraindication");
const [activeIngredient, activeIngredientAttrs] =
  defineField("activeIngredient");
const [tags, tagsAttrs] = defineField("tags");

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true;

  try {
    const productService = await getProductService();
    trackingService.track(EventType.USER, {
      eventType: "create_product",
      values,
    });

    const productData: Omit<Product, "_id" | "rev"> = {
      name: values.name,
      barcode: values.barcode,
      price: values.price,
      stock: values.stock,
      ...(values.category &&
        values.category.trim() && { category: values.category.trim() }),
      ...(values.manufacturer &&
        values.manufacturer.trim() && {
          manufacturer: values.manufacturer.trim(),
        }),
      ...(values.description &&
        values.description.trim() && {
          description: values.description.trim(),
        }),
      ...(values.dosageForm &&
        values.dosageForm.trim() && { dosageForm: values.dosageForm.trim() }),
      ...(values.drugClass &&
        values.drugClass.trim() && { drugClass: values.drugClass.trim() }),
      ...(values.isProprietary !== undefined && {
        isProprietary: values.isProprietary,
      }),
      ...(values.nonProprietaryName &&
        values.nonProprietaryName.trim() && {
          nonProprietaryName: values.nonProprietaryName.trim(),
        }),
      ...(values.prescriptionStatus && {
        prescriptionStatus: values.prescriptionStatus,
      }),
      ...(values.contraindication &&
        values.contraindication.trim() && {
          contraindication: values.contraindication.trim(),
        }),
      ...(values.activeIngredient &&
        values.activeIngredient.trim() && {
          activeIngredient: values.activeIngredient.trim(),
        }),
      ...(values.tags &&
        values.tags.trim() && {
          tags: values.tags.split(",").map((tag) => tag.trim()),
        }),
    };

    await productService.createProduct(productData);
    router.push("/products");
  } finally {
    isSubmitting.value = false;
  }
});

const handleCancel = () => {
  trackingService.track(EventType.USER, {
    eventType: "cancel_create_product",
  });
  router.push("/products");
};

const handleRetry = () => {
  trackingService.track(EventType.USER, {
    eventType: "retry_create_product",
  });
  console.log("Retrying form operation...");
};
</script>
