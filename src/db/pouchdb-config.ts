import PouchDBAdapterIndexedDB from "pouchdb-adapter-indexeddb";
import PouchDB from "pouchdb-browser";
import find from "pouchdb-find";

PouchDB.plugin(PouchDBAdapterIndexedDB).plugin(find);

export { PouchDB };
