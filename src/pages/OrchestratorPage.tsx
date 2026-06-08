import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "../lib/ThemeContext";
import { orchestrateAgent } from "../lib/gemini";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, MessageSquare, RefreshCcw, Save, Wand2 } from "lucide-react";

const WORKFLOW_STEPS = [
  { id: "goal", title: "Goal", role: "pm", hint: "What do you want the AI to improve or build today?" },
  { id: "design", title: "Design", role: "designer", hint: "Describe the desired UI style and user experience." },
  { id: "execute", title: "Execute", role: "developer", hint: "Any implementation constraints, API, or data requirements." },
  { id: "validate", title: "Validate", role: "qa", hint: "What quality checks, tests, or acceptance signals matter most?" },
];

export default function OrchestratorPage() {
  const { theme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!auth.currentUser) {
    return <Navigate to="/auth" />;
  }

  const step = WORKFLOW_STEPS[stepIndex];
  const currentResult = results[step.id];

  const runStep = async (role: string, prompt: string) => {
    setLoading(true);
    setError("");
    const response = await orchestrateAgent(role, prompt);
    setLoading(false);
    if (response.error) {
      setError(response.error);
    } else {
      setResults((prev) => ({ ...prev, [step.id]: response.text }));
    }
  };

  const handleAdvance = async () => {
    const trimmed = input.trim();
    if (!trimmed && !currentResult) return;

    if (!currentResult) {
      await runStep(step.role, trimmed);
      return;
    }

    if (stepIndex + 1 >= WORKFLOW_STEPS.length) {
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  const handleRetry = async () => {
    const prompt = input.trim() || currentResult || "";
    await runStep(step.role, prompt);
  };

  const summarize = () => {
    return WORKFLOW_STEPS.map((s) => `## ${s.title}\n${results[s.id] || "Waiting for input..."}`).join("\n\n");
  };

  const handleSaveProject = async () => {
    const mode = theme === "dark" ? "dark" : "light";
    setSaving(true);
    try {
      const existing = JSON.parse(localStorage.getItem("aigent_projects") || "[]");
      const project = {
        id: crypto.randomUUID(),
        name: input.trim() || "neural-workflow",
        prompt: input,
        results,
        mode,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("aigent_projects", JSON.stringify([project, ...existing]));
      setError("");
    } catch {
      setError("Local save failed. Your device storage may be full.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 container mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
              Neural Orchestrator
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest mt-2">
              Multi-role AI workflow — guided from idea to validation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-2 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Step {stepIndex + 1} / {WORKFLOW_STEPS.length}
            </div>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
            >
              <Save className="w-3 h-3" />
              {saving ? "Saving..." : "Save workflow"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {WORKFLOW_STEPS.map((s, idx) => (
            <div key={s.id} className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/5 mx-1">
              <motion.div
                initial={false}
                animate={{ scaleX: idx <= stepIndex ? 1 : 0 }}
                className="h-full origin-left rounded-full bg-cyan-500"
                style={{ transformOrigin: "left" }}
              />
            </div>
          ))}
        </div>

        <motion.div layout className="rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-white dark:bg-slate-950 shadow-2xl">
          <div className="p-8 md:p-10 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                {step.title} stage
              </p>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-950 dark:text-white">
                {step.hint}
              </h2>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Describe the ${step.title.toLowerCase()} context...`}
              className="w-full h-36 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono resize-y"
            />

            <AnimatePresence>
              {currentResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap"
                >
                  {currentResult}
                </motion.div>
              )}
            </AnimatePresence>

            {!currentResult && !loading && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAdvance}
                  disabled={!input.trim()}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  <MessageSquare className="w-3 h-3" />
                  Generate {step.title}
                </button>
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
            )}

            {currentResult && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleAdvance}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest"
                >
                  <ChevronRight className="w-3 h-3" />
                  {stepIndex + 1 >= WORKFLOW_STEPS.length ? "Finishing workflow" : "Continue to next stage"}
                </button>
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white font-bold rounded-xl text-xs uppercase tracking-widest disabled:opacity-60"
                >
                  <RefreshCcw className="w-3 h-3" />
                  {loading ? "Running..." : "Regenerate this stage"}
                </button>
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-widest"
                >
                  Back
                </button>
              </div>
            )}

            {loading && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Running neural engine for {step.title.toLowerCase()} stage…
              </p>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <Wand2 className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>
                Tip: Summaries are created in plain text so you can inspect and repeat any workflow step inside the Neural
                Orchestrator.
              </span>
            </div>
          </div>
        </motion.div>

        {Object.keys(results).length > 0 && (
          <motion.div layout className="mt-6 rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-white dark:bg-slate-950 shadow-2xl">
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Workflow snapshot</h3>
                <button
                  onClick={() => {
                    const text = summarize();
                    navigator.clipboard.writeText(text).catch(() => undefined);
                  }}
                  className="px-3 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest"
                >
                  Copy text
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 font-mono text-slate-900 dark:text-white">
                {summarize()}
              </pre>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
