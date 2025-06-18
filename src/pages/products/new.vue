<script setup lang="ts">
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
    barcode: z.string().min(1, "Barcode must be at least 10 characters long"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    stock: z.number().min(0, "Stock must be a positive number"),
  })
);

const { handleSubmit, errors } = useForm({
  validationSchema,
});

const { value: name } = useField("name");
const { value: barcode } = useField("barcode");
const { value: price } = useField("price");
const { value: stock } = useField("stock");

const onSubmit = handleSubmit((values) => {
  const { name, barcode, price, stock } = values;
  productStore
    .createProduct({ name, barcode, price, stock })
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
  <h1>New product</h1>
  <form @submit="onSubmit">
    <div>
      <label for="name">name</label>
      <input
        type="text"
        id="name"
        name="name"
        placeholder="Name"
        v-model="name"
      />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>
    <div>
      <label for="barcode">Barcode</label>
      <input
        type="text"
        id="barcode"
        name="barcode"
        placeholder="Barcode"
        v-model="barcode"
      />
      <span v-if="errors.barcode">{{ errors.barcode }}</span>
    </div>
    <div>
      <label for="price">Price</label>
      <input
        type="string"
        id="price"
        name="price"
        placeholder="Price"
        v-model="price"
      />
      <span v-if="errors.price">{{ errors.price }}</span>
    </div>
    <div>
      <label for="stock">Stock</label>
      <input
        type="number"
        id="stock"
        name="stock"
        placeholder="Stock"
        v-model="stock"
      />
      <span v-if="errors.stock">{{ errors.stock }}</span>
    </div>
    <button class="py-2 px-3 bg-zinc-800 text-white rounded" type="submit">
      Create Product
    </button>
  </form>
</template>
