import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import { config } from "@/config/env";

const DB_NAME = config.search.dbName;
const DB_VERSION = config.search.dbVersion;
const STORE_NAME = config.search.storeName;
const INDEX_KEY = config.search.indexKey;

interface SearchIndexData {
  id: string;
  timestamp: number;
  fuseIndex: string;
  dataset: Array<IndexableProduct>;
}

// Lightweight product data for indexing
export interface IndexableProduct {
  id: string;
  name: string;
  barcode: string;
}

export class ProductSearchService {
  private fuse: Fuse<IndexableProduct> | null = null;
  private db: IDBDatabase | null = null;
  private docs = new Map<string, IndexableProduct>();

  // Fuse.js configuration optimized for ID-based indexing
  private fuseOptions: IFuseOptions<IndexableProduct> = {
    keys: [
      { name: "name", weight: 0.7 },
      { name: "barcode", weight: 0.3 },
    ],
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 1,
    includeScore: true,
    includeMatches: true,
    findAllMatches: true,
    useExtendedSearch: true,
  };

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = async () => {
        this.db = request.result;

        // Try to load existing index from database
        try {
          const cachedIndex = await this.loadIndexFromCache();

          if (cachedIndex) {
            this.docs = new Map(
              cachedIndex.dataset.map((item) => [item.id, item]),
            );

            const fuseIndex = Fuse.parseIndex(
              JSON.parse(cachedIndex.fuseIndex),
            );

            this.fuse = new Fuse(
              cachedIndex.dataset,
              this.fuseOptions,
              fuseIndex,
            );
          } else {
            this.fuse = new Fuse([], this.fuseOptions);
            this.docs = new Map<string, IndexableProduct>();
          }
        } catch {
          // Failed to load existing search index
        }

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }

  private async saveIndexToCache(): Promise<void> {
    if (!this.fuse) {
      return;
    }
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const fuseIndex = this.fuse.getIndex();
    const searchIndexData: SearchIndexData = {
      id: INDEX_KEY,
      timestamp: Date.now(),
      fuseIndex: JSON.stringify(fuseIndex.toJSON()),
      dataset: Array.from(this.docs.values()),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(searchIndexData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadIndexFromCache(): Promise<SearchIndexData | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(INDEX_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Main search method - searches both name and barcode, returns only product IDs
  search(
    query: string,
    options: { limit?: number; skip?: number } = {},
  ): {
    count: number;
    productIds: string[];
    matches?: FuseResult<IndexableProduct>[];
  } {
    if (!this.fuse) {
      return { count: 0, productIds: [] };
    }

    if (!query.trim()) {
      // Return all product IDs if no query
      const { limit = 100, skip = 0 } = options;
      const allProductIds = Array.from(this.docs.keys());
      const slicedIds = allProductIds.slice(skip, skip + limit);

      return {
        count: allProductIds.length,
        productIds: slicedIds,
      };
    }

    // Perform fuzzy search on both name and barcode
    const results = this.fuse.search(query.trim());

    // Apply pagination
    const { limit = 100, skip = 0 } = options;
    const paginatedResults = results.slice(skip, skip + limit);

    // Extract product IDs from the search results
    const productIds = paginatedResults.map((result) => result.item.id);

    return {
      count: results.length,
      productIds,
      matches: paginatedResults,
    };
  }

  public async add(product: IndexableProduct): Promise<void> {
    if (!this.fuse) {
      return;
    }

    this.docs.set(product.id, product);
    this.fuse.setCollection(Array.from(this.docs.values()));

    await this.saveIndexToCache();
  }

  public async bulkAdd(products: IndexableProduct[]): Promise<void> {
    if (!this.fuse) {
      return;
    }
    products.forEach((product) => {
      this.docs.set(product.id, product);
    });
    this.fuse.setCollection(Array.from(this.docs.values()));
    await this.saveIndexToCache();
  }

  public async remove(productId: string): Promise<void> {
    if (!this.fuse) {
      return;
    }

    this.docs.delete(productId);
    this.fuse.setCollection(Array.from(this.docs.values()));

    await this.saveIndexToCache();
  }

  public async bulkRemove(productIds: string[]): Promise<void> {
    if (!this.fuse) {
      return;
    }

    productIds.forEach((id) => {
      this.docs.delete(id);
    });
    this.fuse.setCollection(Array.from(this.docs.values()));
    await this.saveIndexToCache();
  }

  isReady(): boolean {
    return this.fuse !== null;
  }

  async clearCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(INDEX_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
