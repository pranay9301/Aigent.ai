import { describe, it, expect } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("deduplicates tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("", null, undefined, false)).toBe("");
  });
});

describe("formatDate", () => {
  it("returns empty string for falsy input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
  });

  it("formats a Date object", () => {
    const date = new Date("2026-05-21T00:00:00Z");
    const result = formatDate(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("formats a date string", () => {
    const result = formatDate("2026-05-21");
    expect(result).toBeTruthy();
  });

  it("handles Firestore timestamp-like objects", () => {
    const fakeTimestamp = {
      toDate: () => new Date("2026-05-21T00:00:00Z"),
    };
    const result = formatDate(fakeTimestamp);
    expect(result).toBeTruthy();
  });
});
