import type { ErrorContext } from "@/error/error-middleware";
import type { ErrorTracking } from "@/error/error-tracking";
import type { Customer } from "@/customer/customer";
import type { CustomerService } from "./customer-service";

export class CustomerServiceWithErrorHandlingDecorator
  implements CustomerService
{
  constructor(
    private readonly customerService: CustomerService,
    private readonly errorTracking: ErrorTracking,
  ) {}

  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.errorTracking.track(error as Error, context);
      throw error;
    }
  }

  async createCustomer(
    customer: Pick<Customer, "name" | "document">,
  ): Promise<Customer> {
    return this.withErrorHandling(
      () => this.customerService.createCustomer(customer),
      {
        operation: "createCustomer",
        metadata: { customerName: customer.name, document: customer.document },
      },
    );
  }

  async getCustomerByID(id: string): Promise<Customer> {
    return this.withErrorHandling(
      () => this.customerService.getCustomerByID(id),
      {
        operation: "getCustomerByID",
        metadata: { customerId: id },
      },
    );
  }

  async findByDocument(document: string): Promise<Customer | null> {
    return this.withErrorHandling(
      () => this.customerService.findByDocument(document),
      { operation: "findByDocument", metadata: { document } },
    );
  }

  async listCustomers(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    customers: Customer[];
  }> {
    return this.withErrorHandling(
      () => this.customerService.listCustomers(options),
      { operation: "listCustomers", metadata: options },
    );
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    return this.withErrorHandling(
      () => this.customerService.updateCustomer(customer),
      {
        operation: "updateCustomer",
        metadata: { customerId: customer._id, customerName: customer.name },
      },
    );
  }

  async deleteCustomer(id: string): Promise<string> {
    return this.withErrorHandling(
      () => this.customerService.deleteCustomer(id),
      {
        operation: "deleteCustomer",
        metadata: { customerId: id },
      },
    );
  }
}
