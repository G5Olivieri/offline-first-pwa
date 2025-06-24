import type { Product } from "@/product/product";

export interface ProductService {
  searchProducts(
    query: string,
    options?: { limit?: number; skip?: number },
  ): Promise<{
    count: number;
    products: Product[];
  }>;
  findProductByBarcode(barcode: string): Promise<Product | null>;
  getProduct(id: string): Promise<Product>;
  // TODO: uncouple this from PouchDB
  changeStock(
    input: Map<string, number>,
  ): Promise<(PouchDB.Core.Error | PouchDB.Core.Response)[]>;
  listProducts(options?: { limit?: number; skip?: number }): Promise<{
    count: number;
    products: Product[];
  }>;
  createProduct(product: Omit<Product, "_id" | "rev">): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<string>;
  // TODO: uncouple this from PouchDB
  bulkInsertProducts(
    products: Product[],
  ): Promise<Array<PouchDB.Core.Response | PouchDB.Core.Error>>;

  count(): Promise<number>;
}
