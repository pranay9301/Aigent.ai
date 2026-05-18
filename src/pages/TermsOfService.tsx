import { motion } from "motion/react";
import { Shield, FileText, Globe, Clock } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase italic">Legal_Framework</span>
          </div>
          <h1 className="text-4xl font-black italic text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Terms of Service</h1>
          <p className="text-slate-400 dark:text-slate-500 font-black italic uppercase text-[10px] tracking-widest">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-bold uppercase text-xs tracking-tight shadow-sm">
          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-blue-500 dark:text-blue-400">01.</span> Acceptance of Terms
            </h2>
            <p className="opacity-80 font-mono">
              By accessing and using Aigent.ai ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our services. Our services are designed for businesses and individuals seeking AI-powered development coordination.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-blue-500 dark:text-blue-400">02.</span> Neural Workforce Usage
            </h2>
            <p className="opacity-80 font-mono">
              Aigent.ai provides access to automated neural agents. While we strive for absolute accuracy, the output of these agents is provided "as is". Users are responsible for reviewing and validating all code and logic generated through the platform before deployment in production environments.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-blue-500 dark:text-blue-400">03.</span> User Accountability & Security
            </h2>
            <p className="opacity-80 font-mono">
              You are responsible for maintaining the confidentiality of your credentials. Any high-stakes actions executed by agents under your authorization (including but not limited to deployments, resource allocation, and external API integrations) are your sole responsibility.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-blue-500 dark:text-blue-400">04.</span> Intellectual Property
            </h2>
            <p className="opacity-80 font-mono">
              All code generated for your specific projects belongs to you. However, the underlying neural architectures, platform UI, and proprietary algorithms used by Aigent.ai remain the exclusive property of Aigent.ai.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-blue-500 dark:text-blue-400">05.</span> Termination of Service
            </h2>
            <p className="opacity-80 font-mono">
              We reserve the right to suspend or terminate access to the Platform for any user who violates these terms, engages in malicious activity, or attempts to reverse-engineer our proprietary neural models.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center shadow-sm"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Questions regarding these terms?</p>
          <p className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">legal@aigent.ai</p>
        </motion.div>
      </div>
    </div>
  );
}
