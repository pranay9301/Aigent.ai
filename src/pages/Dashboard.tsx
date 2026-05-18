import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Folder, Clock, MoreVertical, Search, Zap, Rocket, ChevronRight, CreditCard, LayoutTemplate, Cpu, ShieldAlert, MessageSquare, Wand2, BarChart3, Shield, Globe, Activity } from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { useTheme } from "../lib/ThemeContext";

export default function Dashboard() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !auth.currentUser) return;
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        ownerId: auth.currentUser.uid,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        files: {
          "App.tsx": `export default function App() {\n  return <div>Welcome to ${newProjectName}</div>;\n}`,
          "index.css": "@import 'tailwindcss';\nbody { background: #000; color: #fff; }",
        }
      });
      navigate(`/workspace/${docRef.id}`);
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
          <h1 className="text-3xl font-black italic mb-2 tracking-tight text-slate-900 dark:text-white uppercase">MISSION CONTROL</h1>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] font-black">Sector 7G / Active Operations</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Filter neural logs..." className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 text-slate-900 dark:text-white font-medium" />
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
          { label: "Active Intelligence", value: "14/15", icon: Zap, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/5", border: "border-cyan-500/10 dark:border-cyan-400/20" },
          { label: "Computational Load", value: "42%", icon: Rocket, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/10 dark:border-blue-400/20" },
          { label: "Financial Flow", value: "12.4K", icon: CreditCard, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10 dark:border-emerald-400/20" },
          { label: "Neural Uptime", value: "99.9%", icon: Cpu, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/10 dark:border-purple-400/20" },
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-3xl border transition-colors", stat.bg, stat.border)}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-xl bg-white dark:bg-white/5 shadow-sm", stat.color)}><stat.icon className="w-5 h-5" /></div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest font-black">Telem_00{i+1}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Tools Hub */}
      <div className="mb-12">
        <h2 className="text-[10px] font-black tracking-[0.3em] mb-6 flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase px-1"><Cpu className="w-4 h-4 text-cyan-500" /> Neural Assets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Debugger", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/5" },
            { name: "Explainer", icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/5" },
            { name: "Improver", icon: Wand2, color: "text-amber-500", bg: "bg-amber-500/5" },
            { name: "SEO Optimizer", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/5" },
            { name: "Safety Audit", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/5" },
            { name: "Market Pulse", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/5" }
          ].map((tool, i) => (
            <div 
              key={i} 
              onClick={() => openCreationDialog(`${tool.name} Instance`)}
              className={cn("p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-white/[0.02] dark:bg-white/[0.01] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group flex flex-col items-center text-center", tool.bg)}
            >
              <div className={cn("p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-sm bg-white dark:bg-slate-900/50", tool.color)}><tool.icon className="w-5 h-5" /></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{tool.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Neural Activity Stream */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase"><Activity className="w-4 h-4 text-cyan-500" /> Neural Activity Stream</h2>
          <span className="text-[8px] font-mono text-slate-300 dark:text-slate-700 uppercase tracking-widest">Live_Feed_v04</span>
        </div>
        <div className="space-y-2">
          {[
            { agent: "Designer", action: "Style_Refine: quantum-commerce", detail: "Applying glassmorphism variants to checkout node.", time: "JUST_NOW" },
            { agent: "DevOps", action: "Load_Balance: sector-7G", detail: "Neural throughput increased to 1.4GB/s.", time: "2M_AGO" },
            { agent: "Compliance", action: "Audit_Pass: saas-command", detail: "SOC2 mapping complete. No leaks detected.", time: "14M_AGO" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="px-6 py-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 flex items-center justify-between group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 w-20 uppercase tracking-widest italic font-mono">[{item.agent}]</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{item.action}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 italic font-medium">{item.detail}</span>
                </div>
              </div>
              <span className="text-[8px] font-mono text-slate-400 dark:text-slate-700 font-black tracking-widest">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deployed Architectures */}
      <div className="mb-6 flex items-center gap-3 px-1">
        <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-400 dark:text-slate-500 uppercase">Deployed Architectures</h2>
        <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.02] backdrop-blur-xl border border-black/10 dark:border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden shadow-xl dark:shadow-2xl"
              onClick={() => navigate(`/workspace/${p.id}`)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-slate-900 border border-black/5 dark:border-white/5 text-slate-400 dark:text-slate-400 group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-all">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter italic">LIVE_LINK</span>
                </div>
              </div>
              <h3 className="text-2xl font-black mb-1 text-slate-900 dark:text-white italic group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{p.name}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-8 font-mono truncate uppercase tracking-widest">{p.id}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono font-black">
                  <Clock className="w-3 h-3" /> {formatDate(p.createdAt)}
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 flex items-center justify-center text-[8px] font-black text-cyan-600 dark:text-cyan-400 shadow-xl">AI</div>
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
            { name: "SaaS Command Core", desc: "Full auth, billing, and adaptive HUD setup.", tag: "PRO_MODEL", color: "from-blue-600/20" },
            { name: "Quantum Commerce", desc: "Hyper-fast storefront with neural search.", tag: "STABLE", color: "from-emerald-600/20" },
            { name: "Cyber Portfolio", desc: "Ghost-translucent aesthetic for operators.", tag: "LEGACY", color: "from-purple-600/20" },
          ].map((template, i) => (
            <div 
              key={i} 
              onClick={() => openCreationDialog(template.name)}
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
