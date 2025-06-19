import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getOperatorDB } from "../db";
import { createLogger } from "../services/logger-service";
import type { Operator } from "../types/operator";

export const useOperatorStore = defineStore("operatorStore", () => {
  const logger = createLogger("OperatorStore");
  const operatorId = ref<string | null>(
    localStorage.getItem("operator") || null
  );
  const operator = ref<Operator | null>(null);
  const operatorDB = getOperatorDB();

  const setOperator = (newOperator: string): Promise<void> => {
    logger.debug("Setting operator:", newOperator);

    const previousOperator = operatorId.value;
    operatorId.value = newOperator;

    return fetchOperator(newOperator).then(() => {
      localStorage.setItem("operator", newOperator);

      logger.info("Operator changed", {
        from: previousOperator,
        to: newOperator,
        operatorName: operator.value?.name,
      });
    });
  };

  const clearOperator = () => {
    logger.debug("Clearing operator");

    const previousOperator = operatorId.value;
    const previousOperatorName = operator.value?.name;

    operatorId.value = null;
    operator.value = null;
    localStorage.removeItem("operator");

    logger.info("Operator cleared", {
      previousOperator,
      operatorName: previousOperatorName,
    });
  };

  const listOperators = async (): Promise<Operator[]> => {
    logger.debug("Listing all operators");
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
    logger.debug("Fetching operator:", id);
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
    logger.debug("Creating new operator:", newOperator.name);

    try {
      const operatorData: Operator = {
        _id: crypto.randomUUID(),
        name: newOperator.name,
      };

      await operatorDB.put(operatorData);

      logger.info("Operator created successfully", {
        operatorId: operatorData._id,
        name: newOperator.name,
      });

      return operatorData;
    } catch (error) {
      logger.error("Failed to create operator", error);
      throw error;
    }
  };

  // Business logic method: Create operator and immediately select it
  const createAndSelectOperator = async (operatorData: {
    name: string;
  }): Promise<void> => {
    logger.debug("Creating and selecting operator:", operatorData.name);

    try {
      const newOperator = await createOperator(operatorData);

      await setOperator(newOperator._id);

      logger.info("Operator created and selected", {
        operatorId: newOperator._id,
        name: operatorData.name,
      });
    } catch (error) {
      logger.error("Failed to create and select operator", error);
      throw error;
    }
  };

  // Business logic method: Select operator from list (with context)
  const selectOperatorFromList = async (
    operatorId: string,
    operators: Operator[]
  ): Promise<void> => {
    logger.debug("Selecting operator from list:", operatorId);

    const selectedOperator = operators.find((op) => op._id === operatorId);

    try {
      await setOperator(operatorId);
      logger.info("Operator selected from list", {
        operatorId,
        operatorName: selectedOperator?.name,
      });
    } catch (error) {
      logger.error("Failed to select operator from list", error);
      throw error;
    }
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
    createAndSelectOperator,
    selectOperatorFromList,
  };
});
