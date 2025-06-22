import { config } from "@vue/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

import PouchDB from "pouchdb";
import MemoryAdapter from "pouchdb-adapter-memory";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(MemoryAdapter);
PouchDB.plugin(PouchDBFind);

PouchDB.defaults({
  adapter: "memory",
});

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Configure Vue Test Utils globally
config.global.stubs = {
  // Stub out router-link and router-view
  RouterLink: true,
  RouterView: true,
  // Stub teleport for testing
  Teleport: true,
};
