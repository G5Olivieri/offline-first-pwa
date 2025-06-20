<script setup lang="ts">
defineOptions({
  name: "NewOperator",
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as z from "zod";
import { operatorService } from "@/services/operator-service";
import { useOrderStore } from "@/stores/order-store";

const router = useRouter();

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Name is required"),
  }),
);

const { handleSubmit, errors } = useForm({
  validationSchema,
});

const { value: name } = useField("name");
const orderStore = useOrderStore();

const onSubmit = handleSubmit(async (values) => {
  const { name } = values;

  try {
    const operator = await operatorService.create({ name });
    orderStore.selectOperator(operator);
    router.push({ name: "home" });
  } catch (error) {
    console.error("Error creating operator:", error);
    alert("Failed to create operator. Please try again.");
  }
});
</script>
<template>
  <h1>New operator</h1>
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
    <button class="py-2 px-3 bg-zinc-800 text-white rounded" type="submit">
      Create Operator
    </button>
  </form>
</template>
