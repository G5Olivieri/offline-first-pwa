import { getCustomerDB } from "../db";
import type { Customer } from "../types/customer";

export class CustomerService {
  constructor(private readonly db: PouchDB.Database<Customer>) {}

  async createCustomer({
    name,
    document,
  }: Pick<Customer, "name" | "document">): Promise<Customer> {
    const newCustomer: Customer = { _id: crypto.randomUUID(), name, document };
    const result = await this.db.put(newCustomer);
    newCustomer._rev = result.rev;
    return newCustomer;
  }

  async getCustomerByID(id: string): Promise<Customer | null> {
    const doc = await this.db.get(id);
    return doc as Customer;
  }

  async findByDocument(document: string): Promise<Customer | null> {
    const result = await this.db.find({
      selector: { document },
      limit: 1,
    });

    if (result.docs.length > 0) {
      const foundCustomer = result.docs[0] as Customer;
      return foundCustomer;
    } else {
      return null;
    }
  }

  async listCustomers({ limit = 100, skip = 0 } = {}): Promise<Customer[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        limit,
        skip,
      });
      return result.rows.map((row) => row.doc as Customer);
    } catch {
      return [];
    }
  }

  async deleteCustomer(id: string) {
    const customerToDelete = await this.db.get(id);
    return this.db.remove(customerToDelete);
  }
}

export const customerService = new CustomerService(getCustomerDB());
