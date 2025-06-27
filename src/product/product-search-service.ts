import { Document, IndexedDB, type DocumentData } from "flexsearch";

export interface IndexableProduct {
  id: string;
  name: string;
  nonProprietaryName?: string;
  barcode: string;
}

export class ProductSearchService {
  private index = new Document({
    db: new IndexedDB("product-index"),
    commit: true,
    document: {
      id: "id",
      index: [
        { field: "name" },
        { field: "nonProprietaryName" },
        { field: "barcode", tokenize: "exact" },
      ],
      store: true,
    },
  });

  constructor() {}

  async search(
    query: string,
    options: { limit?: number; skip?: number } = {},
  ): Promise<{
    count: number;
    productIds: string[];
    matches?: Array<{ item: IndexableProduct; score: number }>;
  }> {
    const results = await this.index.search(query.trim(), {
      limit: options.limit || 100,
      offset: options.skip || 0,
      cache: true,
    });

    return {
      count: results.length,
      productIds: results.map((r) => r.result).flat() as string[],
    };
  }

  private mapToDocument(product: IndexableProduct): DocumentData {
    return {
      id: product.id,
      name: product.name,
      nonProprietaryName: product.nonProprietaryName || "",
      barcode: product.barcode,
    };
  }

  public async add(product: IndexableProduct): Promise<void> {
    await this.index.add(this.mapToDocument(product));
  }

  public async bulkAdd(products: IndexableProduct[]): Promise<void> {
    await Promise.all(
      products.map((product) => this.index.add(this.mapToDocument(product))),
    );
  }

  public async remove(productId: string): Promise<void> {
    await this.index.remove(productId);
  }

  public async bulkRemove(productIds: string[]): Promise<void> {
    await Promise.all(productIds.map((id) => this.index.remove(id)));
  }

  public async clear(): Promise<void> {
    await this.index.clear();
  }

  isReady(): boolean {
    return true;
  }
}
