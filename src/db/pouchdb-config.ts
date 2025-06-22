// Modular PouchDB setup - lazy load plugins for better code splitting
import PouchDBCore from "pouchdb-core";

// Base PouchDB with only core functionality
const BasePouchDB = PouchDBCore;

// Lazy plugin loaders for better code splitting
let _PouchDBWithIDB: typeof PouchDBCore | null = null;
let _PouchDBWithHTTP: typeof PouchDBCore | null = null;
let _PouchDBWithSync: typeof PouchDBCore | null = null;
let _PouchDBWithFind: typeof PouchDBCore | null = null;
let _PouchDBWithMapReduce: typeof PouchDBCore | null = null;
let _FullPouchDB: typeof PouchDBCore | null = null;

// Get PouchDB with IDB adapter (for offline storage)
export const getPouchDBWithIDB = async (): Promise<typeof PouchDBCore> => {
  if (!_PouchDBWithIDB) {
    const IDBAdapter = (await import("pouchdb-adapter-idb")).default;
    _PouchDBWithIDB = BasePouchDB.plugin(IDBAdapter);
  }
  return _PouchDBWithIDB;
};

// Get PouchDB with HTTP adapter (for remote connections)
export const getPouchDBWithHTTP = async (): Promise<typeof PouchDBCore> => {
  if (!_PouchDBWithHTTP) {
    const HttpAdapter = (await import("pouchdb-adapter-http")).default;
    _PouchDBWithHTTP = BasePouchDB.plugin(HttpAdapter);
  }
  return _PouchDBWithHTTP;
};

// Get PouchDB with sync capabilities
export const getPouchDBWithSync = async (): Promise<typeof PouchDBCore> => {
  if (!_PouchDBWithSync) {
    const [HttpAdapter, Replication] = await Promise.all([
      import("pouchdb-adapter-http").then(m => m.default),
      import("pouchdb-replication").then(m => m.default),
    ]);
    _PouchDBWithSync = BasePouchDB
      .plugin(HttpAdapter)
      .plugin(Replication);
  }
  return _PouchDBWithSync;
};

// Get PouchDB with query capabilities
export const getPouchDBWithFind = async (): Promise<typeof PouchDBCore> => {
  if (!_PouchDBWithFind) {
    const PouchDBFind = (await import("pouchdb-find")).default;
    _PouchDBWithFind = BasePouchDB.plugin(PouchDBFind);
  }
  return _PouchDBWithFind;
};

// Get PouchDB with MapReduce capabilities
export const getPouchDBWithMapReduce = async (): Promise<typeof PouchDBCore> => {
  if (!_PouchDBWithMapReduce) {
    const MapReduce = (await import("pouchdb-mapreduce")).default;
    _PouchDBWithMapReduce = BasePouchDB.plugin(MapReduce);
  }
  return _PouchDBWithMapReduce;
};

// Get full PouchDB with all commonly used plugins
export const getFullPouchDB = async (): Promise<typeof PouchDBCore> => {
  if (!_FullPouchDB) {
    const [IDBAdapter, HttpAdapter, Replication, PouchDBFind] = await Promise.all([
      import("pouchdb-adapter-idb").then(m => m.default),
      import("pouchdb-adapter-http").then(m => m.default),
      import("pouchdb-replication").then(m => m.default),
      import("pouchdb-find").then(m => m.default),
    ]);

    _FullPouchDB = BasePouchDB
      .plugin(IDBAdapter)
      .plugin(HttpAdapter)
      .plugin(Replication)
      .plugin(PouchDBFind);

    // Add memory adapter for testing
    if (import.meta.env.NODE_ENV === 'test' || import.meta.env.VITEST) {
      const MemoryAdapter = (await import("pouchdb-adapter-memory")).default;
      _FullPouchDB = _FullPouchDB.plugin(MemoryAdapter);
    }
  }
  return _FullPouchDB;
};

// Default export - minimal PouchDB with IDB for basic offline functionality
export default BasePouchDB;
