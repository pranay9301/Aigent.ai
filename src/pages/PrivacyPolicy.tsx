import { motion } from "motion/react";
import { Eye, ShieldCheck, Lock, Database } from "lucide-react";
import Footer from "../components/layout/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Eye className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Data_Sovereignty</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-950 dark:text-white mb-4 uppercase tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-500 font-bold uppercase text-[11px] tracking-wider">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-medium transition-colors">
          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">01.</span> Data Collection Prototypes
            </h2>
            <p className="opacity-90">
              We collect minimal data necessary to facilitate neural coordination. This includes your name, email, and authentication metadata. Project data (code, architecture diagrams) is treated with total isolation and is never used to train global models without explicit consent.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">02.</span> Encryption & Storage
            </h2>
            <p className="opacity-90">
              Aigent.ai utilizes AES-256 encryption at rest and TLS 1.3 in transit. Your neural session data is stored in partitioned vaults to prevent cross-leakage between workspaces.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">03.</span> Third-Party Integrations
            </h2>
            <p className="opacity-90">
              When you connect PayPal or Razorpay, we do not store your full payment credentials. We only retain transaction IDs and status markers to manage your neural subscriptions. Interaction with Google Gemini API is governed by their respective privacy standard.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">04.</span> Cookie Intelligence
            </h2>
            <p className="opacity-90">
              We use "Session Cookies" solely for maintaining your auth state. We do not use third-party tracking pixels or behavioral advertising cookies. Your workflow history remains private.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400">05.</span> Your Rights
            </h2>
            <p className="opacity-90">
              Under GDPR and CCPA, you have the right to request a full neural wipe of your data. You can initiate a data export or deletion request at any time through the workspace settings.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 text-center shadow-sm transition-colors"
        >
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Request a data audit?</p>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">privacy@aigent.ai</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
