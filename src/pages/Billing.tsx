import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  CreditCard, Shield, Zap, BarChart3, 
  ArrowUpRight, Clock, CheckCircle2, 
  AlertCircle, Download, ExternalLink,
  CreditCard as RazorpayIcon
} from "lucide-react";
import { cn } from "../lib/utils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function Billing() {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [isProcessing, setIsProcessing] = useState(false);

  const paypalClientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;
  const razorpayKeyId = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  const isPaypalConfigured = !!paypalClientId && paypalClientId !== "";
  const isRazorpayConfigured = !!razorpayKeyId && razorpayKeyId !== "";

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const paypalOptions = {
    clientId: paypalClientId || "sb",
    currency: "USD",
    intent: "capture",
  };

  const handlePaymentError = (err: any) => {
    console.error("Neural Payment Error:", err);
    alert("TRANSACTION_FAILED: The neural payment gateway is currently in restricted mode. Please ensure your API keys are configured in the System Settings Hub.");
  };

  const handleRazorpayPayment = async (amount: string, planName: string) => {
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
        amount: order.amount,
        currency: order.currency,
        name: "Aigent.ai",
        description: `${planName} Subscription`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.status === "ok") {
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

  const usageStats = [
    { label: "Neural Tokens", value: "842k", limit: "1M", percent: 84.2, color: "text-cyan-400" },
    { label: "Agent Hours", value: "128h", limit: "500h", percent: 25.6, color: "text-blue-400" },
    { label: "Deployments", value: "12", limit: "Unlimited", percent: 0, color: "text-purple-400" },
  ];

  const invoices = [
    { id: "INV-2026-004", date: "May 01, 2026", amount: "$99.00", status: "Paid" },
    { id: "INV-2026-003", date: "Apr 01, 2026", amount: "$99.00", status: "Paid" },
    { id: "INV-2026-002", date: "Mar 01, 2026", amount: "$99.00", status: "Paid" },
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
            <h1 className="text-3xl font-black italic mb-2 tracking-tight text-white uppercase">SUBSCRIPTION HUB</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed font-mono">Manage your neural workforce assets and billing.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Tier: Enterprise</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-8">
          <button 
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              activeTab === "overview" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
            )}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              activeTab === "history" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
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
                      <h2 className="text-2xl font-black italic text-white uppercase mb-1">Aigent Enterprise</h2>
                      <p className="text-slate-400 text-xs font-mono">Billed annually • Next renewal: May 01, 2027</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white italic">$299<span className="text-sm font-normal text-slate-500 tracking-normal">/mo</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {usageStats.map((stat, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                          <span className={cn("font-mono text-xs font-bold", stat.color)}>{stat.value}</span>
                        </div>
                        {stat.percent > 0 && (
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all duration-1000", stat.color.replace('text', 'bg'))} 
                              style={{ width: `${stat.percent}%` }} 
                            />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-600 mt-1 block uppercase tracking-tighter">Limit: {stat.limit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black italic text-white uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-cyan-400" /> Neural Payment Gateway
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {(!isPaypalConfigured && !isRazorpayConfigured) && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mb-6">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Configuration Required</p>
                        <p className="text-[10px] text-slate-400 italic">The Payment Systems are currently in restricted mode. To enable real neural transactions, you must provide valid API keys in the System Settings Hub.</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500 italic mb-4">Aigent.ai uses PayPal & Razorpay for decentralized neural workforce transactions. Select your upgrade tier below.</p>
                  
                  <div className="space-y-4">
                    {/* Scale Tier Button */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-1">Upgrade to SCALE Tier</span>
                          <span className="text-[8px] text-slate-500 uppercase font-mono tracking-tighter">Recommended for solo founders</span>
                        </div>
                        <span className="text-xs font-black text-cyan-400 italic">$69.00/mo</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block px-1">Global Gateway</label>
                          <PayPalScriptProvider options={paypalOptions}>
                            <PayPalButtons 
                              style={{ layout: "horizontal", height: 35, color: "blue", shape: "rect", label: "pay" }}
                              createOrder={async () => {
                                if (!isPaypalConfigured) {
                                  handlePaymentError("NOT_CONFIGURED");
                                  throw new Error("NOT_CONFIGURED");
                                }
                                try {
                                  const res = await fetch("/api/paypal/create-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ amount: "69.00", planName: "Scale" })
                                  });
                                  if (!res.ok) throw new Error("API_ERROR");
                                  const data = await res.json();
                                  if (!data.id) throw new Error("INVALID_ORDER_ID");
                                  return data.id;
                                } catch (err) {
                                  handlePaymentError(err);
                                  throw err;
                                }
                              }}
                              onApprove={async (data) => {
                                setIsProcessing(true);
                                try {
                                  const res = await fetch("/api/paypal/capture-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ orderId: data.orderID })
                                  });
                                  const capture = await res.json();
                                  if (capture.status === "COMPLETED") {
                                    alert("Neural Tier Upgraded: SCALE session initialized.");
                                  } else {
                                    throw new Error("CAPTURE_FAILED");
                                  }
                                } catch (err) {
                                  handlePaymentError(err);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              onError={handlePaymentError}
                            />
                          </PayPalScriptProvider>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block px-1">Alternative Node</label>
                          <button 
                            onClick={() => handleRazorpayPayment("69.00", "Scale")}
                            disabled={isProcessing}
                            className="w-full h-[35px] bg-[#3395ff] hover:bg-[#2087f1] text-white flex items-center justify-center gap-2 rounded-lg transition-all group overflow-hidden relative"
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest z-10">Pay with Razorpay</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Enterprise Tier Button */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-1">Upgrade to ENTERPRISE Tier</span>
                          <span className="text-[8px] text-slate-500 uppercase font-mono tracking-tighter">Full workforce integration</span>
                        </div>
                        <span className="text-xs font-black text-purple-400 italic">$299.00/mo</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block px-1">Global Gateway</label>
                          <PayPalScriptProvider options={paypalOptions}>
                            <PayPalButtons 
                              style={{ layout: "horizontal", height: 35, color: "silver", shape: "rect", label: "pay" }}
                              createOrder={async () => {
                                if (!isPaypalConfigured) {
                                  handlePaymentError("NOT_CONFIGURED");
                                  throw new Error("NOT_CONFIGURED");
                                }
                                try {
                                  const res = await fetch("/api/paypal/create-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ amount: "299.00", planName: "Enterprise" })
                                  });
                                  if (!res.ok) throw new Error("API_ERROR");
                                  const data = await res.json();
                                  if (!data.id) throw new Error("INVALID_ORDER_ID");
                                  return data.id;
                                } catch (err) {
                                  handlePaymentError(err);
                                  throw err;
                                }
                              }}
                              onApprove={async (data) => {
                                setIsProcessing(true);
                                try {
                                  const res = await fetch("/api/paypal/capture-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ orderId: data.orderID })
                                  });
                                  const capture = await res.json();
                                  if (capture.status === "COMPLETED") {
                                    alert("Neural Tier Upgraded: ENTERPRISE session initialized.");
                                  } else {
                                    throw new Error("CAPTURE_FAILED");
                                  }
                                } catch (err) {
                                  handlePaymentError(err);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              onError={handlePaymentError}
                            />
                          </PayPalScriptProvider>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block px-1">Alternative Node</label>
                          <button 
                            onClick={() => handleRazorpayPayment("299.00", "Enterprise")}
                            disabled={isProcessing}
                            className="w-full h-[35px] bg-[#3395ff] hover:bg-[#2087f1] text-white flex items-center justify-center gap-2 rounded-lg transition-all group overflow-hidden relative"
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest z-10">Pay with Razorpay</span>
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
              <div className="p-8 rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5">
                <Shield className="w-8 h-8 text-cyan-400 mb-6" />
                <h4 className="text-lg font-black italic text-white uppercase mb-2">Neural Security</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 italic">Your subscription includes enterprise-grade neural isolation and end-to-end sandbox shielding.</p>
                <div className="space-y-3">
                  {["SOC2 Type II", "Neural Sandboxing", "IP Protection"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" /> {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02]">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-6" />
                <h4 className="text-lg font-black italic text-white uppercase mb-2">Resource Alert</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 italic">Neural token usage has reached 84%. Consider scaling your workforce limits to avoid latency.</p>
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all">Scale Resources</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Invoice ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6 font-mono text-xs font-bold text-slate-300">{inv.id}</td>
                    <td className="px-8 py-6 text-sm font-medium text-slate-400">{inv.date}</td>
                    <td className="px-8 py-6 text-sm font-black text-white italic">{inv.amount}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
