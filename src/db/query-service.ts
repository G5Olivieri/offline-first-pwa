export interface QueryOptions {
  selector: PouchDB.Find.Selector;
  fields?: string[];
  sort?: { [propName: string]: 'asc' | 'desc' }[];
  limit?: number;
  skip?: number;
  use_index?: string | [string, string];
}

export interface IndexOptions {
  index: {
    fields: string[];
    name?: string;
    ddoc?: string;
    type?: string;
  };
}

export class QueryService {
  private static instance: QueryService;
  private indexCache = new Map<string, Set<string>>();

  private constructor() {}

  static getInstance(): QueryService {
    if (!QueryService.instance) {
      QueryService.instance = new QueryService();
    }
    return QueryService.instance;
  }

  async createIndex(db: PouchDB.Database, options: IndexOptions): Promise<PouchDB.Find.CreateIndexResponse<object>> {
    try {
      const result = await db.createIndex(options);

      const dbName = db.name;
      if (!this.indexCache.has(dbName)) {
        this.indexCache.set(dbName, new Set());
      }

      const indexKey = options.index.fields.join(',');
      this.indexCache.get(dbName)?.add(indexKey);

      return result;
    } catch (error) {
      console.error('Failed to create index:', error);
      throw error;
    }
  }

  async find<T extends object>(db: PouchDB.Database, options: QueryOptions): Promise<PouchDB.Find.FindResponse<T>> {
    try {
      return await db.find(options) as PouchDB.Find.FindResponse<T>;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }

  async explain(db: PouchDB.Database, options: QueryOptions): Promise<object> {
    try {
      // Note: explain method might not be available in all PouchDB versions
      return await (db as PouchDB.Database & { explain: (options: QueryOptions) => Promise<object> }).explain(options);
    } catch (error) {
      console.error('Query explain failed:', error);
      throw error;
    }
  }

  async getIndexes(db: PouchDB.Database): Promise<PouchDB.Find.GetIndexesResponse<object>> {
    try {
      return await db.getIndexes();
    } catch (error) {
      console.error('Failed to get indexes:', error);
      throw error;
    }
  }

  async deleteIndex(db: PouchDB.Database, index: PouchDB.Find.DeleteIndexOptions): Promise<PouchDB.Find.DeleteIndexResponse<object>> {
    try {
      const result = await db.deleteIndex(index);

      const dbName = db.name;
      if (this.indexCache.has(dbName)) {
        // Index key cleanup is simplified since DeleteIndexOptions structure is complex
        this.indexCache.get(dbName)?.clear();
      }

      return result;
    } catch (error) {
      console.error('Failed to delete index:', error);
      throw error;
    }
  }

  hasIndex(dbName: string, fields: string[]): boolean {
    const indexKey = fields.join(',');
    return this.indexCache.get(dbName)?.has(indexKey) ?? false;
  }

  async ensureIndex(db: PouchDB.Database, fields: string[]): Promise<void> {
    const dbName = db.name;

    if (this.hasIndex(dbName, fields)) {
      return;
    }

    await this.createIndex(db, {
      index: { fields }
    });
  }
}

export const queryService = QueryService.getInstance();
