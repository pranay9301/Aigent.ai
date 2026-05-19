import { motion } from "motion/react";
import { Shield, FileText, Globe, Clock } from "lucide-react";
import Footer from "../components/layout/Footer";

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
              <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Legal_Framework</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-950 dark:text-white mb-4 uppercase tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 dark:text-slate-500 font-bold uppercase text-[11px] tracking-wider">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-medium transition-colors">
          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">01.</span> Acceptance of Terms
            </h2>
            <p className="opacity-90">
              By accessing and using Aigent.ai ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our services. Our services are designed for businesses and individuals seeking AI-powered development coordination.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">02.</span> Neural Workforce Usage
            </h2>
            <p className="opacity-90">
              Aigent.ai provides access to automated neural agents. While we strive for absolute accuracy, the output of these agents is provided "as is". Users are responsible for reviewing and validating all code and logic generated through the platform before deployment in production environments.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">03.</span> User Accountability & Security
            </h2>
            <p className="opacity-90">
              You are responsible for maintaining the confidentiality of your credentials. Any high-stakes actions executed by agents under your authorization (including but not limited to deployments, resource allocation, and external API integrations) are your sole responsibility.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">04.</span> Intellectual Property
            </h2>
            <p className="opacity-90">
              All code generated for your specific projects belongs to you. However, the underlying neural architectures, platform UI, and proprietary algorithms used by Aigent.ai remain the exclusive property of Aigent.ai.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400">05.</span> Termination of Service
            </h2>
            <p className="opacity-90">
              We reserve the right to suspend or terminate access to the Platform for any user who violates these terms, engages in malicious activity, or attempts to reverse-engineer our proprietary neural models.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 text-center shadow-sm transition-colors"
        >
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Questions regarding these terms?</p>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">legal@aigent.ai</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
