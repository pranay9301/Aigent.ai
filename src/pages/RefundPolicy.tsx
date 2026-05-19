import { motion } from "motion/react";
import { RefreshCcw, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import Footer from "../components/layout/Footer";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <RefreshCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase italic">Financial_Clarity</span>
          </div>
          <h1 className="text-4xl font-black italic text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Cancellation & Refund</h1>
          <p className="text-slate-400 dark:text-slate-500 font-black italic uppercase text-[10px] tracking-widest">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-bold uppercase text-xs tracking-tight">
          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-amber-500 dark:text-amber-400">01.</span> Subscription Cancellations
            </h2>
            <p className="opacity-80 font-mono">
              You may cancel your Aigent.ai subscription at any time. Upon cancellation, your access to premium neural tiers will remain active until the end of your current billing cycle. No further charges will be applied after the cancellation request is processed.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-amber-500 dark:text-amber-400">02.</span> Refund Eligibility
            </h2>
            <p className="opacity-80 font-mono">
              Since our services involve the consumption of immediate neural compute tokens, we generally do not offer refunds once a billing cycle has commenced. However, if you experience a technical failure preventing service usage for more than 48 consecutive hours, you may be eligible for a pro-rated credit or refund.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-amber-500 dark:text-amber-400">03.</span> Processing Timeline
            </h2>
            <p className="opacity-80 font-mono">
              Eligible refund requests are processed within 5-7 business days. The funds will be credited back to your original payment method (PayPal or Razorpay). Please note that it may take additional time for your bank to reflect the transaction.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white italic mb-4 flex items-center gap-3">
              <span className="text-amber-500 dark:text-amber-400">04.</span> Disputed Transactions
            </h2>
            <p className="opacity-80 font-mono">
              We encourage users to contact our support team before initiating a chargeback. Unauthorized billing disputes may result in a temporary suspension of your neural workspace to protect your data integrity.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-center"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Need assistance with billing?</p>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest italic">billing@aigent.ai</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
