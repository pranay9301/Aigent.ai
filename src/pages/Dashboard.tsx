import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { createProject } from "../lib/projectUtils";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Folder, Clock, MoreVertical, Search, Zap, Rocket, ChevronRight, CreditCard, LayoutTemplate, Cpu, ShieldAlert, MessageSquare, Wand2, BarChart3, Shield, Globe, Activity } from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { useTheme } from "../lib/ThemeContext";
import { orchestrateAgent } from "../lib/gemini";

export default function Dashboard() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiToolDialog, setAiToolDialog] = useState<{ open: boolean; tool: string; role: string }>({ open: false, tool: "", role: "" });
  const [aiToolPrompt, setAiToolPrompt] = useState("");
  const [aiToolResult, setAiToolResult] = useState("");
  const [aiToolLoading, setAiToolLoading] = useState(false);
  const navigate = useNavigate();

  const addNotification = (text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "projects"),
          where("ownerId", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "projects");
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toolRoles: Record<string, string> = {
    "Debugger": "bug",
    "Explainer": "exp",
    "Improver": "dev",
    "SEO Optimizer": "dev",
    "Safety Audit": "sec",
    "Market Pulse": "fin",
  };

  const handleAiToolInvoke = async () => {
    if (!aiToolPrompt.trim() || !aiToolDialog.tool) return;
    setAiToolLoading(true);
    setAiToolResult("");
    const role = toolRoles[aiToolDialog.tool] || "dev";
    const res = await orchestrateAgent(role, aiToolPrompt);
    setAiToolResult(res.error ? `Error: ${res.error}` : res.text);
    setAiToolLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setIsCreating(true);
    try {
      const docRef = await createProject(newProjectName);
      navigate(`/workspace/${docRef}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "projects");
    } finally {
      setIsCreating(false);
      setNewProjectName("");
      addNotification("NODE_INITIALIZED: Neural architecture deployed successfully.");
    }
  };

  const openCreationDialog = (name: string) => {
    setNewProjectName(name);
    setIsCreating(true);
    addNotification(`INITIALIZING_TEMPLATE: ${name.toUpperCase()}`);
  };

  return (
    <div className="pt-24 pb-12 px-6 container mx-auto relative transition-colors duration-300">
      {/* Notifications Overlay */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 py-2 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-full shadow-2xl uppercase tracking-widest border border-cyan-400/50 backdrop-blur-md"
            >
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-950 dark:text-white uppercase">MISSION CONTROL</h1>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider font-bold">Sector 7G / Active Operations</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Filter neural logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 text-slate-900 dark:text-white font-medium" />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-2.5 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 uppercase text-xs tracking-widest"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Initialize Node</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Projects", value: projects.length.toString(), icon: Zap, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05]", border: "border-cyan-500/10 dark:border-cyan-400/20" },
          { label: "Total Files", value: projects.reduce((acc, p) => acc + Object.keys(p.files || {}).length, 0).toString(), icon: Rocket, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/[0.03] dark:bg-blue-500/[0.05]", border: "border-blue-500/10 dark:border-blue-400/20" },
          { label: "Active Projects", value: projects.filter(p => p.status === "active").length.toString(), icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]", border: "border-emerald-500/10 dark:border-emerald-400/20" },
          { label: "Member Since", value: auth.currentUser?.metadata?.creationTime ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A", icon: Cpu, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/[0.03] dark:bg-purple-500/[0.05]", border: "border-purple-500/10 dark:border-purple-400/20" },
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-2xl border transition-colors", stat.bg, stat.border)}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-black/5 dark:border-white/5", stat.color)}><stat.icon className="w-5 h-5" /></div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Telem_00{i+1}</span>
            </div>
            <p className="text-3xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Tools Hub */}
      <div className="mb-12">
        <h2 className="text-xs font-bold tracking-wider mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase px-1"><Cpu className="w-4 h-4 text-cyan-500" /> Neural Assets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Debugger", icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/[0.03] dark:bg-red-500/[0.05]" },
            { name: "Explainer", icon: MessageSquare, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05]" },
            { name: "Improver", icon: Wand2, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]" },
            { name: "SEO Optimizer", icon: BarChart3, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]" },
            { name: "Safety Audit", icon: Shield, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/[0.03] dark:bg-purple-500/[0.05]" },
            { name: "Market Pulse", icon: Globe, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/[0.03] dark:bg-blue-500/[0.05]" }
          ].map((tool, i) => (
            <div 
              key={i} 
              onClick={() => { setAiToolDialog({ open: true, tool: tool.name, role: toolRoles[tool.name] || "dev" }); setAiToolPrompt(""); setAiToolResult(""); }}
              className={cn("p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-cyan-500/20 transition-all cursor-pointer group flex flex-col items-center text-center", tool.bg)}
            >
              <div className={cn("p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-transform bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5", tool.color)}><tool.icon className="w-5 h-5" /></div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{tool.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Neural Activity Stream */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xs font-bold tracking-wider flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase"><Activity className="w-4 h-4 text-cyan-500" /> Neural Activity Stream</h2>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest">Live_Feed_v04</span>
        </div>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="px-6 py-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">No activity yet. Create your first project to get started.</span>
            </div>
          ) : (
            projects.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="px-6 py-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 w-20 uppercase tracking-wider italic font-mono">[PROJECT]</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Project: {p.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{Object.keys(p.files || {}).length} files</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 font-bold tracking-wider">{p.updatedAt?.toDate ? formatDate(p.updatedAt.toDate()) : "Recent"}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Deployed Architectures */}
      <div className="mb-8 flex items-center gap-3 px-1">
        <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Deployed Architectures</h2>
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 animate-pulse shadow-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {filteredProjects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-xl"
              onClick={() => navigate(`/workspace/${p.id}`)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all shadow-sm">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tight italic">LIVE_LINK</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-slate-950 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{p.name}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 mb-8 font-mono truncate uppercase tracking-widest">{p.id}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                  <Clock className="w-3 h-3" /> {formatDate(p.createdAt)}
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 flex items-center justify-center text-[8px] font-bold text-cyan-600 dark:text-cyan-400 shadow-md">AI</div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* New Project Dialog */}
          {isCreating && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-cyan-500 ring-8 ring-cyan-500/5 shadow-2xl z-10 flex flex-col justify-center"
            >
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900 dark:text-white italic uppercase tracking-tighter"><Plus className="w-6 h-6 text-cyan-500 shadow-lg" /> GENERATE_NODE</h3>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation Name</label>
                  <input 
                    autoFocus
                    placeholder="e.g. quantum-hub" 
                    className="w-full bg-black/5 dark:bg-slate-950 border border-black/10 dark:border-white/5 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white font-bold"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    disabled={isCreating && !newProjectName}
                    className="flex-1 py-4 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    DEPLOY
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-6 py-4 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white font-black rounded-2xl text-xs uppercase transition-all"
                  >
                    ABORT
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* AI Tool Dialog */}
          <AnimatePresence>
            {aiToolDialog.open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setAiToolDialog({ open: false, tool: "", role: "" })}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-black/5 dark:border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white uppercase">{aiToolDialog.tool}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Describe what you need analyzed or paste your code below.</p>
                  <textarea
                    autoFocus
                    rows={6}
                    value={aiToolPrompt}
                    onChange={(e) => setAiToolPrompt(e.target.value)}
                    placeholder={`Describe your ${aiToolDialog.tool.toLowerCase()} request...`}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white font-mono resize-none mb-4"
                  />
                  {aiToolResult && (
                    <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">{aiToolResult}</div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAiToolInvoke}
                      disabled={aiToolLoading || !aiToolPrompt.trim()}
                      className="flex-1 py-3 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {aiToolLoading ? "Processing..." : "Execute"}
                    </button>
                    <button
                      onClick={() => { setAiToolDialog({ open: false, tool: "", role: "" }); setAiToolResult(""); }}
                      className="px-6 py-3 bg-black/5 dark:bg-white/5 text-slate-500 font-bold rounded-xl text-xs uppercase transition-all"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {projects.length === 0 && !loading && !isCreating && (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-[3rem] bg-black/[0.01] dark:bg-white/[0.01]">
              <div className="p-6 rounded-full bg-black/5 dark:bg-slate-900 w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700 border border-black/5 dark:border-white/5 shadow-2xl transition-colors"><Folder className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black mb-2 italic text-slate-900 dark:text-white uppercase tracking-tighter">No Neural Nodes Detected</h3>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] mb-8 max-w-xs mx-auto font-black uppercase tracking-widest italic opacity-80 leading-relaxed">Start your first mission by initializing a high-throughput neural archetype.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-8 py-4 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
              >
                Execute Initialization
              </button>
            </div>
          )}
        </div>
      )}

      {/* Templates Marketplace */}
      <div className="mt-32">
        <div className="flex justify-between items-center mb-10 px-1 text-slate-900 dark:text-white transition-colors">
          <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter p-2 border-l-4 border-cyan-500 bg-cyan-500/5">
            <LayoutTemplate className="w-5 h-5 text-cyan-500 shadow-xl" /> Archetype Marketplace
          </h2>
          <button className="text-[10px] font-black text-slate-400 dark:text-slate-600 hover:text-cyan-500 transition-colors uppercase tracking-[0.2em] font-mono">BROWSE_GLOBAL_MODELS</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "SaaS Command Core",
              desc: "Full auth, billing, and adaptive HUD setup.",
              tag: "PRO_MODEL",
              color: "from-blue-600/20",
              files: {
                "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>SaaS Command Core</title>\n  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>\n<body class="bg-gray-950 text-white min-h-screen flex items-center justify-center">\n  <div id="root"></div>\n</body>\n</html>`,
                "App.tsx": `export default function App() {\n  return (\n    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">\n      <h1 className="text-4xl font-bold mb-4">SaaS Command Core</h1>\n      <p className="text-gray-400">Your SaaS dashboard is ready. Add authentication and billing to get started.</p>\n      <div className="mt-8 grid grid-cols-3 gap-4">\n        <div className="bg-gray-900 p-6 rounded-xl"><h3 className="font-bold mb-2">Auth</h3><p className="text-sm text-gray-500">Firebase Auth integration</p></div>\n        <div className="bg-gray-900 p-6 rounded-xl"><h3 className="font-bold mb-2">Billing</h3><p className="text-sm text-gray-500">Stripe/PayPal ready</p></div>\n        <div className="bg-gray-900 p-6 rounded-xl"><h3 className="font-bold mb-2">Dashboard</h3><p className="text-sm text-gray-500">Analytics & metrics</p></div>\n      </div>\n    </div>\n  );\n}`,
                "index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: 'Inter', system-ui, sans-serif; }`
              }
            },
            {
              name: "Quantum Commerce",
              desc: "Hyper-fast storefront with neural search.",
              tag: "STABLE",
              color: "from-emerald-600/20",
              files: {
                "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Quantum Commerce</title>\n  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>\n<body class="bg-gray-950 text-white min-h-screen">\n  <div id="root"></div>\n</body>\n</html>`,
                "App.tsx": `const products = [\n  { name: "Quantum Widget", price: "$49.99", color: "bg-emerald-500" },\n  { name: "Neural Headphones", price: "$199.99", color: "bg-cyan-500" },\n  { name: "Flux Capacitor", price: "$999.99", color: "bg-purple-500" },\n];\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-gray-950 text-white p-8">\n      <header className="flex justify-between items-center mb-12">\n        <h1 className="text-2xl font-bold">Quantum Commerce</h1>\n        <input placeholder="Search products..." className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm w-64" />\n      </header>\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n        {products.map((p, i) => (\n          <div key={i} className="bg-gray-900 rounded-xl overflow-hidden">\n            <div className={p.color + " h-48 flex items-center justify-center text-4xl font-bold opacity-20"}>Q</div>\n            <div className="p-6">\n              <h3 className="font-bold text-lg">{p.name}</h3>\n              <p className="text-emerald-400 font-bold mt-2">{p.price}</p>\n              <button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg text-sm font-bold transition-colors">Add to Cart</button>\n            </div>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`,
                "index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;`
              }
            },
            {
              name: "Cyber Portfolio",
              desc: "Ghost-translucent aesthetic for operators.",
              tag: "LEGACY",
              color: "from-purple-600/20",
              files: {
                "index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Cyber Portfolio</title>\n  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>\n<body class="bg-gray-950 text-white min-h-screen">\n  <div id="root"></div>\n</body>\n</html>`,
                "App.tsx": `export default function App() {\n  return (\n    <div className="min-h-screen bg-gray-950 text-white">\n      <nav className="flex justify-between items-center p-6 border-b border-gray-800">\n        <span className="font-bold text-lg">CYBER.DEV</span>\n        <div className="flex gap-6 text-sm text-gray-400">\n          <a href="#work" className="hover:text-white">Work</a>\n          <a href="#about" className="hover:text-white">About</a>\n          <a href="#contact" className="hover:text-white">Contact</a>\n        </div>\n      </nav>\n      <section className="py-32 px-8 max-w-4xl mx-auto">\n        <h1 className="text-6xl font-bold mb-6">Full-Stack<br/><span className="text-purple-400">Developer</span></h1>\n        <p className="text-gray-400 text-lg max-w-xl">Building digital experiences at the intersection of design and technology.</p>\n      </section>\n      <section id="work" className="px-8 max-w-4xl mx-auto pb-20">\n        <h2 className="text-2xl font-bold mb-8">Selected Work</h2>\n        <div className="grid grid-cols-2 gap-6">\n          {["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"].map((p, i) => (\n            <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-purple-500/50 transition-colors">\n              <h3 className="font-bold">{p}</h3>\n              <p className="text-sm text-gray-500 mt-2">Web Application</p>\n            </div>\n          ))}\n        </div>\n      </section>\n    </div>\n  );\n}`,
                "index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { font-family: 'Space Grotesk', system-ui, sans-serif; }`
              }
            },
          ].map((template, i) => (
            <div 
              key={i} 
              onClick={async () => {
                if (!auth.currentUser) return;
                try {
                  await addDoc(collection(db, "projects"), {
                    name: template.name,
                    ownerId: auth.currentUser.uid,
                    files: template.files,
                    status: "active",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                  window.location.reload();
                } catch (err) {
                  console.error("Failed to create template project:", err);
                }
              }}
              className="group p-1 border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] rounded-[2.5rem] hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col shadow-xl"
            >
              <div className={cn("aspect-video rounded-t-[2.3rem] mb-2 overflow-hidden relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center bg-gradient-to-br to-transparent transition-colors", template.color)}>
                 <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900 dark:bg-cyan-500 text-[8px] font-black text-white dark:text-slate-950 rounded-full uppercase tracking-widest">{template.tag}</div>
                 <div className="text-slate-200 dark:text-white/10 font-black text-4xl select-none italic group-hover:scale-110 transition-transform">AIGENT</div>
              </div>
              <div className="p-8">
                <h4 className="text-lg font-black mb-2 text-slate-800 dark:text-slate-200 uppercase tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{template.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-8 leading-relaxed font-black opacity-80 uppercase tracking-tighter">{template.desc}</p>
                <button className="w-full py-4 bg-black/5 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-cyan-500 text-slate-900 dark:text-white hover:text-white dark:hover:text-slate-950 text-[10px] font-black rounded-xl transition-all uppercase tracking-[0.3em] font-mono">
                  SYNC_MODEL_V2
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

}
