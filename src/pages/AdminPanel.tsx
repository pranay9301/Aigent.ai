import { useState, useEffect } from "react";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { motion } from "motion/react";
import { 
  Users, Briefcase, CreditCard, ShieldAlert, 
  BarChart3, Activity, Globe, MessageSquare,
  Search, Filter, MoreVertical, CheckCircle, XCircle
} from "lucide-react";
import { cn } from "../lib/utils";

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersQ = query(collection(db, "users"), limit(50));
        const usersSnap = await getDocs(usersQ);
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const projectsSnap = await getDocs(collection(db, "projects"));
        setProjectCount(projectsSnap.size);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "users");
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u =>
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name || u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-24 pb-12 px-6 container mx-auto bg-white dark:bg-slate-950 transition-colors duration-500 min-h-screen">
      <div className="mb-12 transition-all duration-500">
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-950 dark:text-white uppercase">GLOBAL ADMIN COMMAND</h1>
        <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider font-bold">Enterprise Oversight & Security</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500" },
          { label: "Total Projects", value: projectCount, icon: CreditCard, color: "text-green-500" },
          { label: "Admin Users", value: users.filter(u => u.role === "admin").length, icon: Activity, color: "text-yellow-500" },
          { label: "Subscribed", value: users.filter(u => u.subscription && u.subscription !== "free").length, icon: ShieldAlert, color: "text-red-500" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-700">PRIME_DIRECTIVE</span>
            </div>
            <p className="text-2xl font-bold text-slate-950 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 rounded-3xl overflow-hidden transition-colors">
          <div className="p-6 border-b border-black/5 dark:border-slate-800 flex justify-between items-center bg-slate-100/50 dark:bg-gray-900/50">
            <h3 className="font-bold flex items-center gap-2 text-slate-950 dark:text-white uppercase text-sm tracking-tight"><Users className="w-4 h-4 text-blue-500" /> User Directory</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                <input type="text" placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white dark:bg-black border border-black/5 dark:border-slate-800 rounded-xl px-8 py-2 text-[10px] outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white" />
              </div>
              <button className="p-2 bg-white dark:bg-slate-800 border border-black/5 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"><Filter className="w-3.5 h-3.5 text-slate-500" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-600 border-b border-black/5 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 uppercase text-[10px] font-bold tracking-widest">No nodes detected in local sector.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-gray-800/50 hover:bg-slate-100/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-700 dark:text-slate-300">{u.displayName?.[0] || "?"}</div>
                          <div>
                            <p className="font-bold text-slate-950 dark:text-slate-200 uppercase tracking-tight">{u.displayName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono uppercase tracking-wider">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-500 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle className="w-2.5 h-2.5" /> ACTIVE
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold font-mono text-blue-700 dark:text-blue-500 uppercase tracking-wider">Free Tier</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 rounded-3xl overflow-hidden p-8 flex flex-col transition-colors">
          <h3 className="font-bold uppercase tracking-tight flex items-center gap-2 mb-8 text-slate-950 dark:text-white"><Activity className="w-4 h-4 text-purple-500" /> Live Neural Activity</h3>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            {users.length === 0 ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-4">No activity data available.</p>
            ) : (
              users.slice(0, 4).map((u, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    u.role === "admin" ? "bg-red-500" :
                    u.subscription && u.subscription !== "free" ? "bg-green-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{u.role === "admin" ? "ADMIN" : "USER"}</span>
                      <span className="text-[8px] font-mono text-slate-300 dark:text-slate-700">{u.subscription || "free"}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium transition-colors italic">{u.email || u.name || "Unknown user"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl tracking-widest uppercase transition-all shadow-sm active:scale-95">
            Full Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}
