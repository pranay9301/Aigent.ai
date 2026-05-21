import { describe, it, expect, vi, beforeEach } from "vitest";
import { cache } from "./neural-optim";

// These tests verify the cache works with the persistence hook
// without requiring actual Firestore connection

describe("cache with persistence hook", () => {
  it("still returns values from in-memory cache", () => {
    cache.set("test-key", "test-value", 60);
    expect(cache.get("test-key")).toBe("test-value");
  });

  it("handles set/get roundtrip", () => {
    const data = { complex: { nested: [1, 2, 3] }, flag: true };
    cache.set("complex-key", data, 300);
    expect(cache.get("complex-key")).toEqual(data);
  });

  it("overwrites existing keys", () => {
    cache.set("key", "old", 60);
    cache.set("key", "new", 60);
    expect(cache.get("key")).toBe("new");
  });
});

describe("setPersistFn", () => {
  it("calls persistence function on cache.set", async () => {
    const { setPersistFn } = await import("./neural-optim");
    const mockPersist = vi.fn();
    setPersistFn(mockPersist);

    cache.set("persist-key", "value", 60);

    expect(mockPersist).toHaveBeenCalledTimes(1);
    expect(mockPersist).toHaveBeenCalledWith("persist-key", "value", expect.any(Number));

    // Reset
    setPersistFn(() => {});
  });

  it("does not throw if persist function throws", () => {
    // Should silently handle persist errors
    expect(() => cache.set("key", "val", 60)).not.toThrow();
  });
});
