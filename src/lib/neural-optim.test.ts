import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache, pruneContext, serialize, deserialize } from "./neural-optim";

describe("cache", () => {
  beforeEach(() => {
    // Clear cache by setting expired entries
    vi.useFakeTimers();
  });

  it("stores and retrieves values", () => {
    cache.set("key1", "value1", 60);
    expect(cache.get("key1")).toBe("value1");
  });

  it("returns null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("expires entries after TTL", () => {
    vi.useRealTimers();
    vi.useFakeTimers();
    cache.set("key1", "value1", 1);
    expect(cache.get("key1")).toBe("value1");
    vi.advanceTimersByTime(1500);
    expect(cache.get("key1")).toBeNull();
  });

  it("evicts oldest entries when exceeding 500", () => {
    for (let i = 0; i < 502; i++) {
      cache.set(`key${i}`, `value${i}`, 3600);
    }
    expect(cache.get("key0")).toBeNull();
    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key501")).toBe("value501");
  });
});

describe("pruneContext", () => {
  it("returns empty string for null/undefined input", () => {
    expect(pruneContext(null as any)).toBe("");
    expect(pruneContext(undefined as any)).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(pruneContext(123 as any)).toBe("");
  });

  it("keeps lines with important prefixes", () => {
    const code = `import React from 'react';
const x = 1;
function foo() {}
// comment line
export default App;
`;
    const result = pruneContext(code);
    expect(result).toContain("import React");
    expect(result).toContain("const x");
    expect(result).toContain("function foo");
    expect(result).toContain("export default");
    expect(result).not.toContain("// comment");
  });

  it("truncates long output to 1500 chars", () => {
    const lines = Array(200).fill("const x = 1;").join("\n");
    const result = pruneContext(lines);
    expect(result.length).toBeLessThanOrEqual(1500);
  });

  it("falls back to 800 chars when no matching lines", () => {
    const code = Array(100).fill("some random text").join("\n");
    const result = pruneContext(code);
    expect(result.length).toBeLessThanOrEqual(800);
  });
});

describe("serialize/deserialize", () => {
  it("roundtrips objects", () => {
    const obj = { a: 1, b: [2, 3], c: { d: true } };
    expect(deserialize(serialize(obj))).toEqual(obj);
  });

  it("handles primitives", () => {
    expect(deserialize(serialize("hello"))).toBe("hello");
    expect(deserialize(serialize(42))).toBe(42);
    expect(deserialize(serialize(null))).toBeNull();
  });
});
