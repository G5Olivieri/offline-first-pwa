import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getOperatorDB } from "../db";
import type { Operator } from "../types/operator";
import { createLogger } from "../services/logger-service";
import { analytics } from "../services/analytics-service";

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

      // Track operator change
      analytics.trackUserAction({
        action: 'operator_changed',
        category: 'authentication',
        label: newOperator,
        metadata: {
          previousOperator: previousOperator || 'none',
          operatorName: operator.value?.name || 'unknown',
        },
      });

      logger.info("Operator changed", {
        from: previousOperator,
        to: newOperator,
        operatorName: operator.value?.name
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

    // Track operator logout/clear
    analytics.trackUserAction({
      action: 'operator_cleared',
      category: 'authentication',
      label: previousOperator || 'unknown',
      metadata: {
        operatorName: previousOperatorName || 'unknown',
      },
    });

    logger.info("Operator cleared", {
      previousOperator,
      operatorName: previousOperatorName
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
