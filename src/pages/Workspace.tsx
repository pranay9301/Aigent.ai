import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Save, Download, Terminal, Settings, 
  MessageSquare, ChevronLeft, FileCode, Check,
  AlertCircle, Send, Sparkles, X, ChevronRight,
  Code, Eye, Globe, Cpu, User, Wand2, Shield, CreditCard, Clock,
  Plus, Trash2, Layout
} from "lucide-react";
import { orchestrateAgent } from "../lib/gemini";
import { cn } from "../lib/utils";
import { useTheme } from "../lib/ThemeContext";
import Markdown from "react-markdown";

function generatePreviewHTML(files: Record<string, string>): string {
  const html = files["index.html"] || "";
  const css = files["index.css"] || files["style.css"] || "";
  const js = files["App.tsx"] || files["App.jsx"] || files["main.tsx"] || files["main.jsx"] || files["script.js"] || "";

  const extractedCSS = css.replace(/@import\s+['"][^'"]*['"]\s*;?/g, "").replace(/import\s+.*$/gm, "");
  const extractedJS = js
    .replace(/import\s+.*$/gm, "")
    .replace(/export\s+default\s+function\s+\w+/, "function App")
    .replace(/export\s+function\s+(\w+)/g, "function $1")
    .replace(/<(\w+)\s*\/>/g, "<$1></$1>");

  if (html) return html;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>${extractedCSS}</style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script type="text/babel">
    ${extractedJS}
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App || (() => React.createElement('div', {style:{padding:'2rem',fontFamily:'monospace'}}, 'Preview ready. Add an index.html for custom rendering.'))));
    } catch(e) {
      document.getElementById('root').innerHTML = '<pre style="color:red;padding:1rem">' + e.message + '</pre>';
    }
  <\/script>
