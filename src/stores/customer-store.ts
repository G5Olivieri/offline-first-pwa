import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getCustomerDB } from "../db";
import { createLogger } from "../services/logger-service";
import { analytics } from "../services/analytics-service";

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

    // Track customer creation
    analytics.trackUserAction({
      action: 'customer_created',
      category: 'customer_management',
      label: name,
      metadata: {
        customerId: newCustomer._id,
        hasDocument: !!document,
      },
    });

    logger.info("Customer created", {
      customerId: newCustomer._id,
      name
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

      // Track customer change
      analytics.trackUserAction({
        action: 'customer_changed',
        category: 'customer_management',
        label: doc.name,
        metadata: {
          customerId: doc._id,
          customerName: doc.name,
          previousCustomer: previousCustomer || 'none',
          hasDocument: !!doc.document,
        },
      });

      logger.info("Customer changed", {
        from: previousCustomer,
        to: doc._id,
        customerName: doc.name
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

    // Track customer clear
    analytics.trackUserAction({
      action: 'customer_cleared',
      category: 'customer_management',
      label: previousCustomerName || 'unknown',
      metadata: {
        previousCustomer: previousCustomer || 'none',
        customerName: previousCustomerName || 'unknown',
      },
    });

    logger.info("Customer cleared", {
      previousCustomer,
      customerName: previousCustomerName
    });
  };

  const findByDocument = async (document: string): Promise<Customer | null> => {
    logger.debug("Finding customer by document:", document);

    // Track customer search attempt
    analytics.trackUserAction({
      action: 'customer_search',
      category: 'customer_management',
      label: 'search_by_document',
      metadata: {
        hasDocument: !!document,
        documentLength: document.length,
      },
    });

    const result = await customerDB.find({
      selector: { document },
      limit: 1,
    });

    if (result.docs.length > 0) {
      const foundCustomer = result.docs[0] as Customer;

      // Track successful customer search
      analytics.trackUserAction({
        action: 'customer_search_success',
        category: 'customer_management',
        label: foundCustomer.name,
        metadata: {
          customerId: foundCustomer._id,
          customerName: foundCustomer.name,
          searchDocument: document,
        },
      });

      logger.info("Customer found by document", {
        customerId: foundCustomer._id,
        customerName: foundCustomer.name,
        document
      });

      return foundCustomer;
    } else {
      // Track failed customer search
      analytics.trackUserAction({
        action: 'customer_search_not_found',
        category: 'customer_management',
        label: 'not_found',
        metadata: {
          searchDocument: document,
        },
      });

      logger.info("Customer not found by document", { document });

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
