import { motion } from "motion/react";
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";

export default function ContactUs() {
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
              <MessageSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-[10px] font-black tracking-[0.4em] text-cyan-600 dark:text-cyan-400 uppercase italic">Comm_Link</span>
          </div>
          <h1 className="text-6xl font-black italic text-slate-900 dark:text-white mb-8 uppercase tracking-tighter">Contact Us</h1>
          <p className="text-slate-500 dark:text-slate-500 font-black italic uppercase tracking-widest text-xs max-w-2xl mx-auto opacity-70 leading-relaxed px-1 font-mono uppercase">Connect with the Aigent.ai core team for high-throughput support, technical audits, or enterprise synchronization protocols.</p>
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
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Neural Mail</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight font-mono">support@aigent.ai</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 rounded-[2rem] bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Voice Uplink</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight font-mono">+1 (888) AIGENT-IO</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Physical Node</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight font-mono px-1">742 Neural Way, Silicon Valley, CA 94025</p>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em] italic">Response_Time_SLA</p>
                <span className="text-sm font-black italic text-slate-700 dark:text-white uppercase tracking-tighter">Neural Sync: &lt; 2 Hours</span>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-12 rounded-[3.5rem] bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <Send className="w-48 h-48 text-cyan-600 dark:text-cyan-400 -rotate-12" />
            </div>
            
            <form className="relative z-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operator Name</label>
                  <input type="text" className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-black uppercase text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="John Matrix" />
                </div>
                <div className="space-y-3 px-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Auth Email</label>
                  <input type="email" className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-black uppercase text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="operator@neural.net" />
                </div>
              </div>
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Subject Protocol</label>
                <input type="text" className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-black uppercase text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all shadow-sm font-mono" placeholder="Neural Tier Upgrade Inquiry" />
              </div>
              <div className="space-y-3 px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Message Payload</label>
                <textarea rows={5} className="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-5 text-sm font-black uppercase text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-all resize-none shadow-sm font-mono" placeholder="Describe your neural synchronization requirement..." />
              </div>
              <button className="w-full py-5 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-black rounded-2xl uppercase tracking-[0.4em] transition-all shadow-2xl shadow-cyan-500/20 active:scale-95 italic">
                Transmit Signal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
