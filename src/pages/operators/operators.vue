<script setup lang="ts">
defineOptions({
  name: 'OperatorsPage'
});

import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useOperatorStore } from "../../stores/operator-store";
import { useAnalytics } from "../../composables/use-analytics";
import type { Operator } from "../../types/operator";

const operatorStore = useOperatorStore();
const operators = ref<Operator[]>([]);
const router = useRouter();
const analytics = useAnalytics();

const selectOperator = (operatorId: string) => {
  const selectedOperator = operators.value.find(op => op._id === operatorId);

  // Track operator selection from list
  analytics.trackAction({
    action: 'operator_selected_from_list',
    category: 'authentication',
    label: selectedOperator?.name || 'unknown',
    metadata: {
      operatorId,
      operatorName: selectedOperator?.name || 'unknown',
      source: 'operators_page',
    },
  });

  operatorStore.setOperator(operatorId).then(() => {
    router.push("/");
  }).catch((error) => {
    analytics.trackError({
      errorType: 'operator_selection_error',
      errorMessage: error instanceof Error ? error.message : String(error),
      context: {
        operatorId,
        source: 'operators_page',
      },
    });
  });
};

onMounted(() => {
  operatorStore.listOperators().then((result) => {
    operators.value = result;
  });
});
</script>
<template>
  <h1>Operators</h1>

  <div v-for="operator in operators" :key="operator._id">
    <button
      type="button"
      @click="selectOperator(operator._id)"
      class="bg-black text-white py-2 px-3 rounded"
    >
      {{ operator.name }}
    </button>
  </div>
</template>
