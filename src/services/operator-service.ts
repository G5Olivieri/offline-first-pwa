import { getOperatorDB } from "../db";
import type { Operator } from "../types/operator";

export class OperatorService {
  constructor(private readonly db: PouchDB.Database<Operator>) {}

  async listOperators(): Promise<Operator[]> {
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows.map((row) => row.doc as Operator);
  }

  async getOperatorByID(id: string) {
    return this.db.get(id);
  }

  async create(newOperator: Pick<Operator, "name">): Promise<Operator> {
    const operatorData: Operator = {
      _id: crypto.randomUUID(),
      name: newOperator.name,
    };

    const result = await operatorDB.put(operatorData);
    operatorData._rev = result.rev;

    return operatorData;
  }
}

const operatorDB = getOperatorDB();
export const operatorService = new OperatorService(operatorDB);
