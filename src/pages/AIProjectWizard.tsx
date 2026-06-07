import { useState } from "react";
import { Navigate } from "react-router-dom";
import { orchestrateAgent } from "../lib/gemini";
import { auth } from "../lib/firebase";

const WIZARD_STEPS = [
  { id: "idea", title: "Project Idea", description: "Describe what you want to build." },
  { id: "design", title: "Design Brief", description: "We define UI/UX direction." },
  { id: "technical", title: "Technical Plan", description: "We map architecture and API." },
  { id: "build", title: "Build Output", description: "We generate the starter blueprint." },
];

const ROLES_BY_STEP = {
  idea: "developer",
  design: "designer",
  technical: "pm",
  build: "developer",
};

const SESSION_MEMORY_KEY = "aigent_wizard_session";

export interface WizardSession {
  prompt: string;
  role: string;
  results: Record<string, string>;
}

export function getWizardSession(): WizardSession | null {
  try {
    const raw = localStorage.getItem(SESSION_MEMORY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardSession;
  } catch {
    return null;
  }
}

function saveWizardSession(session: WizardSession) {
  try {
    localStorage.setItem(SESSION_MEMORY_KEY, JSON.stringify(session));
  } catch {
    // ignore storage failures
  }
}

export default function AIProjectWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const restored = getWizardSession();
  const restoredPrompt = restored?.prompt ?? "";
  const restoredResults = restored?.results ?? {};

  const stepId = WIZARD_STEPS[stepIndex]?.id;
  const stepResult = results[stepId] || restoredResults[stepId];
  const hasStoredProject = Boolean(getWizardSession());
  const wasRestored = Boolean(restoredResults[stepId]);

  const current = WIZARD_STEPS[stepIndex];
  const currentRole = ROLES_BY_STEP[current.id];

  const runStep = async (role: string, stepPrompt: string) => {
    const current = WIZARD_STEPS[stepIndex];
    const currentRole = ROLES_BY_STEP[current.id];
    setLoading(true);
    setError("");
    const response = await orchestrateAgent(currentRole, stepPrompt);
    setLoading(false);
    if (response.error) {
      setError(response.error);
    } else {
      setResults((prev) => ({ ...prev, [current.id]: response.text }));
    }
  };

  const startWizard = async () => {
    if (!prompt.trim()) return;
    const current = WIZARD_STEPS[stepIndex];
    const role = ROLES_BY_STEP[current.id];
    const initial = `Project idea summary: ${prompt.trim()}. Suggest a clear one-paragraph project scope.`;
    await runStep(role, initial);
  };

  const advance = async () => {
    const step = WIZARD_STEPS[stepIndex];
    const stepPrompt = stepResult || restoredResults[step.id] || prompt;
    if (!stepPrompt) return;
    if (stepIndex + 1 >= WIZARD_STEPS.length) {
      await saveProject(prompt || restoredPrompt || "aigent-project");
      return;
    }
    const role = ROLES_BY_STEP[WIZARD_STEPS[stepIndex + 1].id];
    const context = `Wizard context: ${stepPrompt}`;
    await runStep(role, context);
  };

  const back = async () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  const retry = async () => {
    const previous = WIZARD_STEPS[stepIndex];
    const prevResults = results[previous.id] || restoredResults[previous.id] || prompt;
    const followUp = previous.id === "idea"
      ? prevResults
      : `Context: ${prevResults}\n\nUser request: ${prompt}`;
    await runStep(currentRole, followUp);
  };

  const saveProject = async (name: string) => {
    const currentResults = { ...results, ...restoredResults };
    const projectData = {
      name: name.trim() || "untitled-ai-project",
      prompt,
      results: currentResults,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        "aigent_projects",
        JSON.stringify([...(tryParseLocalProjects() || []), projectData])
      );
      saveWizardSession({ prompt, role: currentRole, results: currentResults });
      setError("Project saved locally. We'll sync it to Firestore once connectivity is enabled.");
    } catch {
      setError("Local save failed. Storage may be full.");
    }
    setStepIndex(0);
    setPrompt("");
    setResults({});
  };

  const canContinue = restoredResults[current.id] || results[current.id];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
          AI Project Wizard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Guided AI project building. Complete a step, then continue.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        {WIZARD_STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Step {idx + 1}
              </span>
              <div
                className={`mt-2 h-2 w-2 rounded-full ${
                  idx <= stepIndex ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-800"
                }`}
              />
            </div>
            {idx < WIZARD_STEPS.length - 1 ? (
              <div className="mx-2 h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            {current.title}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{current.description}</p>
        </div>

        {!results[current.id] && !restoredResults[current.id] ? (
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                current.id === "idea"
                  ? "e.g. AI task manager for small teams..."
                  : "What should the AI generate next?"
              }
              className="min-h-[140px] w-full rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={startWizard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Step"}
            </button>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="min-h-[120px] rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black p-4 text-sm leading-relaxed text-slate-900 dark:text-white">
              {results[current.id] || restoredResults[current.id]}
            </div>
            <div className="flex flex-wrap gap-3">
              {stepIndex + 1 < WIZARD_STEPS.length ? (
                <>
                  <button
                    onClick={back}
                    className="rounded-full border border-black/10 dark:border-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    onClick={advance}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-400"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={back}
                    className="rounded-full border border-black/10 dark:border-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => saveProject(prompt)}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-cyan-400"
                  >
                    Save Project
                  </button>
                </>
              )}
              <button
                onClick={retry}
                className="rounded-full border border-black/10 dark:border-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {process.env.NODE_ENV !== "production" ? null : (
        <p className="mt-4 text-xs text-slate-500">Sign in to keep your projects synced across devices.</p>
      )}
    </div>
  );
}

function tryParseLocalProjects(): any[] {
  try {
    const raw = localStorage.getItem("aigent_projects");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
