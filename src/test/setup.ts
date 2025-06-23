import { config } from "@vue/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

import PouchDBCore from "pouchdb-core";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBFind from "pouchdb-find";

// Create PouchDB instance with plugins like in the test file
const PouchDB = PouchDBCore
  .plugin(MemoryAdapter)
  .plugin(PouchDBFind);

PouchDB.defaults({
  adapter: "memory",
});

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
