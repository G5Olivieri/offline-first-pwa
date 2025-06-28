import { getOperatorDB } from "@/operator/operator-db";
import { OperatorPouchDBService } from "@/operator/operator-pouchdb-service";
import { OperatorServiceWithErrorHandlingDecorator } from "@/operator/operator-service-with-error-handling-decorator";
import { getTrackingService } from "@/tracking/singleton";

let _operatorService: OperatorServiceWithErrorHandlingDecorator | null = null;

export const getOperatorService =
  async (): Promise<OperatorServiceWithErrorHandlingDecorator> => {
    if (_operatorService) {
      return _operatorService;
    }

    const operatorDB = await getOperatorDB();
    _operatorService = new OperatorServiceWithErrorHandlingDecorator(
      new OperatorPouchDBService(operatorDB),
      getTrackingService("OperatorService"),
    );

    return _operatorService;
  };
