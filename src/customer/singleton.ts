import { getCustomerDB } from "@/db";
import { ErrorTrackingService } from "@/error/error-tracking-service";
import { CustomerPouchDBService } from "./customer-pouch-dbservice";
import { CustomerServiceWithErrorHandlingDecorator } from "./customer-service-with-error-handling-decorator";

const customerDB = getCustomerDB();
export const customerService = new CustomerServiceWithErrorHandlingDecorator(
  new CustomerPouchDBService(customerDB),
  new ErrorTrackingService("CustomerService"),
);
