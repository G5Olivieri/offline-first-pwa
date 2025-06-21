import type { Operator } from "./operator";

export interface OperatorService {
  createOperator(operator: Pick<Operator, "name">): Promise<Operator>;
  getOperatorByID(id: string): Promise<Operator>;
  listOperators(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    operators: Operator[];
  }>;
  updateOperator(operator: Operator): Promise<Operator>;
  deleteOperator(id: string): Promise<string>;
}
