import { describe, it, expect, vi, beforeEach } from "vitest";
import { orchestrateAgent, buildProject } from "./gemini";

describe("orchestrateAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns response on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "Hello from AI" }),
    } as any);

    const result = await orchestrateAgent("developer", "write a function");
    expect(result.text).toBe("Hello from AI");
    expect(result.error).toBeUndefined();
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "AI_SERVICE_UNAVAILABLE" }),
    } as any);

    const result = await orchestrateAgent("developer", "write a function");
    expect(result.text).toBe("");
    expect(result.error).toBe("AI_SERVICE_UNAVAILABLE");
  });

  it("returns error on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const result = await orchestrateAgent("developer", "write a function");
    expect(result.text).toBe("");
    expect(result.error).toBe("Network error");
  });

  it("sends correct payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: "ok" }),
    } as any);

    await orchestrateAgent("designer", "make it blue", { files: {} });

    expect(fetchSpy).toHaveBeenCalledWith("/api/ai/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "designer", prompt: "make it blue", context: { files: {} } }),
    });
  });
});

describe("buildProject", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns plan and files on success", async () => {
    const mockResponse = { plan: { files: [] }, files: {} };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await buildProject("todo app");
    expect(result).toEqual(mockResponse);
  });

  it("throws on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "BUILD_FAILED" }),
    } as any);

    await expect(buildProject("todo app")).rejects.toThrow("BUILD_FAILED");
  });
});
