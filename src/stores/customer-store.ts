import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getCustomerDB } from "../db";
import { createLogger } from "../services/logger-service";

export type Customer = {
  _id: string;
  _rev?: string;
  name: string;
  document: string;
};

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
    return newCustomer;
  };

  const setCustomer = (id: string): Promise<void> => {
    logger.debug("Setting customer:", id);
    return customerDB.get(id).then((doc) => {
      customerId.value = doc._id;
      localStorage.setItem("customerId", doc._id);
      customer.value = doc;
    });
  };

  const clearCustomer = async () => {
    logger.debug("Clearing customer");
    customerId.value = null;
    customer.value = null;
    localStorage.removeItem("customerId");
  };

  const findByDocument = async (document: string): Promise<Customer | null> => {
    logger.debug("Finding customer by document:", document);
    const result = await customerDB.find({
      selector: { document },
      limit: 1,
    });
    if (result.docs.length > 0) {
      return result.docs[0] as Customer;
    }
    return null;
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

  onMounted(() => {
    if (customerId.value) {
      setCustomer(customerId.value).catch((error) => {
        console.error("Error setting customer on mount:", error);
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
  };
});
