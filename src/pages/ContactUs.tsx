import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle } from "lucide-react";
import Footer from "../components/layout/Footer";

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError("Failed to transmit signal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <MessageSquare className="w-6 h-6 text-cyan-700 dark:text-cyan-400" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-cyan-700 dark:text-cyan-400 uppercase">Comm_Link</span>
          </div>
          <h1 className="text-6xl font-bold text-slate-950 dark:text-white mb-8 uppercase tracking-tight transition-colors">Contact Us</h1>
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px] max-w-2xl mx-auto opacity-70 leading-relaxed px-1 font-mono transition-colors">Connect with the Aigent.ai core team for high-throughput support, technical audits, or enterprise synchronization protocols.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="p-10 rounded-[3rem] bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-10 group hover:border-cyan-500/20 transition-all">
              <div className="flex gap-8 group">
                <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">Neural Mail</p>
                  <p className="text-xl font-bold text-slate-950 dark:text-white uppercase tracking-tight font-mono transition-colors">support@aigent.ai</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 rounded-[2rem] bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">Voice Uplink</p>
                  <p className="text-xl font-bold text-slate-950 dark:text-white uppercase tracking-tight font-mono transition-colors">+1 (888) AIGENT-IO</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors">Physical Node</p>
                  <p className="text-xl font-bold text-slate-950 dark:text-white uppercase tracking-tight font-mono px-1 transition-colors">742 Neural Way, Silicon Valley, CA 94025</p>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between shadow-sm transition-colors">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider transition-colors">Response_Time_SLA</p>
                <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight transition-colors">Neural Sync: &lt; 2 Hours</span>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-12 rounded-[3.5rem] bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <Send className="w-48 h-48 text-cyan-600 dark:text-cyan-400 -rotate-12" />
            </div>
            
            {submitted ? (
              <div className="relative z-10 text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-950 dark:text-white uppercase mb-2">Signal Transmitted</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Our neural network has received your message. Expect a response within 2 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 px-8 py-3 bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold rounded-xl uppercase tracking-widest">Send Another</button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operator Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-bold uppercase text-slate-950 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="John Matrix" />
                </div>
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Auth Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-bold uppercase text-slate-950 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="operator@neural.net" />
                </div>
              </div>
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Subject Protocol</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-bold uppercase text-slate-950 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="Neural Tier Upgrade Inquiry" />
              </div>
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Message Payload</label>
                <textarea rows={5} required value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-bold uppercase text-slate-950 dark:text-white focus:border-cyan-500 outline-none transition-all resize-none shadow-sm font-mono" placeholder="Describe your neural synchronization requirement..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-950 dark:bg-cyan-500 hover:bg-slate-900 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-cyan-500/10 active:scale-95 disabled:opacity-50">
                {isSubmitting ? "Transmitting..." : "Transmit Signal"}
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
