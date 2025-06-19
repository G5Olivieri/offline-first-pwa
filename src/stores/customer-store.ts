import { defineStore } from "pinia";
import { onMounted, ref } from "vue";
import { getCustomerDB } from "../db";
import type { Customer } from "../types/customer";

export const useCustomerStore = defineStore("customerStore", () => {
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
    const newCustomer = { _id: crypto.randomUUID(), name, document };
    await customerDB.put(newCustomer);

    return newCustomer;
  };

  const setCustomer = (id: string): Promise<void> => {
    return customerDB.get(id).then((doc) => {
      customerId.value = doc._id;
      localStorage.setItem("customerId", doc._id);
      customer.value = doc;
    });
  };

  const clearCustomer = async () => {
    customerId.value = null;
    customer.value = null;
    localStorage.removeItem("customerId");
  };

  const findByDocument = async (document: string): Promise<Customer | null> => {
    const result = await customerDB.find({
      selector: { document },
      limit: 1,
    });

    if (result.docs.length > 0) {
      const foundCustomer = result.docs[0] as Customer;
      return foundCustomer;
    } else {
      return null;
    }
  };

  const fetchAllCustomers = () => {
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
    const customerToDelete = await customerDB.get(id);
    return await customerDB
      .remove(customerToDelete)
      .then(() => {
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
      const newCustomer = await createCustomer(customerData);
      await setCustomer(newCustomer._id);

  };

  onMounted(() => {
    if (customerId.value) {
      setCustomer(customerId.value)
    }
  });

  const selectCustomerFromSearch = async (customerId: string) => {
    await setCustomer(customerId);
  };

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
