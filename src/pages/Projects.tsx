import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Folder, Clock, Search, LayoutTemplate, X, Filter, Grid, List as ListIcon, ChevronRight } from "lucide-react";
import { cn, formatDate } from "../lib/utils";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-12 px-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              <span className="text-xs font-bold tracking-wider text-cyan-700 dark:text-cyan-500 uppercase">Central_Registry</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none font-sans">Neural Projects</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group px-10 py-5 bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold rounded-2xl flex items-center gap-4 transition-all shadow-xl shadow-cyan-500/10 active:scale-95 text-xs uppercase tracking-widest"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
            <span>Initialize New Node</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by designation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-slate-900 dark:text-white font-black italic uppercase placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-4 rounded-2xl border transition-all shadow-sm", 
                viewMode === "grid" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400" : "bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400"
              )}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "p-4 rounded-2xl border transition-all shadow-sm", 
                viewMode === "list" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400" : "bg-slate-100 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400"
              )}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Projects Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-[3rem] bg-slate-100 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {filteredProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/workspace/${p.id}`)}
                  className="group p-10 rounded-3xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors shadow-sm">
                      <Folder className="w-7 h-7" />
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 text-[10px] font-bold rounded-full uppercase border border-emerald-500/10">Active_Node</div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-950 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight mb-3 leading-none">{p.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500 font-mono uppercase tracking-wider mb-10">
                    <Clock className="w-3 h-3" /> {formatDate(p.createdAt)}
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-700 font-mono tracking-widest">{p.id.slice(0, 12)}...</span>
                    <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              {filteredProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(`/workspace/${p.id}`)}
                  className="group p-6 px-10 rounded-[2rem] bg-slate-50 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all cursor-pointer flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-8">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
                      <Folder className="w-5 h-5 text-slate-400 group-hover:text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{p.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-700 font-mono tracking-widest uppercase">{p.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">{formatDate(p.createdAt)}</span>
                    <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-black rounded-full uppercase italic border border-emerald-500/10">Live_Instance</div>
                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-800 group-hover:text-cyan-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="py-40 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-[4rem] bg-slate-50/50 dark:bg-white/[0.01] shadow-inner font-black uppercase italic">
            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-black/5 dark:border-white/10">
              <Folder className="w-10 h-10 text-slate-300 dark:text-slate-800" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase mb-3 tracking-tighter">No Neural Nodes Detected</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-black italic uppercase tracking-[0.2em] mb-12">Ready to initialize your first architecture?</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-10 py-4 bg-slate-900 dark:bg-white/5 hover:bg-black dark:hover:bg-white/10 text-white text-xs font-black rounded-2xl uppercase tracking-[0.3em] transition-all italic shadow-2xl"
            >
              Start Mission Protocol
            </button>
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-[3.5rem] p-12 shadow-4xl overflow-hidden shadow-2xl dark:shadow-cyan-500/5 transition-colors"
              >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                  <LayoutTemplate className="w-48 h-48 -rotate-12" />
                </div>
                <div className="flex justify-between items-start mb-10 relative">
                  <div>
                    <h2 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter mb-2 leading-none">Initialize Node</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black italic uppercase tracking-widest">Deploy a new archetype to the workforce.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90">
                    <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-10 relative">
                  <div className="space-y-4 px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Designation Name</label>
                    <input autoFocus required placeholder="e.g. quantum-commerce-hub" className="w-full bg-slate-50 dark:bg-black border border-black/10 dark:border-white/5 rounded-2xl p-6 text-sm font-black text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800 uppercase italic shadow-inner" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-cyan-500/5 dark:bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-5 shadow-sm">
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-cyan-500/10 shadow-sm">
                      <LayoutTemplate className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 italic">Standard Archetype Protocol</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 italic leading-relaxed font-medium">Initializes a multi-node workspace with React 18, Tailwind CSS, and optimized neural coordination hooks.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white text-[10px] font-black rounded-[1.5rem] uppercase tracking-[0.2em] transition-all italic">Abort_Sync</button>
                    <button type="submit" className="flex-[2] py-5 bg-slate-900 dark:bg-cyan-500 hover:bg-black dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-base font-black rounded-[1.5rem] uppercase tracking-[0.3em] transition-all shadow-xl shadow-cyan-500/20 italic">Deploy Architecture</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
