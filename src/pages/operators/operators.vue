<script setup lang="ts">
defineOptions({
  name: 'OperatorsPage'
});

import { onMounted, ref } from "vue";
import { useOperatorStore } from "../../stores/operator-store";
import { useNavigationActions } from "../../composables/use-navigation-actions";
import type { Operator } from "../../types/operator";

const operatorStore = useOperatorStore();
const navigation = useNavigationActions();
const operators = ref<Operator[]>([]);

const selectOperator = async (operatorId: string) => {
  try {
    await operatorStore.selectOperatorFromList(operatorId, operators.value);
    navigation.goToHomeAfterSuccess('operator', operators.value.find(op => op._id === operatorId)?.name || 'unknown', 'operators_page');
  } catch (error) {
    console.error("Error selecting operator:", error);
    // Error is already tracked in the store
  }
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
