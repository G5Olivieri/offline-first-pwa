import type { Customer } from "@/customer/customer";

export interface CustomerService {
  createCustomer(
    customer: Pick<Customer, "name" | "document">,
  ): Promise<Customer>;
  getCustomerByID(id: string): Promise<Customer>;
  findByDocument(document: string): Promise<Customer | null>;
  listCustomers(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    customers: Customer[];
  }>;
  updateCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<string>;
}
