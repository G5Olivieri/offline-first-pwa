import { getProductDB } from "@/product/product-db";
import { ProductSearchService } from "@/product/product-search-service";
import { getTrackingService } from "@/tracking/singleton";
import { ProductPouchDBService } from "./product-pouchdb-service";
import { ProductServiceWithErrorHandlingDecorator } from "./product-service-with-error-handling-decorator";

export const searchService = new ProductSearchService();

let _productService: ProductServiceWithErrorHandlingDecorator | null = null;

export const getProductService =
  async (): Promise<ProductServiceWithErrorHandlingDecorator> => {
    if (_productService) {
      return _productService;
    }

    const productDB = await getProductDB();
    _productService = new ProductServiceWithErrorHandlingDecorator(
      new ProductPouchDBService(productDB, searchService),
      getTrackingService("ProductService"),
    );

    return _productService;
  };
