import { getCustomerDB } from "@/customer/customer-db";
import { CustomerPouchDBService } from "@/customer/customer-pouch-dbservice";
import type { CustomerService } from "@/customer/customer-service";
import { CustomerServiceWithErrorHandlingDecorator } from "@/customer/customer-service-with-error-handling-decorator";
import { ErrorTrackingPubSub } from "@/error/error-tracking-pubsub";

let _customerService: CustomerService | null = null;

export const getCustomerService = async (): Promise<CustomerService> => {
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
