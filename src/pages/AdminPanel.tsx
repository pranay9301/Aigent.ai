import { useState, useEffect } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
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
  const [stats, setStats] = useState({
    activeUsers: 1284,
    totalRevenue: 24750,
    apiCalls: 845000,
    systemLoad: "12%"
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), limit(10));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => doc.data()));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "users");
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="pt-24 pb-12 px-6 container mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-black italic mb-2 tracking-tight">GLOBAL ADMIN COMMAND</h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Enterprise Oversight & Security</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Active Nodes", value: stats.activeUsers, icon: Users, color: "text-blue-500" },
          { label: "Net Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-green-500" },
          { label: "Sync Requests", value: stats.apiCalls.toLocaleString(), icon: Activity, color: "text-yellow-500" },
          { label: "Global Load", value: stats.systemLoad, icon: ShieldAlert, color: "text-red-500" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-gray-900/30 border border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <span className="text-[10px] font-mono text-gray-700">PRIME_DIRECTIVE</span>
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs text-gray-500 font-mono mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-gray-900/30 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h3 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> User Directory</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3 h-3 text-gray-600" />
                <input type="text" placeholder="Filter..." className="bg-black border border-gray-800 rounded px-7 py-1 text-[10px] outline-none focus:border-blue-500" />
              </div>
              <button className="p-1.5 bg-gray-800 rounded hover:bg-gray-700"><Filter className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-mono text-gray-600 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No nodes detected in local sector.</td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs uppercase">{u.displayName?.[0] || "?"}</div>
                          <div>
                            <p className="font-bold text-gray-300">{u.displayName}</p>
                            <p className="text-[10px] text-gray-600 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                          <CheckCircle className="w-2 h-2" /> ACTIVE
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-blue-500 uppercase">{u.subscription || "FREE"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 hover:text-white text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl overflow-hidden p-6 flex flex-col">
          <h3 className="font-bold flex items-center gap-2 mb-6"><Activity className="w-4 h-4 text-purple-500" /> Live Neural Activity</h3>
          <div className="flex-1 space-y-6 overflow-y-auto">
            {[
              { type: "DEPLOY", text: "Project 'Nexus CRM' deployed to production.", time: "2m ago" },
              { type: "AI_WARN", text: "AI Debugger identified performance leak in 'Alpha-Core'.", time: "14m ago" },
              { type: "BILLING", text: "Enterprise renewal for 'CyberDynd' processed.", time: "1h ago" },
              { type: "SECURITY", text: "Blocked suspicious access attempt from 192.168.1.1", time: "3h ago" }
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5",
                  activity.type === "DEPLOY" ? "bg-green-500" : 
                  activity.type === "AI_WARN" ? "bg-yellow-500" :
                  activity.type === "SECURITY" ? "bg-red-500" : "bg-blue-500"
                )} />
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{activity.type}</span>
                    <span className="text-[8px] font-mono text-gray-700">{activity.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-tight">{activity.text}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-[10px] rounded-xl tracking-widest uppercase">
            Full Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}
