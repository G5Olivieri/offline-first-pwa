import { ValidationError, ConflictError } from "@/error/errors";
import type { Operator } from "./operator";
import type { OperatorService } from "./operator-service";

export class OperatorPouchDBService implements OperatorService {
  constructor(private readonly db: PouchDB.Database<Operator>) {}

  private validateOperator(operator: Partial<Operator>): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!operator.name || operator.name.trim().length === 0) {
      errors.push({ field: "name", message: "Operator name is required" });
    }

    if (operator.name && operator.name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "Operator name must be at least 2 characters long",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Operator validation failed", errors);
    }
  }

  async createOperator(newOperator: Pick<Operator, "name">): Promise<Operator> {
    this.validateOperator(newOperator);

    // Check if operator with this name already exists
    const existingOperator = await this.findByName(newOperator.name);
    if (existingOperator) {
      throw new ConflictError(
        `Operator with name '${newOperator.name}' already exists`,
      );
    }

    const operatorData: Operator = {
      _id: crypto.randomUUID(),
      name: newOperator.name.trim(),
    };

    const result = await this.db.put(operatorData);
    operatorData._rev = result.rev;

    return operatorData;
  }

  async getOperatorByID(id: string): Promise<Operator> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError("Operator ID is required");
    }

    try {
      return await this.db.get(id);
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new Error(`Operator with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByName(name: string): Promise<Operator | null> {
    if (!name || name.trim().length === 0) {
      throw new ValidationError("Operator name is required");
    }

    const result = await this.db.find({
      selector: { name: name.trim() },
      limit: 1,
    });

    return result.docs.length > 0 ? result.docs[0] : null;
  }

  async listOperators({ limit = 100, skip = 0 } = {}): Promise<{
    count: number;
    operators: Operator[];
  }> {
    const count = await this.db.info().then((info) => info.doc_count);

    const operators = await this.db
      .allDocs({ include_docs: true, limit, skip })
      .then((result) => {
        return result.rows.map((row) => row.doc as Operator);
      });

    return {
      count,
      operators,
    };
  }

  async updateOperator(operator: Operator): Promise<Operator> {
    this.validateOperator(operator);

    try {
      const existingOperator = await this.db.get(operator._id);

      // Check for name conflicts with other operators
      if (existingOperator.name !== operator.name) {
        const duplicateOperator = await this.findByName(operator.name);
        if (duplicateOperator && duplicateOperator._id !== operator._id) {
          throw new ConflictError(
            `Operator with name '${operator.name}' already exists`,
          );
        }
      }
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        throw new Error(`Operator with ID ${operator._id} not found`);
      }
      throw error;
    }

    const updatedOperator = {
      ...operator,
      name: operator.name.trim(),
    };

    await this.db.put(updatedOperator);
    return updatedOperator;
  }

  async deleteOperator(id: string): Promise<string> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError("Operator ID is required");
    }

    const operatorToDelete = await this.db.get(id);
    await this.db.remove(operatorToDelete);
    return id;
  }
}
