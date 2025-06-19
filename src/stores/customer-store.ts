import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getCustomerDB } from "../db";
import { createLogger } from "../services/logger-service";
import type { Customer } from "../types/customer";

export const useCustomerStore = defineStore("customerStore", () => {
  const logger = createLogger("CustomerStore");
  const customerDB = getCustomerDB();
  const customer = ref<Customer | null>(null);
  const customerId = ref<string | null>(
    localStorage.getItem("customerId") || null
  );

  const createCustomer = async ({
    name,
    document,
  }: {
    name: string;
    document: string;
  }): Promise<Customer> => {
    logger.debug("Creating customer:", name, document);
    const newCustomer = { _id: crypto.randomUUID(), name, document };
    await customerDB.put(newCustomer);

    logger.debug("Customer created", {
      customerId: newCustomer._id,
      name,
    });

    return newCustomer;
  };

  const setCustomer = (id: string): Promise<void> => {
    logger.debug("Setting customer:", id);

    const previousCustomer = customerId.value;

    return customerDB.get(id).then((doc) => {
      customerId.value = doc._id;
      localStorage.setItem("customerId", doc._id);
      customer.value = doc;

      logger.debug("Customer changed", {
        from: previousCustomer,
        to: doc._id,
        customerName: doc.name,
      });
    });
  };

  const clearCustomer = async () => {
    logger.debug("Clearing customer");

    const previousCustomer = customerId.value;
    const previousCustomerName = customer.value?.name;

    customerId.value = null;
    customer.value = null;
    localStorage.removeItem("customerId");

    logger.debug("Customer cleared", {
      previousCustomer,
      customerName: previousCustomerName,
    });
  };

  const findByDocument = async (document: string): Promise<Customer | null> => {
    logger.debug("Finding customer by document:", document);

    const result = await customerDB.find({
      selector: { document },
      limit: 1,
    });

    if (result.docs.length > 0) {
      const foundCustomer = result.docs[0] as Customer;
      return foundCustomer;
    } else {
      logger.debug("Customer not found by document", { document });
      return null;
    }
  };

  const fetchAllCustomers = () => {
    logger.debug("Fetching all customers");
    return customerDB
      .allDocs({ include_docs: true })
      .then((result) => {
        return result.rows.map((row) => row.doc as Customer);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
        return [];
      });
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    logger.debug("Deleting customer:", id);
    const customerToDelete = await customerDB.get(id);
    return await customerDB
      .remove(customerToDelete)
      .then((result) => {
        logger.debug("Customer deleted successfully:", result);
        if (customerId.value === id) {
          clearCustomer();
        }
      })
      .catch((error) => {
        console.error("Error deleting customer:", error);
      });
  };

  // Business logic method: Create customer and immediately select it
  const createAndSelectCustomer = async (customerData: {
    name: string;
    document: string;
  }): Promise<void> => {
    logger.debug("Creating and selecting customer:", customerData.name);

    try {
      const newCustomer = await createCustomer(customerData);
      await setCustomer(newCustomer._id);

      logger.debug("Customer created and selected", {
        customerId: newCustomer._id,
        name: customerData.name,
      });
    } catch (error) {
      logger.error("Failed to create and select customer", error);
      throw error;
    }
  };

  onMounted(() => {
    if (customerId.value) {
      setCustomer(customerId.value).catch((error) => {
        logger.error("Error setting customer on mount:", error);
      });
    }
  });

  return {
    customer,
    setCustomer,
    clearCustomer,
    customerId,
    findByDocument,
    createCustomer,
    deleteCustomer,
    fetchAllCustomers,
    createAndSelectCustomer,
  };
});
