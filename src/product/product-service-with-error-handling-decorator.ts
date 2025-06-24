import type { ErrorTracking } from "@/error/error-tracking";
import type { Product } from "@/product/product";
import type { ProductService } from "./product-service";

export class ProductServiceWithErrorHandlingDecorator
  implements ProductService
{
  constructor(
    private readonly productService: ProductService,
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

  async searchProducts(
    query: string,
    options?: { limit?: number; skip?: number },
  ): Promise<{ count: number; products: Product[] }> {
    return this.withErrorHandling(
      () => this.productService.searchProducts(query, options),
      { operation: "searchProducts", metadata: { query, ...options } },
    );
  }

  async findProductByBarcode(barcode: string): Promise<Product | null> {
    return this.withErrorHandling(
      () => this.productService.findProductByBarcode(barcode),
      { operation: "findProductByBarcode", metadata: { barcode } },
    );
  }

  async getProduct(id: string): Promise<Product> {
    return this.withErrorHandling(() => this.productService.getProduct(id), {
      operation: "getProduct",
      metadata: { productId: id },
    });
  }

  async changeStock(
    input: Map<string, number>,
  ): Promise<(PouchDB.Core.Error | PouchDB.Core.Response)[]> {
    return this.withErrorHandling(
      () => this.productService.changeStock(input),
      { operation: "changeStock", metadata: { productCount: input.size } },
    );
  }

  async listProducts(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    products: Product[];
  }> {
    return this.withErrorHandling(
      () => this.productService.listProducts(options),
      { operation: "listProducts", metadata: options },
    );
  }
  async createProduct(product: Omit<Product, "_id" | "rev">): Promise<Product> {
    return this.withErrorHandling(
      () => this.productService.createProduct(product),
      {
        operation: "createProduct",
        metadata: { productName: product.name, barcode: product.barcode },
      },
    );
  }

  async updateProduct(product: Product): Promise<Product> {
    return this.withErrorHandling(
      () => this.productService.updateProduct(product),
      {
        operation: "updateProduct",
        metadata: { productId: product._id, productName: product.name },
      },
    );
  }

  async deleteProduct(id: string): Promise<string> {
    return this.withErrorHandling(() => this.productService.deleteProduct(id), {
      operation: "deleteProduct",
      metadata: { productId: id },
    });
  }

  async bulkInsertProducts(
    products: Product[],
  ): Promise<Array<PouchDB.Core.Response | PouchDB.Core.Error>> {
    return this.withErrorHandling(
      () => this.productService.bulkInsertProducts(products),
      {
        operation: "bulkInsertProducts",
        metadata: { productCount: products.length },
      },
    );
  }
  async count(): Promise<number> {
    return this.withErrorHandling(() => this.productService.count(), {
      operation: "count",
    });
  }
}
