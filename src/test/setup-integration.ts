import { config } from "@vue/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

import PouchDBCore from "pouchdb-core";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBFind from "pouchdb-find";
import PouchDBMapReduce from "pouchdb-mapreduce";

// Create PouchDB instance with plugins
export const PouchDB = PouchDBCore
  .plugin(MemoryAdapter)
  .plugin(PouchDBFind)
  .plugin(PouchDBMapReduce);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

config.global.stubs = {
  RouterLink: true,
  RouterView: true,
  Teleport: true,
};
