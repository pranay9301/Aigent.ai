import { motion } from "motion/react";
import { Truck, Zap, Globe, Package } from "lucide-react";
import Footer from "../components/layout/Footer";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Truck className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider transition-colors">Fulfillment_Protocol</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-950 dark:text-white mb-4 uppercase tracking-tight transition-colors">Shipping & Delivery</h1>
          <p className="text-slate-500 dark:text-slate-500 font-bold uppercase text-[11px] tracking-wider transition-colors">Last Updated: May 18, 2026</p>
        </motion.div>

        <div className="space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-medium transition-colors">
          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-indigo-600 dark:text-indigo-400">01.</span> Digital Fulfillment
            </h2>
            <p className="opacity-90">
              Aigent.ai provides purely digital SaaS products. There are no physical goods shipped for any transactions made on this platform. Access to our neural workforce and premium features is provisioned automatically and instantaneously upon successful payment confirmation.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-indigo-600 dark:text-indigo-400">02.</span> Delivery Timeline
            </h2>
            <p className="opacity-90">
              Once your payment via PayPal or Razorpay is verified, your account tier will be updated in real-time. You will receive an email confirmation containing your transaction details and a link to your activated neural workspace within minutes of the transaction.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-indigo-600 dark:text-indigo-400">03.</span> Access Verification
            </h2>
            <p className="opacity-90">
              If your access has not been updated within 30 minutes of payment, please check your dashboard or refresh your browser session. In rare cases of neural desync, please contact our support team at support@aigent.ai with your transaction ID.
            </p>
          </section>

          <section className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 transition-colors shadow-sm">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-indigo-600 dark:text-indigo-400">04.</span> Global Availability
            </h2>
            <p className="opacity-90">
              Our digital services are available globally, subject to local regulations and cloud infrastructure availability. We do not have geographical "shipping" restrictions as long as your region supports the use of our payment gateways.
            </p>
          </section>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/30 border border-black/5 dark:border-slate-800 text-center shadow-sm transition-colors"
        >
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4 transition-colors">Delivery issues?</p>
          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider transition-colors">operations@aigent.ai</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
