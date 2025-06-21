import { ValidationError, ConflictError } from "@/error/errors";
import type { Customer } from "@/customer/customer";
import type { CustomerService } from "./customer-service";

export class CustomerPouchDBService implements CustomerService {
  constructor(private readonly db: PouchDB.Database<Customer>) {}

  private validateCustomer(customer: Partial<Customer>): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push({ field: "name", message: "Customer name is required" });
    }

    if (!customer.document || customer.document.trim().length === 0) {
      errors.push({
        field: "document",
        message: "Customer document is required",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Customer validation failed", errors);
    }
  }

  async createCustomer({
    name,
    document,
  }: Pick<Customer, "name" | "document">): Promise<Customer> {
    this.validateCustomer({ name, document });

    // Check if customer with this document already exists
    const existingCustomer = await this.findByDocument(document);
    if (existingCustomer) {
      throw new ConflictError(
        `Customer with document '${document}' already exists`,
      );
    }

    const newCustomer: Customer = { _id: crypto.randomUUID(), name, document };
    const result = await this.db.put(newCustomer);
    newCustomer._rev = result.rev;
    return newCustomer;
  }

  async getCustomerByID(id: string): Promise<Customer> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError("Customer ID is required");
    }

    try {
      const doc = await this.db.get(id);
      return doc as Customer;
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new Error(`Customer with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByDocument(document: string): Promise<Customer | null> {
    if (!document || document.trim().length === 0) {
      throw new ValidationError("Document is required");
    }

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

  async listCustomers({ limit = 100, skip = 0 } = {}): Promise<{
    count: number;
    customers: Customer[];
  }> {
    const count = await this.db.info().then((info) => info.doc_count);

    const customers = await this.db
      .allDocs({ include_docs: true, limit, skip })
      .then((result) => {
        return result.rows.map((row) => row.doc as Customer);
      });

    return {
      count,
      customers,
    };
  }

  async updateCustomer(customer: Customer): Promise<Customer> {
    this.validateCustomer(customer);

    try {
      const existingCustomer = await this.db.get(customer._id);

      // Check for document conflicts with other customers
      if (existingCustomer.document !== customer.document) {
        const duplicateCustomer = await this.findByDocument(customer.document);
        if (duplicateCustomer && duplicateCustomer._id !== customer._id) {
          throw new ConflictError(
            `Customer with document '${customer.document}' already exists`,
          );
        }
      }
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new Error(`Customer with ID ${customer._id} not found`);
      }
      throw error;
    }

    await this.db.put(customer);
    return customer;
  }

  async deleteCustomer(id: string): Promise<string> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError("Customer ID is required");
    }

    const customerToDelete = await this.db.get(id);
    await this.db.remove(customerToDelete);
    return id;
  }
}
