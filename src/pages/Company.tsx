import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "motion/react";
import {
  Building2, Target, Zap, Mail, Share2, Rocket, BarChart3,
  Users, Plus, Trash2, Play, Clock, Copy, ChevronRight,
  Globe, Send, Calendar, Check, Loader2, GitBranch, Settings,
  Shield, Crown, UserPlus, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { orchestrateAgent } from "../lib/gemini";

type Tab = "overview" | "tasks" | "email" | "social" | "deploy" | "team";

const AGENTS = [
  { id: "developer", label: "DEV", icon: "⚡" },
  { id: "designer", label: "DES", icon: "🎨" },
  { id: "pm", label: "PM", icon: "📋" },
  { id: "market", label: "MKT", icon: "📈" },
  { id: "security", label: "SEC", icon: "🛡️" },
  { id: "finance", label: "FIN", icon: "💰" },
];

const SCHEDULES = ["hourly", "daily", "weekly"];

const PLATFORMS = [
  { id: "twitter", label: "Twitter/X", color: "bg-blue-500" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-700" },
  { id: "instagram", label: "Instagram", color: "bg-pink-500" },
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
];

export default function Company() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState("");
  const [formVision, setFormVision] = useState("");
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [deploys, setDeploys] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Task form
  const [newTaskAgent, setNewTaskAgent] = useState("developer");
  const [newTaskPrompt, setNewTaskPrompt] = useState("");
  const [newTaskSchedule, setNewTaskSchedule] = useState("daily");

  // Email form
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Social form
  const [socialPlatform, setSocialPlatform] = useState("twitter");
  const [socialContent, setSocialContent] = useState("");
  const [generatingSocial, setGeneratingSocial] = useState(false);

  // Deploy form
  const [deployTarget, setDeployTarget] = useState<"github" | "vercel">("github");
  const [deployRepo, setDeployRepo] = useState("");
  const [deploying, setDeploying] = useState(false);

  // Team invite
  const [inviteEmail, setInviteEmail] = useState("");

  const notify = (msg: string) => setNotifications(prev => [msg, ...prev]);

  // Load company
  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      try {
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("ownerId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setCompany({ id: doc.id, ...doc.data() });
          setFormName(doc.data().name || "");
          setFormVision(doc.data().vision || "");
        }
      } catch (err) {
        console.error("Failed to load company:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load tasks
  useEffect(() => {
    if (!company?.id) return;
    const loadTasks = async () => {
      const snap = await getDocs(collection(db, "companies", company.id, "tasks"));
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadTasks();
  }, [company?.id]);

  // Load social posts
  useEffect(() => {
    if (!company?.id) return;
    const loadSocial = async () => {
      const snap = await getDocs(collection(db, "companies", company.id, "socialPosts"));
      setSocialPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadSocial();
  }, [company?.id]);

  // Load deploys
  useEffect(() => {
    if (!company?.id) return;
    const loadDeploys = async () => {
      const snap = await getDocs(collection(db, "companies", company.id, "deploys"));
      setDeploys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadDeploys();
  }, [company?.id]);

  // Load members
  useEffect(() => {
    if (!company?.id) return;
    const loadMembers = async () => {
      const snap = await getDocs(collection(db, "companies", company.id, "members"));
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadMembers();
  }, [company?.id]);

  // Create company
  const handleCreateCompany = async () => {
    if (!auth.currentUser || !formName.trim()) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "companies"), {
        name: formName.trim(),
        vision: formVision.trim(),
        ownerId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setCompany({ id: docRef.id, name: formName.trim(), vision: formVision.trim() });
      notify("COMPANY_INITIALIZED: Neural entity created.");
    } catch (err) {
      notify("ERROR: Company creation failed.");
    }
    setSaving(false);
  };

  // Update company
  const handleUpdateCompany = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "companies", company.id), {
        name: formName.trim(),
        vision: formVision.trim(),
        updatedAt: new Date().toISOString(),
      });
      setCompany((prev: any) => ({ ...prev, name: formName.trim(), vision: formVision.trim() }));
      setEditMode(false);
      notify("COMPANY_UPDATED: Neural entity modified.");
    } catch (err) {
      notify("ERROR: Update failed.");
    }
    setSaving(false);
  };

  // Create task
  const handleCreateTask = async () => {
    if (!company?.id || !newTaskPrompt.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "companies", company.id, "tasks"), {
        agent: newTaskAgent,
        prompt: newTaskPrompt.trim(),
        schedule: newTaskSchedule,
        status: "pending",
        createdAt: new Date().toISOString(),
        lastRunAt: null,
        result: null,
      });
      setTasks(prev => [{ id: docRef.id, agent: newTaskAgent, prompt: newTaskPrompt.trim(), schedule: newTaskSchedule, status: "pending" }, ...prev]);
      setNewTaskPrompt("");
      notify("TASK_SCHEDULED: Autonomous agent task queued.");
    } catch (err) {
      notify("ERROR: Task creation failed.");
    }
  };

  // Run task manually
  const handleRunTask = async (taskId: string, agent: string, prompt: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "running" } : t));
    try {
      const visionContext = company?.vision ? `Company Vision: ${company.vision}\n` : "";
      const result = await orchestrateAgent(agent, visionContext + prompt);
      await updateDoc(doc(db, "companies", company.id, "tasks", taskId), {
        status: "completed",
        result: result.text,
        lastRunAt: new Date().toISOString(),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "completed", result: result.text } : t));
      notify(`TASK_COMPLETED: ${agent.toUpperCase()} agent finished.`);
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "failed" } : t));
      notify("ERROR: Task execution failed.");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!company?.id) return;
    await deleteDoc(doc(db, "companies", company.id, "tasks", taskId));
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Send email
  const handleSendEmail = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo.trim(), subject: emailSubject.trim(), body: emailBody.trim() }),
      });
      if (res.ok) {
        notify("EMAIL_SENT: Message dispatched via neural relay.");
        setEmailTo(""); setEmailSubject(""); setEmailBody("");
      } else {
        notify("ERROR: Email delivery failed.");
      }
    } catch (err) {
      notify("ERROR: Email service unreachable.");
    }
    setSendingEmail(false);
  };

  // Generate social post
  const handleGenerateSocial = async () => {
    if (!company?.id) return;
    setGeneratingSocial(true);
    try {
      const prompt = `Write a compelling ${socialPlatform} post for a company with this vision: "${company.vision || "AI-powered platform"}". Keep it concise, engaging, and include relevant hashtags.`;
      const result = await orchestrateAgent("market", prompt);
      setSocialContent(result.text);
    } catch (err) {
      notify("ERROR: Social content generation failed.");
    }
    setGeneratingSocial(false);
  };

  // Save social draft
  const handleSaveDraft = async () => {
    if (!company?.id || !socialContent.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "companies", company.id, "socialPosts"), {
        platform: socialPlatform,
        content: socialContent.trim(),
        status: "draft",
        createdAt: new Date().toISOString(),
      });
      setSocialPosts(prev => [{ id: docRef.id, platform: socialPlatform, content: socialContent.trim(), status: "draft" }, ...prev]);
      setSocialContent("");
      notify("DRAFT_SAVED: Social content archived.");
    } catch (err) {
      notify("ERROR: Draft save failed.");
    }
  };

  // Deploy
  const handleDeploy = async () => {
    if (!deployRepo.trim()) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/deploy/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: deployTarget,
          repo: deployRepo.trim(),
          companyId: company?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeploys(prev => [
          {
            id: Date.now().toString(),
            target: deployTarget,
            repo: deployRepo,
            status: "success",
            url: data.url,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        notify(`DEPLOY_SUCCESS: Pushed to ${deployTarget}.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(`ERROR: Deployment failed. ${errData?.error || ""}`);
      }
    } catch (err) {
      notify("ERROR: Deploy service unreachable.");
    }
    setDeploying(false);
  };

  // Invite team member
  const handleInvite = async () => {
    if (!company?.id || !inviteEmail.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "companies", company.id, "members"), {
        email: inviteEmail.trim(),
        role: "member",
        status: "pending",
        invitedAt: new Date().toISOString(),
      });
      setMembers(prev => [{ id: docRef.id, email: inviteEmail.trim(), role: "member", status: "pending" }, ...prev]);
      setInviteEmail("");
      notify("INVITE_SENT: Neural node invitation dispatched.");
    } catch (err) {
      notify("ERROR: Invitation failed.");
    }
  };

  // Update member role
  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!company?.id) return;
    await updateDoc(doc(db, "companies", company.id, "members", memberId), { role });
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!company?.id) return;
    await deleteDoc(doc(db, "companies", company.id, "members", memberId));
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  // No company yet — show creation form
  if (!company) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto mt-10">
          <div className="text-center mb-10">
            <Building2 className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white uppercase tracking-wider mb-2">Initialize Your Company</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Define your vision. Deploy autonomous agents. Build your empire.</p>
          </div>
          <div className="p-8 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Company Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="My Neural Company" className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Company Vision</label>
              <textarea value={formVision} onChange={e => setFormVision(e.target.value)} placeholder="Describe what your company does and what agents should work towards..." rows={4} className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-mono focus:outline-none focus:border-cyan-500/50 resize-none" />
            </div>
            <button onClick={handleCreateCompany} disabled={saving || !formName.trim()} className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-slate-950 text-sm font-bold rounded-xl uppercase tracking-wider transition-all">
              {saving ? "INITIALIZING..." : "INITIALIZE COMPANY"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Company exists — show dashboard
  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "tasks", label: "Tasks", icon: Zap },
    { id: "email", label: "Email", icon: Mail },
    { id: "social", label: "Social", icon: Share2 },
    { id: "deploy", label: "Deploy", icon: Rocket },
    { id: "team", label: "Team", icon: Users },
  ];

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const draftsCount = socialPosts.filter(s => s.status === "draft").length;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-3">
              <Building2 className="w-5 h-5 text-cyan-500" />
              {company.name}
            </h1>
            {company.vision && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">{company.vision}</p>}
          </div>
          <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:border-cyan-500/50 transition-all flex items-center gap-2">
            <Settings className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Notifications */}
        <div className="space-y-1 mb-4">
          {notifications.slice(0, 3).map((n, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{">"} {n}</motion.div>
          ))}
        </div>

        {/* Edit Modal */}
        {editMode && (
          <div className="mb-6 p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-4">
            <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono" placeholder="Company name" />
            <textarea value={formVision} onChange={e => setFormVision(e.target.value)} rows={3} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono resize-none" placeholder="Company vision" />
            <div className="flex gap-2">
              <button onClick={handleUpdateCompany} disabled={saving} className="px-4 py-2 bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg">SAVE</button>
              <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg">CANCEL</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap", tab === t.id ? "bg-cyan-500 text-slate-950" : "bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white")}>
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Tasks", value: tasks.filter(t => t.status === "running").length, icon: Zap, color: "text-amber-500" },
              { label: "Completed", value: completedTasks, icon: Check, color: "text-emerald-500" },
              { label: "Social Drafts", value: draftsCount, icon: Share2, color: "text-blue-500" },
              { label: "Deploys", value: deploys.length, icon: Rocket, color: "text-purple-500" },
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
                <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tasks Tab */}
        {tab === "tasks" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Schedule New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={newTaskAgent} onChange={e => setNewTaskAgent(e.target.value)} className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm">
                  {AGENTS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
                </select>
                <select value={newTaskSchedule} onChange={e => setNewTaskSchedule(e.target.value)} className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm">
                  {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleCreateTask} disabled={!newTaskPrompt.trim()} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2 justify-center">
                  <Plus className="w-3 h-3" /> Create Task
                </button>
              </div>
              <textarea value={newTaskPrompt} onChange={e => setNewTaskPrompt(e.target.value)} placeholder="Describe what this agent should do on each cycle..." rows={2} className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono resize-none" />
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-center py-10 text-sm text-slate-500">No tasks scheduled yet.</p>
              ) : tasks.map(task => (
                <div key={task.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 flex items-start gap-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", task.status === "running" ? "bg-amber-500/10 text-amber-500" : task.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : task.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-500")}>
                    {AGENTS.find(a => a.id === task.agent)?.icon || "⚡"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">{task.agent}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-500">{task.schedule}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold", task.status === "running" ? "bg-amber-500/10 text-amber-500" : task.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : task.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-500")}>{task.status}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{task.prompt}</p>
                    {task.result && <p className="text-[10px] text-slate-500 mt-1 truncate">Last result: {task.result.slice(0, 100)}...</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleRunTask(task.id, task.agent, task.prompt)} disabled={task.status === "running"} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500" title="Run now">
                      <Play className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Tab */}
        {tab === "email" && (
          <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Mail className="w-3 h-3" /> Send Email</h3>
            <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@example.com" className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono" />
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono" />
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Email body..." rows={6} className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono resize-none" />
            <button onClick={handleSendEmail} disabled={sendingEmail || !emailTo.trim() || !emailSubject.trim() || !emailBody.trim()} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2">
              {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send Email
            </button>
          </div>
        )}

        {/* Social Tab */}
        {tab === "social" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Generate Social Post</h3>
              <div className="flex gap-4">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setSocialPlatform(p.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all", socialPlatform === p.id ? `${p.color} text-white` : "bg-black/5 dark:bg-white/5 text-slate-500")}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button onClick={handleGenerateSocial} disabled={generatingSocial} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2">
                {generatingSocial ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Generate Content
              </button>
              <textarea value={socialContent} onChange={e => setSocialContent(e.target.value)} placeholder="Generated or custom social content..." rows={4} className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono resize-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveDraft} disabled={!socialContent.trim()} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider">Save Draft</button>
                <button onClick={() => navigator.clipboard.writeText(socialContent)} disabled={!socialContent.trim()} className="px-4 py-2 bg-black/5 dark:bg-white/5 text-slate-500 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {socialPosts.map(post => (
                <div key={post.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", PLATFORMS.find(p => p.id === post.platform)?.color || "bg-slate-500", "text-white")}>{post.platform}</span>
                    <span className="text-[9px] text-slate-500">{post.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy Tab */}
        {tab === "deploy" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deploy Project</h3>
              <div className="flex gap-4">
                <button onClick={() => setDeployTarget("github")} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", deployTarget === "github" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-black/5 dark:bg-white/5 text-slate-500")}>
                  <GitBranch className="w-3 h-3" /> GitHub
                </button>
                <button onClick={() => setDeployTarget("vercel")} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", deployTarget === "vercel" ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/5 dark:bg-white/5 text-slate-500")}>
                  <Globe className="w-3 h-3" /> Vercel
                </button>
              </div>
              <input value={deployRepo} onChange={e => setDeployRepo(e.target.value)} placeholder={deployTarget === "github" ? "owner/repo-name" : "project-name"} className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono" />
              <button onClick={handleDeploy} disabled={deploying || !deployRepo.trim()} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2">
                {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />} Deploy to {deployTarget}
              </button>
            </div>

            <div className="space-y-3">
              {deploys.map(d => (
                <div key={d.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center gap-3">
                  {d.target === "github" ? <GitBranch className="w-4 h-4 text-slate-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{d.repo}</p>
                    <p className="text-[10px] text-slate-500">{d.createdAt}</p>
                  </div>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", d.status === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>{d.status}</span>
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-500 hover:underline flex items-center gap-1"><ChevronRight className="w-3 h-3" /> View</a>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Tab */}
        {tab === "team" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><UserPlus className="w-3 h-3" /> Invite Member</h3>
              <div className="flex gap-2">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm font-mono" />
                <button onClick={handleInvite} disabled={!inviteEmail.trim()} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider">Invite</button>
              </div>
            </div>

            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-center py-10 text-sm text-slate-500">No team members yet.</p>
              ) : members.map(m => (
                <div key={m.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    {m.role === "owner" ? <Crown className="w-4 h-4 text-amber-500" /> : m.role === "admin" ? <Shield className="w-4 h-4 text-blue-500" /> : <Users className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{m.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <select value={m.role} onChange={e => handleUpdateRole(m.id, e.target.value)} className="text-[10px] bg-transparent border border-black/10 dark:border-white/10 rounded px-1 py-0.5">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", m.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{m.status || "pending"}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
