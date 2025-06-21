import type { ErrorTracking } from "@/error/error-tracking";
import type { Operator } from "./operator";
import type { OperatorService } from "./operator-service";

export class OperatorServiceWithErrorHandlingDecorator
  implements OperatorService
{
  constructor(
    private readonly operatorService: OperatorService,
    private readonly errorTracking: ErrorTracking,
  ) {}

  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.errorTracking.track(error as Error, context);
      throw error;
    }
  }

  async createOperator(operator: Pick<Operator, "name">): Promise<Operator> {
    return this.withErrorHandling(
      () => this.operatorService.createOperator(operator),
      {
        operation: "createOperator",
        metadata: { operatorName: operator.name },
      },
    );
  }

  async getOperatorByID(id: string): Promise<Operator> {
    return this.withErrorHandling(
      () => this.operatorService.getOperatorByID(id),
      {
        operation: "getOperatorByID",
        metadata: { operatorId: id },
      },
    );
  }

  async listOperators(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    operators: Operator[];
  }> {
    return this.withErrorHandling(
      () => this.operatorService.listOperators(options),
      { operation: "listOperators", metadata: options },
    );
  }

  async updateOperator(operator: Operator): Promise<Operator> {
    return this.withErrorHandling(
      () => this.operatorService.updateOperator(operator),
      {
        operation: "updateOperator",
        metadata: { operatorId: operator._id, operatorName: operator.name },
      },
    );
  }

  async deleteOperator(id: string): Promise<string> {
    return this.withErrorHandling(
      () => this.operatorService.deleteOperator(id),
      {
        operation: "deleteOperator",
        metadata: { operatorId: id },
      },
    );
  }
}
