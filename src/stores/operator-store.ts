import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getOperatorDB } from "../db";
import type { Operator } from "../types/operator";

export const useOperatorStore = defineStore("operatorStore", () => {
  const operatorId = ref<string | null>(
    localStorage.getItem("operator") || null
  );
  const operator = ref<Operator | null>(null);
  const operatorDB = getOperatorDB();

  const setOperator = (newOperator: string): Promise<void> => {
    console.log("Setting operator:", newOperator);
    operatorId.value = newOperator;
    return fetchOperator(newOperator).then(() => {
      localStorage.setItem("operator", newOperator);
    });
  };

  const clearOperator = () => {
    console.log("Clearing operator");
    operatorId.value = null;
    operator.value = null;
    localStorage.removeItem("operator");
  };

  const listOperators = async (): Promise<Operator[]> => {
    console.log("Listing all operators");
    return operatorDB
      .allDocs({ include_docs: true })
      .then((result) => {
        return result.rows.map((row) => row.doc as Operator);
      })
      .catch((error) => {
        console.error("Error fetching operators:", error);
        return [];
      });
  };

  const fetchOperator = async (id: string) => {
    console.log("Fetching operator:", id);
    return operatorDB
      .get(id)
      .then((doc) => {
        operator.value = doc as Operator;
      })
      .catch((error) => {
        console.error("Error fetching operator:", error);
        operator.value = null;
      });
  };

  const createOperator = async (newOperator: {
    name: string;
  }): Promise<Operator> => {
    const operatorData: Operator = {
      _id: crypto.randomUUID(),
      name: newOperator.name,
    };
    await operatorDB.put(operatorData);
    return operatorData;
  };

  onMounted(() => {
    if (operatorId.value) {
      fetchOperator(operatorId.value);
    }
  });

  return {
    operatorId,
    operator,
    setOperator,
    clearOperator,
    listOperators,
    createOperator,
  };
});
