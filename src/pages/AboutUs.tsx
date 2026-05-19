import { motion } from "motion/react";
import { Rocket, Target, Users, Zap, Code, Shield } from "lucide-react";
import { cn } from "../lib/utils";
import Footer from "../components/layout/Footer";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-32 pb-20 px-6 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center gap-20 mb-40 text-slate-900 dark:text-white">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            <span className="text-[11px] font-bold tracking-wider text-purple-700 dark:text-purple-400 uppercase">Neural_Evolution</span>
          </div>
          <h1 className="text-6xl font-bold tracking-tight leading-[1.1] uppercase transition-colors">
            The Future of <span className="text-cyan-700 dark:text-cyan-400">Collaborative</span> <br />Neural Dev.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-tight opacity-90 transition-colors">
            Aigent.ai is not just an IDE. It's a decentralized neural workforce designed to orchestrate the next generation of software architecture.
          </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 relative"
          >
            <div className="aspect-square rounded-[5rem] bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-black/5 dark:border-white/5 flex items-center justify-center p-12">
              <div className="w-full h-full rounded-[4rem] bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 shadow-3xl flex items-center justify-center relative overflow-hidden group">
                <Code className="w-32 h-32 text-black/5 dark:text-white/10 group-hover:text-cyan-500/20 transition-all duration-700 -rotate-12" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent" />
              </div>
            </div>
            {/* Floating Stats */}
            <div className="absolute -bottom-8 -left-8 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 shadow-xl transition-colors">
              <p className="text-4xl font-bold text-slate-950 dark:text-white">14.2M</p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-2 px-1 transition-colors">Tokens_Processed</p>
            </div>
          </motion.div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40 font-black">
          {[
            { icon: Target, title: "Our Mission", desc: "To democratize high-stakes software engineering by providing every developer with a personal AI dev team.", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/5" },
            { icon: Users, title: "Universal Sync", desc: "Bridging the gap between human intuition and neural computation through a unified workspace.", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/5" },
            { icon: Shield, title: "Safety First", desc: "Ensuring every line of neural-generated code passes enterprise-grade compliance and security audits.", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn("p-12 rounded-[3.5rem] bg-white dark:bg-white/[0.01] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all group", item.bg)}
            >
              <item.icon className={cn("w-12 h-12 mb-8 group-hover:scale-110 transition-transform", item.color)} />
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white mb-4 uppercase tracking-tight">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed uppercase tracking-tight opacity-80 transition-colors">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* The Team (Neural Agents) */}
        <div className="text-center space-y-20">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-slate-950 dark:text-white uppercase tracking-tight leading-none transition-colors">The Neural Collective</h2>
            <p className="text-slate-600 dark:text-slate-500 font-bold uppercase tracking-widest text-xs opacity-70 transition-colors">Our team is a hybrid of human insight and architectural neural agents operating at thought-speed.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
            {["Core_Architect", "Neural_Ops", "Security_Lead", "Logic_Analyst"].map((name, i) => (
              <div key={i} className="p-10 rounded-[3rem] bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-6 group hover:border-cyan-500/30 transition-all">
                <div className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 mx-auto flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-black/5 dark:border-white/5">
                  <Zap className="w-6 h-6 text-slate-300 dark:text-white/20 group-hover:text-cyan-500 transition-colors" />
                </div>
                <p className="text-[11px] font-bold text-slate-950 dark:text-white uppercase tracking-widest">{name}</p>
                <div className="px-4 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-bold rounded-full inline-block uppercase tracking-widest border border-blue-500/10">Active_Session</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
