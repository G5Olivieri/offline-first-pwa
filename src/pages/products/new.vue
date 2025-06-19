<script setup lang="ts">
defineOptions({
  name: "NewProduct",
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as z from "zod";
import { useProductStore } from "../../stores/product-store";

const productStore = useProductStore();
const router = useRouter();

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
  })
);

const { handleSubmit, errors } = useForm({
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
  "OTC" | "Prescription" | "Controlled"
>("prescriptionStatus");
const { value: contraindication } = useField<string>("contraindication");
const { value: activeIngredient } = useField<string>("activeIngredient");

const onSubmit = handleSubmit((values) => {
  const productData = {
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

  productStore
    .createProduct(productData)
    .then(() => {
      router.push("/products");
    })
    .catch((error) => {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    });
});
</script>
<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow-lg rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h1 class="text-2xl font-bold text-gray-900">New Product</h1>
          <p class="mt-1 text-sm text-gray-600">
            Add a new product to your inventory
          </p>
        </div>

        <form @submit="onSubmit" class="px-6 py-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="name" class="block text-sm font-medium text-gray-700">
                Product Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter product name"
                v-model="name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.name }"
              />
              <span v-if="errors.name" class="text-sm text-red-600">{{
                errors.name
              }}</span>
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.barcode }"
              />
              <span v-if="errors.barcode" class="text-sm text-red-600">{{
                errors.barcode
              }}</span>
            </div>

            <div class="space-y-2">
              <label
                for="price"
                class="block text-sm font-medium text-gray-700"
              >
                Price ($) <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="price"
                name="price"
                placeholder="0.00"
                v-model="price"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.price }"
              />
              <span v-if="errors.price" class="text-sm text-red-600">{{
                errors.price
              }}</span>
            </div>

            <div class="space-y-2">
              <label
                for="stock"
                class="block text-sm font-medium text-gray-700"
              >
                Stock Quantity <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                placeholder="0"
                v-model="stock"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-red-500': errors.stock }"
              />
              <span v-if="errors.stock" class="text-sm text-red-600">{{
                errors.stock
              }}</span>
            </div>
          </div>

          <!-- Product Details -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Product Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="category"
                  class="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  v-model="category"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Medications">Medications</option>
                  <option value="Supplements">Supplements</option>
                  <option value="Medical Devices">Medical Devices</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="First Aid">First Aid</option>
                  <option value="Other">Other</option>
                </select>
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Drug Information -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Drug Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  for="dosageForm"
                  class="block text-sm font-medium text-gray-700"
                >
                  Dosage Form
                </label>
                <select
                  id="dosageForm"
                  name="dosageForm"
                  v-model="dosageForm"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select dosage form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Patch">Patch</option>
                  <option value="Drops">Drops</option>
                  <option value="Other">Other</option>
                </select>
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
                  placeholder="e.g., Analgesic, Antibiotic"
                  v-model="drugClass"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div class="space-y-2">
                <label
                  for="nonProprietaryName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Generic Name
                </label>
                <input
                  type="text"
                  id="nonProprietaryName"
                  name="nonProprietaryName"
                  placeholder="Enter generic name"
                  v-model="nonProprietaryName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="OTC">Over-the-Counter (OTC)</option>
                  <option value="PrescriptionOnly">Prescription Required</option>
                  <option value="Controlled">Controlled Substance</option>
                </select>
              </div>

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
                  placeholder="e.g., Acetaminophen, Ibuprofen"
                  v-model="activeIngredient"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div class="mt-6 space-y-6">
              <div class="space-y-2">
                <label
                  for="contraindication"
                  class="block text-sm font-medium text-gray-700"
                >
                  Contraindications
                </label>
                <textarea
                  id="contraindication"
                  name="contraindication"
                  rows="3"
                  placeholder="List any contraindications, allergies, or conditions where this product should not be used"
                  v-model="contraindication"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            <div class="mt-6 flex items-center space-x-3">
              <input
                type="checkbox"
                id="isProprietary"
                name="isProprietary"
                v-model="isProprietary"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                for="isProprietary"
                class="text-sm font-medium text-gray-700"
              >
                Brand Name Product (Proprietary)
              </label>
            </div>
          </div>

          <!-- Description -->
          <div class="border-t border-gray-200 pt-6">
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
                rows="4"
                placeholder="Enter product description, indications, or additional notes"
                v-model="description"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="border-t border-gray-200 pt-6 flex justify-end space-x-4">
            <button
              type="button"
              @click="router.push('/products')"
              class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
