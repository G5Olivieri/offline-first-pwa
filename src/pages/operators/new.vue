<script setup lang="ts">
defineOptions({
  name: 'NewOperator'
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import * as z from "zod";
import { router } from "../../router";
import { useOperatorStore } from "../../stores/operator-store";

const operatorStore = useOperatorStore();

const validationSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Name is required"),
  })
);

const { handleSubmit, errors } = useForm({
  validationSchema,
});

const { value: name } = useField("name");

const onSubmit = handleSubmit((values) => {
  const { name } = values;
  operatorStore
    .createOperator({ name })
    .then(({ _id }) => {
      operatorStore.setOperator(_id).then(() => {
        router.push("/");
      });
    })
    .catch((error) => {
      console.error("Error creating operator:", error);
      alert("Failed to create operator. Please try again.");
    });
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
