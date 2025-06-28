import type { Customer } from "@/customer/customer";
import type { CustomerService } from "@/customer/customer-service";
import type { Tracking } from "@/tracking/tracking";
import { EventType } from "@/tracking/tracking";

export class CustomerServiceWithErrorHandlingDecorator
  implements CustomerService
{
  constructor(
    private readonly customerService: CustomerService,
    private readonly tracking: Tracking,
  ) {}

  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.tracking.track(EventType.ERROR, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
      });
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
