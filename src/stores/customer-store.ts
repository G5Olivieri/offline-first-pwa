import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getCustomerDB } from "../db";
import { analytics } from "../services/analytics-service";
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

    // Track customer creation
    analytics.trackUserAction({
      action: "customer_created",
      category: "customer_management",
      label: name,
      metadata: {
        customerId: newCustomer._id,
        hasDocument: !!document,
      },
    });

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

      // Track customer change
      analytics.trackUserAction({
        action: "customer_changed",
        category: "customer_management",
        label: doc.name,
        metadata: {
          customerId: doc._id,
          customerName: doc.name,
          previousCustomer: previousCustomer || "none",
          hasDocument: !!doc.document,
        },
      });

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

    // Track customer clear
    analytics.trackUserAction({
      action: "customer_cleared",
      category: "customer_management",
      label: previousCustomerName || "unknown",
      metadata: {
        previousCustomer: previousCustomer || "none",
        customerName: previousCustomerName || "unknown",
      },
    });

    logger.debug("Customer cleared", {
      previousCustomer,
      customerName: previousCustomerName,
    });
  };

  const findByDocument = async (document: string): Promise<Customer | null> => {
    logger.debug("Finding customer by document:", document);

    // Track customer search attempt
    analytics.trackUserAction({
      action: "customer_search",
      category: "customer_management",
      label: "search_by_document",
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
        action: "customer_search_success",
        category: "customer_management",
        label: foundCustomer.name,
        metadata: {
          customerId: foundCustomer._id,
          customerName: foundCustomer.name,
          searchDocument: document,
        },
      });

      logger.debug("Customer found by document", {
        customerId: foundCustomer._id,
        customerName: foundCustomer.name,
        document,
      });

      return foundCustomer;
    } else {
      // Track failed customer search
      analytics.trackUserAction({
        action: "customer_search_not_found",
        category: "customer_management",
        label: "not_found",
        metadata: {
          searchDocument: document,
        },
      });

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

    // Track customer creation attempt from form
    analytics.trackUserAction({
      action: "customer_create_attempt",
      category: "customer_management",
      label: customerData.name,
      metadata: {
        customerName: customerData.name,
        hasDocument: !!customerData.document,
        documentLength: customerData.document.length,
        source: "customer_store",
      },
    });

    try {
      const newCustomer = await createCustomer(customerData);

      // Track successful customer creation and immediate selection
      analytics.trackUserAction({
        action: "customer_created_and_selected",
        category: "customer_management",
        label: customerData.name,
        metadata: {
          customerId: newCustomer._id,
          customerName: customerData.name,
          hasDocument: !!customerData.document,
          source: "customer_store",
        },
      });

      await setCustomer(newCustomer._id);

      logger.debug("Customer created and selected", {
        customerId: newCustomer._id,
        name: customerData.name,
      });
    } catch (error) {
      // Track customer creation error
      analytics.trackError({
        errorType: "customer_creation_error",
        errorMessage: error instanceof Error ? error.message : String(error),
        context: {
          customerName: customerData.name,
          source: "customer_store",
        },
      });

      logger.error("Failed to create and select customer", error);
      throw error;
    }
  };

  // Business logic method: Select customer from search results
  const selectCustomerFromSearch = async (
    customerId: string,
    searchDocument: string,
    foundCustomer?: Customer
  ): Promise<void> => {
    logger.debug("Selecting customer from search:", customerId);

    // Track customer selection from search results
    analytics.trackUserAction({
      action: "customer_selected_from_search",
      category: "customer_management",
      label: foundCustomer?.name || "unknown",
      metadata: {
        customerId,
        customerName: foundCustomer?.name || "unknown",
        searchDocument,
        source: "customer_store",
      },
    });

    try {
      await setCustomer(customerId);
      logger.debug("Customer selected from search", {
        customerId,
        customerName: foundCustomer?.name,
      });
    } catch (error) {
      // Track selection error
      analytics.trackError({
        errorType: "customer_selection_error",
        errorMessage: error instanceof Error ? error.message : String(error),
        context: {
          customerId,
          source: "customer_store",
        },
      });

      logger.error("Failed to select customer from search", error);
      throw error;
    }
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
    createAndSelectCustomer,
    selectCustomerFromSearch,
  };
});
