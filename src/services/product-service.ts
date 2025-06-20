import { getProductDB } from "../db";
import type { Product } from "../types/product";
import { searchService, SearchService } from "./search-service";

export class ProductService {
  public constructor(
    private readonly db: PouchDB.Database<Product>,
    private readonly search: SearchService
  ) {}

  async searchProducts(query: string, { limit = 100, skip = 0 } = {}) {
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
      })
      .catch(() => {
        return [];
      });

    return {
      count: searchResult.count,
      products: products.filter((p) => p !== null) as Product[],
    };
  }

  async findProductByBarcode(barcode: string) {
    const result = await this.db.find({
      selector: { barcode },
      limit: 1,
    });
    if (result.docs.length > 0) {
      return result.docs[0];
    }
    return null;
  }

  async changeStock(input: Map<string, number>) {
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
      throw new Error(`Errors occurred while fetching products: ${errors}`);
    }
    const productsToUpdate = success.map((result) => ({
      ...result,
      stock: input.get(result._id) ?? result.stock, // Update stock if input has a value for this product
    }));

    this.db.bulkDocs(productsToUpdate).then((response) => {
      return response;
    });
  }

  async listProducts({ limit = 100, skip = 0 } = {}) {
    const count = await this.db.info().then((info) => info.doc_count);

    const result = {
      count,
      products: await this.db
        .allDocs({ include_docs: true, limit, skip })
        .then((result) => {
          return result.rows.map((row) => row.doc as Product);
        })
        .catch(() => {
          return [];
        }),
    };

    return result;
  }

  async createProduct(product: Omit<Product, "_id" | "rev">) {
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
  }

  async updateProduct(product: Product) {
    await this.db.put(product);
    await this.search.add({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
    });

    return product;
  }

  async deleteProduct(id: string) {
    const productToDelete = await this.db.get(id);

    await this.db.remove(productToDelete);
    await this.search.remove(id);

    return id;
  }

  async bulkInsertProducts(products: Product[]) {
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
  }
}

const productDB = getProductDB();
export const productService = new ProductService(productDB, searchService);
