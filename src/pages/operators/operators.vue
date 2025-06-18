<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useOperatorStore } from "../../stores/operator-store";
import type { Operator } from "../../types/operator";

const operatorStore = useOperatorStore();
const operators = ref<Operator[]>([]);
const router = useRouter();

const selectOperator = (operatorId: string) => {
  operatorStore.setOperator(operatorId).then(() => {
    router.push("/");
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
