import { getProductDB } from "@/db";
import { ErrorTrackingPubSub } from "@/error/error-tracking-service";
import { ProductSearchService } from "@/product/product-search-service";
import { ProductPouchDBService } from "./product-pouchdb-service";
import { ProductServiceWithErrorHandlingDecorator } from "./product-service-with-error-handling-decorator";
import type { Product } from "./product";

export const searchService = new ProductSearchService();

let _productService: ProductServiceWithErrorHandlingDecorator | null = null;

export const getProductService = async (): Promise<ProductServiceWithErrorHandlingDecorator> => {
  if (_productService) {
    return _productService;
  }

  const productDB = await getProductDB();
  _productService = new ProductServiceWithErrorHandlingDecorator(
    new ProductPouchDBService(productDB, searchService),
    new ErrorTrackingPubSub("ProductService"),
  );

  return _productService;
};

// Legacy export for backward compatibility (will be deprecated)
export const productService = {
  async getAllProducts() {
    const service = await getProductService();
    return service.listProducts();
  },
  async getProductById(id: string) {
    const service = await getProductService();
    return service.getProduct(id);
  },
  async createProduct(product: Omit<Product, "_id" | "rev">) {
    const service = await getProductService();
    return service.createProduct(product);
  },
  async updateProduct(product: Product) {
    const service = await getProductService();
    return service.updateProduct(product);
  },
  async deleteProduct(id: string) {
    const service = await getProductService();
    return service.deleteProduct(id);
  },
  async searchProducts(query: string) {
    const service = await getProductService();
    return service.searchProducts(query);
  },
  async getProductByBarcode(barcode: string) {
    const service = await getProductService();
    return service.findProductByBarcode(barcode);
  },
  async bulkInsertProducts(products: Product[]) {
    const service = await getProductService();
    return service.bulkInsertProducts(products);
  },
  async listProducts(options?: { limit?: number; skip?: number }) {
    const service = await getProductService();
    return service.listProducts(options);
  },
  async changeStock(input: Map<string, number>) {
    const service = await getProductService();
    return service.changeStock(input);
  },
  async getProduct(id: string) {
    const service = await getProductService();
    return service.getProduct(id);
  },
};
