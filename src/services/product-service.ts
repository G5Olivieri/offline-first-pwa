import { getProductDB } from "../db";
import type { Product } from "../types/product";
import { searchService, SearchService } from "./search-service";
import { errorMiddleware, ValidationError, ConflictError, type ErrorContext } from "../error/error-middleware";
import { errorBus } from "../error/error-event-bus";

export class ProductService {
  public constructor(
    private readonly db: PouchDB.Database<Product>,
    private readonly search: SearchService
  ) {}

  private async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorContext: ErrorContext = {
        operation: context.operation || 'unknown',
        userId: context.userId,
        timestamp: new Date(),
        metadata: context.metadata
      };

      // Handle error through middleware
      await errorMiddleware.handleError(error as Error, errorContext);

      // Emit to error bus
      errorBus.emitError({
        type: this.classifyError(error as Error),
        severity: this.determineSeverity(error as Error),
        message: (error as Error).message,
        source: 'ProductService',
        timestamp: new Date(),
        context: {
          operation: errorContext.operation,
          userId: errorContext.userId,
          timestamp: errorContext.timestamp,
          metadata: errorContext.metadata
        },
        stack: (error as Error).stack
      });

      throw error;
    }
  }

  private classifyError(error: Error): 'network' | 'validation' | 'application' | 'system' {
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'ConflictError') return 'application';
    if (error.message.includes('network') || error.message.includes('fetch')) return 'network';
    if (error.message.includes('quota') || error.message.includes('storage')) return 'system';
    return 'application';
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ValidationError') return 'medium';
    if (error.name === 'ConflictError') return 'medium';
    if (error.message.includes('quota')) return 'critical';
    if (error.message.includes('network')) return 'high';
    return 'low';
  }

  private validateProduct(product: Partial<Product>): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!product.name || product.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name is required' });
    }

    if (!product.barcode || product.barcode.trim().length === 0) {
      errors.push({ field: 'barcode', message: 'Product barcode is required' });
    }

    if (product.price === undefined || product.price < 0) {
      errors.push({ field: 'price', message: 'Product price must be a positive number' });
    }

    if (product.stock !== undefined && product.stock < 0) {
      errors.push({ field: 'stock', message: 'Product stock cannot be negative' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Product validation failed', errors);
    }
  }

  async searchProducts(query: string, { limit = 100, skip = 0 } = {}) {
    return this.withErrorHandling(async () => {
      const searchResult = this.search.search(query, { limit, skip });

      const products = await this.db
        .bulkGet({
          docs: searchResult.productIds.map((id) => ({ id })),
        })
        .then((result) => {
          return result.results.map(
            (r) =>
              ((r.docs && r.docs[0] && "ok" in r.docs[0] && r.docs[0].ok) ||
                null) as Product | null
          );
        });

      return {
        count: searchResult.count,
        products: products.filter((p) => p !== null) as Product[],
      };
    }, { operation: 'searchProducts', metadata: { query, limit, skip } });
  }

  async findProductByBarcode(barcode: string) {
    return this.withErrorHandling(async () => {
      if (!barcode || barcode.trim().length === 0) {
        throw new ValidationError('Barcode is required');
      }

      const result = await this.db.find({
        selector: { barcode },
        limit: 1,
      });

      return result.docs.length > 0 ? result.docs[0] : null;
    }, { operation: 'findProductByBarcode', metadata: { barcode } });
  }

  async getProduct(id: string): Promise<Product> {
    return this.withErrorHandling(async () => {
      if (!id || id.trim().length === 0) {
        throw new ValidationError('Product ID is required');
      }

      try {
        return await this.db.get(id);
      } catch (error) {
        if ((error as { status?: number }).status === 404) {
          throw new Error(`Product with ID ${id} not found`);
        }
        throw error;
      }
    }, { operation: 'getProduct', metadata: { productId: id } });
  }

  async changeStock(input: Map<string, number>) {
    return this.withErrorHandling(async () => {
      if (input.size === 0) {
        throw new ValidationError('No products specified for stock update');
      }

      // Validate stock values
      for (const [id, stock] of input.entries()) {
        if (stock < 0) {
          throw new ValidationError(`Stock cannot be negative for product ${id}`);
        }
      }

      const products = await this.db.bulkGet({
        docs: Array.from(input.keys()).map((id) => ({ id })),
      });

      if (products.results.length === 0) {
        throw new Error("No products found");
      }

      const [success, errors] = products.results.reduce(
        ([success, errors], result) => {
          if (result.docs.length === 0) {
            return [
              success,
              [...errors, new Error(`Product with ID ${result.id} not found`)],
            ];
          }

          if (Object.getOwnPropertyDescriptor(result.docs[0], "error")) {
            return [
              success,
              [
                ...errors,
                new Error(String((result.docs[0] as { error: unknown }).error)),
              ],
            ];
          }
          success.push((result.docs[0] as { ok: Product }).ok);
          return [success, errors];
        },
        [[], []] as [Product[], Error[]]
      );

      if (errors.length > 0) {
        throw new Error(`Errors occurred while fetching products: ${errors.map(e => e.message).join(', ')}`);
      }

      const productsToUpdate = success.map((result) => ({
        ...result,
        stock: input.get(result._id) ?? result.stock,
      }));

      const response = await this.db.bulkDocs(productsToUpdate);
      return response;
    }, { operation: 'changeStock', metadata: { productCount: input.size } });
  }

  async listProducts({ limit = 100, skip = 0 } = {}) {
    return this.withErrorHandling(async () => {
      const count = await this.db.info().then((info) => info.doc_count);

      const products = await this.db
        .allDocs({ include_docs: true, limit, skip })
        .then((result) => {
          return result.rows.map((row) => row.doc as Product);
        });

      return {
        count,
        products,
      };
    }, { operation: 'listProducts', metadata: { limit, skip } });
  }

  async createProduct(product: Omit<Product, "_id" | "rev">) {
    return this.withErrorHandling(async () => {
      // Validate product data
      this.validateProduct(product);

      // Check for duplicate barcode
      const existingProduct = await this.findProductByBarcode(product.barcode);
      if (existingProduct) {
        throw new ConflictError(`Product with barcode '${product.barcode}' already exists`);
      }

      const newProduct = {
        _id: crypto.randomUUID(),
        ...product,
      };

      await this.db.put(newProduct);

      await this.search.add({
        id: newProduct._id,
        name: newProduct.name,
        barcode: newProduct.barcode,
      });

      return newProduct;
    }, { operation: 'createProduct', metadata: { productName: product.name, barcode: product.barcode } });
  }

  async updateProduct(product: Product) {
    return this.withErrorHandling(async () => {
      // Validate product data
      this.validateProduct(product);

      // Check if product exists
      try {
        const existingProduct = await this.db.get(product._id);

        // Check for barcode conflicts with other products
        if (existingProduct.barcode !== product.barcode) {
          const duplicateProduct = await this.findProductByBarcode(product.barcode);
          if (duplicateProduct && duplicateProduct._id !== product._id) {
            throw new ConflictError(`Product with barcode '${product.barcode}' already exists`);
          }
        }
      } catch (error) {
        if ((error as { status?: number }).status === 404) {
          throw new Error(`Product with ID ${product._id} not found`);
        }
        throw error;
      }

      await this.db.put(product);
      await this.search.add({
        id: product._id,
        name: product.name,
        barcode: product.barcode,
      });

      return product;
    }, { operation: 'updateProduct', metadata: { productId: product._id, productName: product.name } });
  }

  async deleteProduct(id: string) {
    return this.withErrorHandling(async () => {
      if (!id || id.trim().length === 0) {
        throw new ValidationError('Product ID is required');
      }

      const productToDelete = await this.db.get(id);

      await this.db.remove(productToDelete);
      await this.search.remove(id);

      return id;
    }, { operation: 'deleteProduct', metadata: { productId: id } });
  }

  async bulkInsertProducts(products: Product[]) {
    return this.withErrorHandling(async () => {
      if (!products || products.length === 0) {
        throw new ValidationError('No products provided for bulk insert');
      }

      // Validate all products
      products.forEach((product, index) => {
        try {
          this.validateProduct(product);
        } catch (error) {
          throw new ValidationError(`Validation failed for product at index ${index}: ${(error as Error).message}`);
        }
      });

      const docs = products.map((product) => ({
        ...product,
        _id: product._id || crypto.randomUUID(),
      }));

      const response = await this.db.bulkDocs(docs);

      const indexableProducts = docs.map((product) => ({
        id: product._id,
        name: product.name,
        barcode: product.barcode,
      }));

      await this.search.bulkAdd(indexableProducts);

      return response;
    }, { operation: 'bulkInsertProducts', metadata: { productCount: products.length } });
  }
}

const productDB = getProductDB();
export const productService = new ProductService(productDB, searchService);
