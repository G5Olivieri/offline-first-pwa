import { getOperatorDB } from "@/db";
import { ErrorTrackingService } from "@/error/error-tracking-service";
import { OperatorServiceWithErrorHandlingDecorator } from "./operator-service-with-error-handling-decorator";
import { OperatorPouchDBService } from "./operator-pouchdb-service";

const operatorDB = getOperatorDB();
export const operatorService = new OperatorServiceWithErrorHandlingDecorator(
  new OperatorPouchDBService(operatorDB),
  new ErrorTrackingService("OperatorService"),
);
