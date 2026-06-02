import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "motion/react";
import {
  CreditCard, Shield, Zap, BarChart3,
  ArrowUpRight, Clock, CheckCircle2,
  AlertCircle, Download, ExternalLink,
  CreditCard as RazorpayIcon
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Billing() {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dynamicConfig, setDynamicConfig] = useState<{
    paypalClientId: string;
    razorpayKeyId: string;
  } | null>(null);

  const paypalClientId = dynamicConfig?.paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
  const razorpayKeyId = dynamicConfig?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "";
  const isPaypalConfigured = !!paypalClientId && paypalClientId !== "" && paypalClientId !== "sb";
  const isRazorpayConfigured = !!razorpayKeyId && razorpayKeyId !== "";

  const [userSubscription, setUserSubscription] = useState("free");
  const [projectCount, setProjectCount] = useState(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [transactions, setTransactions] = useState<{id: string, amount: string, date: string, status: string, plan: string}[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userSnap.exists()) {
          setUserSubscription(userSnap.data().subscription || "free");
        }
        const projectsQ = query(collection(db, "projects"), where("ownerId", "==", auth.currentUser.uid));
        const projectsSnap = await getDocs(projectsQ);
        setProjectCount(projectsSnap.size);

        // Fetch transaction history
        try {
          const txSnap = await getDocs(collection(db, "users", auth.currentUser.uid, "transactions"));
          setTransactions(txSnap.docs.map(d => {
            const data = d.data();
            return { id: d.id, amount: data.amount, date: data.createdAt || data.date || "", status: data.status, plan: data.plan } as any;
          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch {
          // Transactions collection may not exist yet
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    // Fetch dynamic config if needed
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) {
          throw new Error(`GATEWAY_SYNC_FAILURE: Server responded with status ${res.status}`);
        }
        const data = await res.json();
        console.log("Neural Gateway Sync Result:", data);
        setDynamicConfig(data);
      } catch (err: any) {
        console.error("Critical Gateway Synchronization Error:", err);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const updateSubscription = async (planName: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        subscription: planName.toLowerCase(),
        subscriptionUpdatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to update subscription:", err);
    }
  };

  const handlePaymentError = (err: any) => {
    console.error("Neural Payment Error:", err);
    let message = "Unknown Error";

    if (typeof err == 'string') {
      message = err;
    } else if (err?.message) {
      message = err.message;
    } else if (err?.error) {
      message = err.error;
    }

    // Friendly mapping for common technical errors
    const friendlyMessages: Record<string, string> = {
      "PAYPAL_NOT_CONFIGURED": "The PayPal gateway is not fully configured on the server. Please check your credentials.",
      "PAYMENT_EXECUTION_FAILURE": "Neural gateway rejected the transaction. This usually indicates invalid credentials.",
      "CONFIG_SYNC_ERROR": "Failed to synchronize with the payment infrastructure.",
      "API_ERROR": "The payment provider returned an API error. Please check your account status.",
      "RAZORPAY_NOT_CONFIGURED": "Razorpay payment gateway is not configured. Please check your environment variables.",
    };

    const finalMessage = friendlyMessages[message] || message;

    alert(`PAYMENT_ERROR: ${finalMessage}\n\nPlease verify your Gateway keys in the System Settings Hub.`);
  };

  const handleRazorpayPayment = async (planName: string) => {
  const PLAN_AMOUNT: Record<string, string> = {
    Scale: "69",
    Enterprise: "299",
    scale: "69",
    enterprise: "299",
  };
  const amount = PLAN_AMOUNT[planName] || "0";
  const normalizedPlan = planName.charAt(0).toLowerCase() + planName.slice(1);

  if (!isRazorpayConfigured) {
    handlePaymentError("RAZORPAY_NOT_CONFIGURED");
    return;
  }

  setIsProcessing(true);
  try {
    const response = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "USD" }),
    });
    const order = await response.json();

    const options = {
      key: razorpayKeyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency,
      name: "Aigent.ai",
      description: `${planName} Subscription`,
      order_id: order.id,
      handler: async (response: any) => {
        const verifyRes = await fetch("/api/razorpay/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...response, userId: auth.currentUser?.uid, planName: normalizedPlan }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === "ok") {
          await updateSubscription(planName);
          alert(`Neural Tier Upgraded: ${planName.toUpperCase()} session initialized.`);
        } else {
          alert("Verification Failed");
        }
      },
      theme: {
        color: "#06b6d4",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (err) {
    handlePaymentError(err);
  } finally {
    setIsProcessing(false);
  }
};

  const tierLimits: Record<string, { tokens: string; projects: string; price: string }> = {
    free: { tokens: "50k", projects: "3", price: "$0" },
    scale: { tokens: "1M", projects: "50", price: "$69" },
    enterprise: { tokens: "Unlimited", projects: "Unlimited", price: "$299" },
  };
  const currentTier = tierLimits[userSubscription] || tierLimits.free;
  const planAmount = currentTier.price.replace(/[^0-9.]/g, "") || "0";

  const usageStats = [
    { label: "Subscription Tier", value: userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1), limit: "", percent: 0, color: "text-cyan-400" },
    { label: "Projects", value: projectCount.toString(), limit: currentTier.projects, percent: currentTier.projects === "Unlimited" ? 0 : Math.min((projectCount / parseInt(currentTier.projects)) * 100, 100), color: "text-blue-400" },
    { label: "Token Limit", value: currentTier.tokens, limit: "", percent: 0, color: "text-purple-400" },
  ];

  return (
    <div className="pt-24 pb-12 px-6 container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-950 dark:text-white uppercase">SUBSCRIPTION HUB</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wide leading-relaxed">Manage your neural workforce assets and billing.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Tier: {userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl w-fit mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === "overview" ? "bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
              activeTab === "history" ? "bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Transaction History
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-8 rounded-[2rem] glass-panel relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-950 dark:text-white uppercase mb-1">Aigent {userSubscription.charAt(0).toUpperCase() + userSubscription.slice(1)}</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">Current subscription tier</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-950 dark:text-white">{currentTier.price}<span className="text-sm font-normal text-slate-500 tracking-normal">/mo</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {usageStats.map((stat, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-black/5 dark:bg-slate-800/50 border border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
                          <span className={cn("font-mono text-sm font-bold", stat.color.replace('text-cyan-400', 'text-cyan-600 dark:text-cyan-400'))}>{stat.value}</span>
                        </div>
                        {stat.percent > 0 && (
                          <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-1000 shadow-[0_0_8px_rgba(6,182,212,0.3)]", stat.color.replace('text', 'bg'))}
                              style={{ width: `${stat.percent}%` }}
                            />
                          </div>
                        )}
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 mt-2 block uppercase tracking-wide font-bold">Limit: {stat.limit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-8 rounded-[2rem] border border-black/10 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Neural Payment Gateway
                  </h3>
                </div>

                <div className="space-y-6">
                  {isLoadingConfig ? (
                    <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-cyan-500/20" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Synchronizing Neural Gateways...</span>
                    </div>
                  ) : (!isPaypalConfigured && !isRazorpayConfigured) && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mb-6">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Configuration Required</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">The Payment Systems are currently in restricted mode. Please provide valid API keys in the System Settings Hub to enable transactions.</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-500 italic mb-4 font-medium uppercase tracking-tight">Select your upgrade tier below to scale your neural workforce.</p>

                  <div className="space-y-4">
                    {/* Scale Tier Button */}
                    <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-cyan-500/30 transition-all">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block mb-1">Scale Tier</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tight">Recommended for solo founders</span>
                        </div>
                        <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">$69.00/mo</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block px-1">Alternative Node</label>
                          <button
                            onClick={() => handleRazorpayPayment("Scale")}
                            disabled={isProcessing}
                            className="w-full h-[35px] bg-[#3395ff] hover:bg-[#2087f1] text-white flex items-center justify-center gap-2 rounded-lg transition-all group overflow-hidden relative shadow-sm"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest z-10">Pay with Razorpay</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Enterprise Tier Button */}
                    <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-purple-500/30 transition-all">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block mb-1">Enterprise Tier</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-tight">Full workforce integration</span>
                        </div>
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">$299.00/mo</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block px-1">Alternative Node</label>
                          <button
                            onClick={() => handleRazorpayPayment("Enterprise")}
                            disabled={isProcessing}
                            className="w-full h-[35px] bg-[#3395ff] hover:bg-[#2087f1] text-white flex items-center justify-center gap-2 rounded-lg transition-all group overflow-hidden relative shadow-sm"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest z-10">Pay with Razorpay</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="p-8 rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 shadow-sm">
                <Shield className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-6" />
                <h4 className="text-lg font-bold text-slate-950 dark:text-white uppercase mb-2">Neural Security</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6">Your subscription includes enterprise-grade neural isolation and end-to-end sandbox shielding.</p>
                <div className="space-y-3">
                  {["SOC2 Type II", "Neural Sandboxing", "IP Protection"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider leading-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[2rem] border border-black/10 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-6" />
                <h4 className="text-lg font-bold text-slate-950 dark:text-white uppercase mb-2">Resource Alert</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-6">Neural token usage has reached 84%. Consider scaling your workforce limits to avoid latency.</p>
                <button className="w-full py-4 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-white/10 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all shadow-md">Scale Resources</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-black/10 dark:border-white/5 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice ID</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">No invoices yet. Payments will appear here after your first subscription.</td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-black/5 dark:border-white/5">
                      <td className="px-8 py-4 text-xs font-mono text-slate-600 dark:text-slate-400">{tx.id.slice(0, 12)}...</td>
                      <td className="px-8 py-4 text-xs text-slate-600 dark:text-slate-400">{tx.date}</td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-900 dark:text-white">${tx.amount}</td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                          tx.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                        )}>{tx.status}</span>
                      </td>
                      <td className="px-8 py-4 text-right text-xs text-slate-500 dark:text-slate-400">{tx.plan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
