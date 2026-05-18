export interface AIResponse {
  text: string;
  error?: string;
}

export async function orchestrateAgent(role: string, prompt: string, context?: any): Promise<AIResponse> {
  try {
    const response = await fetch("/api/ai/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, prompt, context }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to orchestrate agent");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Agent Error:", error);
    return { text: "", error: error.message };
  }
}

export async function buildProject(prompt: string): Promise<any> {
  try {
    const response = await fetch("/api/ai/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to build project");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Build Error:", error);
    throw error;
  }
}