</body>
</html>`;
}

export default function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<string>("App.tsx");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("split");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState("pm");
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);
  const [auditLogs, setAuditLogs] = useState<{id: string, agent: string, action: string, reason: string, time: string}[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<{id: string, agent: string, action: string, cost?: string}[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "trace" | "approvals">("chat");
  const [fileVersions, setFileVersions] = useState<Record<string, string[]>>({});

  const monoTheme = theme === 'light' ? 'light' : 'vs-dark';

  const addNotification = (text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const snap = await getDoc(doc(db, "projects", projectId));
        if (snap.exists()) {
          const data = snap.data();
          setProject(data);
          setFiles(data.files || {});
          setFileVersions(data.fileVersions || {});
          setLoading(false);
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `projects/${projectId}`);
      }
    };
    fetchProject();
  }, [projectId]);

  // Load approvals from Firestore
  useEffect(() => {
    const fetchApprovals = async () => {
      if (!projectId) return;
      try {
        const approvalsRef = collection(db, "projects", projectId, "approvals");
        const snap = await getDocs(approvalsRef);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as {id: string, agent: string, action: string, cost?: string, status?: string}[];
        setPendingApprovals(items.filter(a => a.status === "pending" || !a.status));
      } catch (err) {
        console.error("Failed to load approvals:", err);
      }
    };
    fetchApprovals();
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    try {
      // Compute updated file versions
      const updatedVersions: Record<string, string[]> = { ...fileVersions };
      Object.entries(files).forEach(([path, content]) => {
        const existing = updatedVersions[path] || [];
        if (existing.length === 0 || existing[existing.length - 1] !== content) {
          updatedVersions[path] = [...existing, content].slice(-5);
        }
      });
      setFileVersions(updatedVersions);
      await updateDoc(doc(db, "projects", projectId), {
        files,
        fileVersions: updatedVersions,
        updatedAt: new Date().toISOString(),
      });
      addNotification("MEMORY_SAVED: Neural states persisted.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}`);
    }
  };

  const handleDeploy = () => {
    setTerminalOpen(true);
    addNotification("INITIALIZING_DEPLOY_SEQUENCE...");
    setTimeout(() => {
      addNotification("DEPLOY_COMPLETE: Instance reachable globally.");
    }, 2000);
  };

  const handleDownload = () => {
    addNotification("PACKAGING_NEURAL_ASSETS...");
    const content = JSON.stringify(files, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "project"}-neural-bundle.json`;
    a.click();
    addNotification("DOWNLOAD_STARTED: Local copy transfer active.");
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = newFileName.includes('.') ? newFileName : `${newFileName}.tsx`;
    setFiles(prev => ({ ...prev, [path]: "// Initialized by Neural Workforce" }));
    setActiveFile(path);
    setNewFileName("");
    setIsNewFileModalOpen(false);
    addNotification(`FILE_CREATED: ${path} integrated.`);
  };

  const handleDeleteFile = (path: string) => {
    if (Object.keys(files).length <= 1) {
      addNotification("ERROR: Project root must contain at least one neural artifact.");
      return;
    }
    const newFiles = { ...files };
    delete newFiles[path];
    setFiles(newFiles);
    if (activeFile === path) setActiveFile(Object.keys(newFiles)[0]);
    addNotification(`FILE_DELETED: ${path} purged from memory.`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiTyping) return;

    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsAiTyping(true);

    try {
      const response = await orchestrateAgent(activeAgent, input, { project, files });
      setMessages(prev => [...prev, { role: "assistant", text: response }]);
    } catch (err) {
      console.error("Agent Sync Failed:", err);
      addNotification("ERROR: Agent synchronization failed. Check link connectivity.");
    } finally {
      setIsAiTyping(false);
    }
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center font-mono text-cyan-400 bg-white dark:bg-slate-950">
    <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
    <span className="animate-pulse tracking-[0.3em] font-black uppercase text-xs">SYNCHRONIZING_COGNITIVE_NODES...</span>
  </div>;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 pt-14 selection:bg-cyan-500/20 transition-colors duration-300">
      {/* Workspace Header */}
      <div className="h-14 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">PROJECT_ROOT</span>
              <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
              <span className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-tight">{project.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
               <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono">NEURAL_INSTANCE_ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/5 dark:bg-slate-950/50 p-1.5 rounded-xl border border-black/5 dark:border-white/5 gap-1">
            {[
              { id: "code", label: "CODE_BASE", icon: Code },
              { id: "split", label: "NEURAL_SPLIT", icon: Layout },
              { id: "preview", label: "LIVE_REEL", icon: Eye }
            ].map((mode) => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)} 
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all uppercase tracking-wider",
                  viewMode === mode.id 
                    ? "bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/10" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <mode.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-black/5 dark:bg-white/10 mx-2" />

          <button onClick={handleSave} className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl text-slate-500 group transition-all" title="Persist Memory">
            <Save className="w-4 h-4 group-hover:text-cyan-500" />
          </button>
          
          <button onClick={handleDownload} className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl text-slate-500 group transition-all" title="Download Assets">
            <Download className="w-4 h-4 group-hover:text-cyan-500" />
          </button>
          
          <button onClick={handleDeploy} className="px-6 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-all shadow-md active:scale-95 uppercase tracking-wider">
            <Globe className="w-3 h-3" /> Execute Deploy
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
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

        {/* File Explorer Sidebar */}
        <div className="w-64 border-r border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 overflow-y-auto hidden lg:flex flex-col transition-colors duration-300">
          <div className="p-6 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-slate-900/20 flex justify-between items-center">
             <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Filesystem_v1</span>
             <button 
              onClick={() => setIsNewFileModalOpen(true)}
              className="p-1.5 bg-black/5 dark:bg-white/5 hover:bg-cyan-600 dark:hover:bg-cyan-400 hover:text-white rounded-lg transition-all text-slate-500"
             >
                <Plus className="w-3.5 h-3.5" />
             </button>
          </div>
          <div className="py-4 space-y-1">
            {Object.keys(files).map(path => (
              <div key={path} className="group relative">
                <button
                  onClick={() => setActiveFile(path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-2.5 text-xs transition-all relative font-medium",
                    activeFile === path 
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-400/5" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  {activeFile === path && <motion.div layoutId="activeFileGlow" className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(6,182,212,0.8)]" />}
                  <FileCode className={cn("w-4 h-4", activeFile === path ? "text-cyan-500" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400")} />
                  <span className="flex-1 text-left truncate">{path}</span>
                </button>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const versions = fileVersions[path];
                      if (versions && versions.length > 0) {
                        const previousVersion = versions[versions.length - 1];
                        setFiles(prev => ({ ...prev, [path]: previousVersion }));
                        setFileVersions(prev => ({ ...prev, [path]: versions.slice(0, -1) }));
                        addNotification(`ROLLBACK_COMPLETE: ${path} reverted.`);
                      } else {
                        addNotification("ROLLBACK_FAILED: No previous version found.");
                      }
                    }}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-slate-400"
                    title="Neural Rollback"
                  >
                    <Clock className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(path);
                    }}
                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-slate-400"
                    title="Purge Artifact"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-auto p-6 border-t border-black/5 dark:border-white/5">
             <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase mb-2 italic">Neural Sync Status</p>
                <div className="w-full h-1 bg-black/5 dark:bg-slate-900 rounded-full overflow-hidden">
                   <div className="w-[85%] h-full bg-cyan-500 animate-pulse" />
                </div>
                <p className="text-[8px] text-slate-400 dark:text-slate-600 mt-2 font-mono uppercase tracking-widest">IO_THROUGHPUT: 1.2GB/s</p>
             </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className={cn("flex-1 bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300", viewMode === "preview" ? "hidden" : "flex")}>
          <div className="flex-1 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10 pointer-events-none" />
            <Editor
              theme={monoTheme}
              language="typescript"
              value={files[activeFile]}
              onChange={(v) => setFiles(prev => ({ ...prev, [activeFile]: v || "" }))}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollbar: { vertical: "hidden", horizontal: "hidden" },
                padding: { top: 32 },
                fontFamily: "JetBrains Mono, monospace",
                lineNumbers: "on",
                renderLineHighlight: "all",
                cursorBlinking: "phase",
                smoothScrolling: true,
                automaticLayout: true
              }}
            />
          </div>
          
          {/* Terminal */}
          <AnimatePresence>
            {terminalOpen && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "12rem" }}
                exit={{ height: 0 }}
                className="border-t border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-6 font-mono text-[11px] overflow-y-auto space-y-1 transition-colors"
              >
                <div className="flex justify-between items-center mb-4 border-b border-black/5 dark:border-white/5 pb-2">
                   <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System_Console_v03</span>
                   <Terminal className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                </div>
                <div className="flex gap-3"><span className="text-emerald-500 font-bold uppercase">[DevOps]</span> <span className="text-slate-500 dark:text-slate-400">Environment initialized. Node_ID: AGT-982</span></div>
                <div className="flex gap-3"><span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase">[IDE]</span> <span className="text-slate-500 dark:text-slate-400">Listening for neural file changes...</span></div>
                <div className="flex gap-3 animate-pulse"><span className="text-slate-300 dark:text-slate-700">&gt;</span> <span className="text-slate-800 dark:text-slate-200">await Aigent.execute("optimize-bundle")</span></div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="h-10 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-slate-900/30 flex items-center px-6 justify-between select-none">
            <div className="flex items-center gap-6 text-[10px] font-black font-mono">
              <span className="flex items-center gap-2 text-emerald-500 uppercase tracking-tighter"><Check className="w-3 h-3" /> Neural_State: Synchronized</span>
              <button 
                onClick={() => setTerminalOpen(!terminalOpen)}
                className={cn("flex items-center gap-2 uppercase tracking-tighter transition-colors px-2 py-0.5 rounded", terminalOpen ? "bg-cyan-500 text-slate-950" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white")}
              >
                <Terminal className="w-3 h-3" /> Console_IO
              </button>
            </div>
            <div className="font-mono text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">TSX / LF / UTF-8</div>
          </div>
        </div>

        {/* Preview Area */}
        <div className={cn("flex-1 bg-white dark:bg-slate-950 border-l border-black/5 dark:border-white/10 relative overflow-hidden transition-colors", (viewMode === "preview" || viewMode === "split") ? "block" : "hidden")}>
           <div className="h-full w-full">
             <iframe
               srcDoc={generatePreviewHTML(files)}
               title="Live Preview"
               sandbox="allow-scripts"
               className="w-full h-full border-0 bg-white"
             />
           </div>
        </div>

        {/* AI Agent Chat Panel */}
        <AnimatePresence mode="wait">
          {chatOpen ? (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-96 border-l border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 flex flex-col fixed inset-y-0 right-0 lg:relative pt-14 lg:pt-0 z-40 shadow-2xl transition-colors"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Neural Workforce</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-slate-400 transition-all"><X className="w-4 h-4" /></button>
              </div>

              {/* Right Panel Tabs */}
              <div className="flex p-2 bg-black/[0.01] dark:bg-slate-900/50 border-b border-black/5 dark:border-white/5">
                {[
                  { id: "chat", label: "Neural Chat", icon: MessageSquare },
                  { id: "trace", label: "Neural Trace", icon: Terminal },
                  { id: "approvals", label: "Approvals", icon: Shield }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRightPanelTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                      rightPanelTab === tab.id 
                        ? "bg-black/5 dark:bg-white/5 text-cyan-600 dark:text-cyan-400" 
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <tab.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === "approvals" && pendingApprovals.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {rightPanelTab === "chat" && (
                <>
                  {/* Agent Selection */}
                  <div className="grid grid-cols-4 p-4 gap-2 bg-black/[0.01] dark:bg-slate-900/30 border-b border-black/5 dark:border-white/5">
                    {[
                      { id: "pm", label: "PM", icon: User, color: "text-amber-500" },
                      { id: "developer", label: "DEV", icon: Code, color: "text-cyan-500" },
                      { id: "designer", label: "DES", icon: Sparkles, color: "text-purple-500" },
                      { id: "compliance", label: "SAFE", icon: Shield, color: "text-red-500" },
                      { id: "debugger", label: "BUG", icon: AlertCircle, color: "text-orange-500" },
                      { id: "explainer", label: "EXP", icon: MessageSquare, color: "text-blue-500" },
                      { id: "security", label: "SEC", icon: Shield, color: "text-emerald-500" },
                      { id: "finance", label: "FIN", icon: CreditCard, color: "text-yellow-600" }
                    ].map(agent => (
                      <button 
                        key={agent.id}
                        onClick={() => setActiveAgent(agent.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl text-[8px] font-black border transition-all gap-1 group",
                          activeAgent === agent.id 
                            ? "bg-black/5 dark:bg-white/5 border-cyan-500/50 text-slate-900 dark:text-white" 
                            : "bg-transparent border-transparent text-slate-400 dark:text-slate-600 hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                      >
                        <agent.icon className={cn("w-3.5 h-3.5 mb-1 group-hover:scale-110 transition-transform", activeAgent === agent.id ? agent.color : "text-slate-300 dark:text-slate-700")} />
                        {agent.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Wand2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Intelligence_Relay:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">I am the AI {activeAgent.toUpperCase()}. Transmit your neural requirements for high-stakes execution.</p>
                    </div>

                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                        <div className={cn(
                           "max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed shadow-sm",
                           m.role === "user"
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold"
                            : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300 font-medium [&_pre]:bg-slate-900 [&_pre]:dark:bg-slate-800 [&_pre]:text-cyan-300 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_code]:font-mono [&_code]:text-[10px] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:mb-1"
                        )}>
                          {m.role === "assistant" ? <Markdown>{m.text}</Markdown> : m.text}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{m.role}</span>
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex items-center gap-3 text-cyan-500">
                        <div className="flex gap-1.5">
                          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        </div>
                        <span className="text-[10px] font-bold tracking-wider uppercase">Agent_Syncing...</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-6 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-slate-900/30">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Enter neural prompt..." 
                        className="w-full bg-white dark:bg-slate-950 border border-black/10 dark:border-white/5 rounded-2xl py-4 pl-6 pr-14 text-xs font-medium focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                      />
                      <button className="absolute right-2 top-2 p-2 bg-slate-900 dark:bg-cyan-500 rounded-xl hover:bg-cyan-500 dark:hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">
                        <Send className="w-4 h-4 text-white dark:text-slate-950" />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {rightPanelTab === "trace" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono">
                  <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Neural Reasoning Trace</span>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-20">
                      <Terminal className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">No trace entries yet.</p>
                    </div>
                  ) : (
                    auditLogs.map(log => (
                      <div key={log.id} className="p-4 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase">[{log.agent}]</span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-500">{log.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-900 dark:text-white font-bold">{log.action}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed">REASON: {log.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {rightPanelTab === "approvals" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-4">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pending Neural Approvals</span>
                  </div>
                  {pendingApprovals.length === 0 ? (
                    <div className="text-center py-20">
                      <Check className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">All neural nodes authorized.</p>
                    </div>
                  ) : (
                    pendingApprovals.map(app => (
                      <div key={app.id} className="p-5 rounded-2xl bg-black/[0.01] dark:bg-white/5 border border-red-500/20 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded uppercase tracking-wider">HIGH_STAKES_ACTION</span>
                          {app.cost && <span className="text-[11px] font-bold text-slate-900 dark:text-white italic">{app.cost}</span>}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Requester: AI {app.agent}</p>
                          <p className="text-sm font-bold text-slate-950 dark:text-white">{app.action}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            if (!projectId) return;
                            try {
                              await deleteDoc(doc(db, "projects", projectId, "approvals", app.id));
                              setPendingApprovals(prev => prev.filter(p => p.id !== app.id));
                              addNotification("APPROVED: Action authorized and executed.");
                            } catch (err) {
                              addNotification("ERROR: Approval processing failed.");
                            }
                          }} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all shadow-sm">APPROVE</button>
                          <button onClick={async () => {
                            if (!projectId) return;
                            try {
                              await deleteDoc(doc(db, "projects", projectId, "approvals", app.id));
                              setPendingApprovals(prev => prev.filter(p => p.id !== app.id));
                              addNotification("DENIED: Action rejected.");
                            } catch (err) {
                              addNotification("ERROR: Denial processing failed.");
                            }
                          }} className="flex-1 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all">DENY</button>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Create a test approval */}
                  <div className="pt-10 border-t border-black/5 dark:border-white/5">
                    <button
                      onClick={async () => {
                        if (!projectId) return;
                        try {
                          const approvalsRef = collection(db, "projects", projectId, "approvals");
                          const docRef = await addDoc(approvalsRef, {
                            agent: "Market",
                            action: "DEPLOY_FB_ADS_CAMPAIGN: Neural_Omni_V1",
                            cost: "$250.00",
                            status: "pending",
                            createdAt: new Date().toISOString(),
                          });
                          setPendingApprovals(prev => [{ id: docRef.id, agent: "Market", action: "DEPLOY_FB_ADS_CAMPAIGN: Neural_Omni_V1", cost: "$250.00" }, ...prev]);
                          addNotification("APPROVAL_CREATED: High-stakes action pending review.");
                        } catch (err) {
                          addNotification("ERROR: Failed to create approval.");
                        }
                      }}
                      className="w-full py-3 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 text-[10px] font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider font-mono shadow-sm"
                    >
                      Create Test Approval
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <button 
              onClick={() => setChatOpen(true)}
              className="w-14 border-l border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 hidden lg:flex flex-col items-center py-8 gap-10 text-slate-400 dark:text-slate-600 hover:text-cyan-500 transition-all group"
            >
              <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/10 flex items-center justify-center group-hover:border-cyan-500/50">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="[writing-mode:vertical-rl] text-[9px] font-black tracking-[0.4em] uppercase text-slate-400 dark:text-slate-700 group-hover:text-cyan-500/50 italic">AI_WORKFORCE_STANDBY</div>
            </button>
          )}
        </AnimatePresence>

        {/* New File Modal */}
        <AnimatePresence>
          {isNewFileModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNewFileModalOpen(false)}
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl transition-colors"
              >
                <h2 className="text-2xl font-bold text-slate-950 dark:text-white uppercase tracking-tight mb-6">Forge Artifact</h2>
                <form onSubmit={handleAddFile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Designation</label>
                    <input 
                      autoFocus
                      required
                      placeholder="e.g. style.css" 
                      className="w-full bg-slate-50 dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-950 dark:text-white focus:border-cyan-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsNewFileModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white text-[10px] font-bold rounded-2xl uppercase tracking-widest shadow-sm"
                    >
                      Abort
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-slate-950 dark:bg-cyan-500 text-white dark:text-slate-950 text-[10px] font-bold rounded-2xl shadow-lg shadow-cyan-500/10 uppercase tracking-widest transition-all"
                    >
                      Initialize
                    </button>
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
