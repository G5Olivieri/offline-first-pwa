import { config } from "@/config/env";

let _PouchDB: PouchDB.Static | null = null;

export class PouchDBFactory {
  static async createPouchDB(): Promise<PouchDB.Static> {
    if (_PouchDB) {
      return _PouchDB;
    }

    _PouchDB = (await import("pouchdb-core")).default;
    const HttpPouch = (await import("pouchdb-adapter-http")).default;
    const mapreduce = (await import("pouchdb-mapreduce")).default;
    const replication = (await import("pouchdb-replication")).default;
    switch (config.pouchdb.adapter) {
      case "idb": {
        const PouchDBIdb = (await import("pouchdb-adapter-idb")).default;
        _PouchDB.plugin(PouchDBIdb);
        break;
      }
      case "memory": {
        const PouchDBMemoryAdapter = (await import("pouchdb-adapter-memory")).default;
        _PouchDB.plugin(PouchDBMemoryAdapter);
        break;
      }
      default:
        throw new Error(
          `Unsupported PouchDB adapter: ${config.pouchdb.adapter}. Please check your configuration.`
        );
    }
    _PouchDB.plugin(HttpPouch).plugin(mapreduce).plugin(replication);
    _PouchDB.defaults({
      adapter: config.pouchdb.adapter,
    });
    return _PouchDB;
  }
}
