import { config } from "@vue/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

import PouchDB from "pouchdb";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(MemoryAdapter);
PouchDB.plugin(PouchDBFind);

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
