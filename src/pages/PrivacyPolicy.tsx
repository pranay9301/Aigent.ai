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
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase italic">Data_Sovereignty</span>
          </div>
          <h1 className="text-4xl font-black italic text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-400 dark:text-slate-500 font-black italic uppercase text-[10px] tracking-widest">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-bold uppercase text-xs tracking-tight">
          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400">01.</span> Data Collection Prototypes
            </h2>
            <p className="opacity-80 font-mono">
              We collect minimal data necessary to facilitate neural coordination. This includes your name, email, and authentication metadata. Project data (code, architecture diagrams) is treated with total isolation and is never used to train global models without explicit consent.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400">02.</span> Encryption & Storage
            </h2>
            <p className="opacity-80 font-mono">
              Aigent.ai utilizes AES-256 encryption at rest and TLS 1.3 in transit. Your neural session data is stored in partitioned vaults to prevent cross-leakage between workspaces.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400">03.</span> Third-Party Integrations
            </h2>
            <p className="opacity-80 font-mono">
              When you connect PayPal or Razorpay, we do not store your full payment credentials. We only retain transaction IDs and status markers to manage your neural subscriptions. Interaction with Google Gemini API is governed by their respective privacy standard.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400">04.</span> Cookie Intelligence
            </h2>
            <p className="opacity-80 font-mono">
              We use "Session Cookies" solely for maintaining your auth state. We do not use third-party tracking pixels or behavioral advertising cookies. Your workflow history remains private.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400">05.</span> Your Rights
            </h2>
            <p className="opacity-80 font-mono">
              Under GDPR and CCPA, you have the right to request a full neural wipe of your data. You can initiate a data export or deletion request at any time through the workspace settings.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Request a data audit?</p>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest italic">privacy@aigent.ai</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
