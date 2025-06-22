import { getCustomerDB } from "@/db";
import { ErrorTrackingPubSub } from "@/error/error-tracking-service";
import { CustomerPouchDBService } from "./customer-pouch-dbservice";
import { CustomerServiceWithErrorHandlingDecorator } from "./customer-service-with-error-handling-decorator";
import type { Customer } from "./customer";

let _customerService: CustomerServiceWithErrorHandlingDecorator | null = null;

export const getCustomerService = async (): Promise<CustomerServiceWithErrorHandlingDecorator> => {
  if (_customerService) {
    return _customerService;
  }

  const customerDB = await getCustomerDB();
  _customerService = new CustomerServiceWithErrorHandlingDecorator(
    new CustomerPouchDBService(customerDB),
    new ErrorTrackingPubSub("CustomerService"),
  );

  return _customerService;
};

// Legacy export for backward compatibility
export const customerService = {
  async getCustomer(id: string) {
    const service = await getCustomerService();
    return service.getCustomerByID(id);
  },
  async listCustomers(options?: { limit?: number; skip?: number }) {
    const service = await getCustomerService();
    return service.listCustomers(options);
  },
  async createCustomer(customer: Pick<Customer, "name" | "document">) {
    const service = await getCustomerService();
    return service.createCustomer(customer);
  },
  async updateCustomer(customer: Customer) {
    const service = await getCustomerService();
    return service.updateCustomer(customer);
  },
  async deleteCustomer(id: string) {
    const service = await getCustomerService();
    return service.deleteCustomer(id);
  },
  async findByDocument(document: string) {
    const service = await getCustomerService();
    return service.findByDocument(document);
  },
};
