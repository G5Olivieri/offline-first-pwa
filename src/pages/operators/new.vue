<script setup lang="ts">
defineOptions({
  name: 'NewOperator'
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import * as z from "zod";
import { useOperatorStore } from "../../stores/operator-store";
import { useRouter } from "vue-router";

const operatorStore = useOperatorStore();
const router = useRouter();

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Name is required"),
  })
);

const { handleSubmit, errors } = useForm({
  validationSchema,
});

const { value: name } = useField("name");

const onSubmit = handleSubmit(async (values) => {
  const { name } = values;

  try {
    await operatorStore.createAndSelectOperator({ name });
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
