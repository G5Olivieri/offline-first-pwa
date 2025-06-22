import { getOperatorDB } from "@/db";
import { ErrorTrackingPubSub } from "@/error/error-tracking-service";
import { OperatorServiceWithErrorHandlingDecorator } from "./operator-service-with-error-handling-decorator";
import { OperatorPouchDBService } from "./operator-pouchdb-service";
import type { Operator } from "./operator";

let _operatorService: OperatorServiceWithErrorHandlingDecorator | null = null;

export const getOperatorService = async (): Promise<OperatorServiceWithErrorHandlingDecorator> => {
  if (_operatorService) {
    return _operatorService;
  }

  const operatorDB = await getOperatorDB();
  _operatorService = new OperatorServiceWithErrorHandlingDecorator(
    new OperatorPouchDBService(operatorDB),
    new ErrorTrackingPubSub("OperatorService"),
  );

  return _operatorService;
};

// Legacy export for backward compatibility
export const operatorService = {
  async getOperatorByID(id: string) {
    const service = await getOperatorService();
    return service.getOperatorByID(id);
  },
  async createOperator(operator: Pick<Operator, "name">) {
    const service = await getOperatorService();
    return service.createOperator(operator);
  },
  async updateOperator(operator: Operator) {
    const service = await getOperatorService();
    return service.updateOperator(operator);
  },
  async deleteOperator(id: string) {
    const service = await getOperatorService();
    return service.deleteOperator(id);
  },
  async listOperators(options?: { limit?: number; skip?: number }) {
    const service = await getOperatorService();
    return service.listOperators(options);
  },
};
