<script setup lang="ts">
defineOptions({
  name: 'NewOperator'
});

import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";
import * as z from "zod";
import { router } from "../../router";
import { useOperatorStore } from "../../stores/operator-store";
import { useAnalytics } from "../../composables/use-analytics";

const operatorStore = useOperatorStore();
const analytics = useAnalytics();

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

  // Track operator creation attempt
  analytics.trackAction({
    action: 'operator_create_attempt',
    category: 'authentication',
    label: name,
    metadata: {
      operatorName: name,
      source: 'new_operator_page',
    },
  });

  operatorStore
    .createOperator({ name })
    .then(({ _id }) => {
      // Track successful operator creation and immediate selection
      analytics.trackAction({
        action: 'operator_created_and_selected',
        category: 'authentication',
        label: name,
        metadata: {
          operatorId: _id,
          operatorName: name,
          source: 'new_operator_page',
        },
      });

      operatorStore.setOperator(_id).then(() => {
        router.push("/");
      });
    })
    .catch((error) => {
      // Track operator creation error
      analytics.trackError({
        errorType: 'operator_creation_error',
        errorMessage: error instanceof Error ? error.message : String(error),
        context: {
          operatorName: name,
          source: 'new_operator_page',
        },
      });

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
