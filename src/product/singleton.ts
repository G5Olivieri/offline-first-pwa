import { getProductDB } from "@/db";
import { ErrorTrackingPubSub } from "@/error/error-tracking-service";
import { ProductSearchService } from "@/product/product-search-service";
import { ProductPouchDBService } from "./product-pouchdb-service";
import { ProductServiceWithErrorHandlingDecorator } from "./product-service-with-error-handling-decorator";

export const searchService = new ProductSearchService();
export const productService = new ProductServiceWithErrorHandlingDecorator(
  new ProductPouchDBService(getProductDB(), searchService),
  new ErrorTrackingPubSub("ProductService"),
);
