import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Rocket, Shield, Zap, Code, Sparkles, Cpu, Globe, Users, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../lib/ThemeContext";

export default function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className="relative overflow-hidden pt-20 transition-colors duration-500">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-white dark:bg-slate-950 transition-colors duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-[10px] font-black mb-10 uppercase tracking-[0.2em] animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous AI Workforce is Online
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 text-slate-900 dark:text-white leading-[0.9] tracking-tighter italic uppercase">
            The AI <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400">Company</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-black uppercase tracking-tight opacity-90">
            Stop building. Start orchestrating. The world's first autonomous AI workforce that designs, develops, and deploys your entire neural company in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black rounded-2xl shadow-2xl shadow-cyan-500/20 transition-all hover:scale-105 flex items-center justify-center gap-3 uppercase text-sm tracking-widest">
              Launch Your Company <Rocket className="w-5 h-5" />
            </Link>
            <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md uppercase text-sm tracking-widest">
              Explore Templates <Globe className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Agents Section */}
      <section className="container mx-auto px-6 py-32 border-t border-black/5 dark:border-white/10 transition-colors">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white uppercase italic tracking-tighter">Your Neural Workforce</h2>
          <p className="text-slate-400 dark:text-slate-500 max-w-lg mx-auto uppercase text-[10px] font-black tracking-[0.3em] leading-relaxed">Interconnected AI Agents designed for extreme precision and autonomous throughput.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Developer", icon: Code, desc: "Writes production-ready backend, frontend, & neural APIs", status: "OPS_ACTIVE", color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/5", border: "border-cyan-500/10 dark:border-cyan-400/20" },
            { name: "Designer", icon: Zap, desc: "Crafts hyper-fluid UI/UX & Glassmorphism systems", status: "IDLE", color: "text-slate-900 dark:text-slate-400", bg: "bg-slate-900/5 dark:bg-slate-400/5", border: "border-slate-900/10 dark:border-slate-400/20" },
            { name: "Sales agent", icon: Users, desc: "Automated cold outreach & hyper-targeted lead gen", status: "CONVERTING", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/10 dark:border-blue-400/20" },
            { name: "Researcher", icon: Globe, desc: "Deep market intel & strategic sourcing metrics", status: "FETCHING", color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/10 dark:border-purple-400/20" },
            { name: "PM agent", icon: Rocket, desc: "Plans tasks and coordinates complex neural nodes", status: "SYNCING", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/10 dark:border-amber-400/20" },
            { name: "SRE agent", icon: Cpu, desc: "Automates CI/CD and atomic neural deployment", status: "OPTIMIZING", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10 dark:border-emerald-400/20" },
            { name: "Compliance", icon: Shield, desc: "GDPR, SOC2, & Enterprise infrastructure safety", status: "SECURE", color: "text-red-500 dark:text-red-400", bg: "bg-red-500/5", border: "border-red-500/10 dark:border-red-400/20" },
            { name: "Analyst", icon: BarChart3, desc: "KPI tracking & deep neural growth optimizations", status: "AUDITING", color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-500/10 dark:border-indigo-400/20" },
          ].map((agent, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-8 rounded-[2rem] border transition-all group relative overflow-hidden bg-white dark:bg-white/[0.02]", agent.bg, agent.border)}
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", agent.status !== "IDLE" ? "animate-pulse shadow-lg" : "", agent.color.replace('text', 'bg'))} />
                <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500">{agent.status}</span>
              </div>
              <agent.icon className={cn("w-12 h-12 mb-8 group-hover:scale-110 transition-transform", agent.color)} />
              <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white italic uppercase tracking-tight">{agent.name}</h3>
              <p className="text-slate-500 dark:text-slate-500 text-xs leading-relaxed font-black uppercase tracking-tighter opacity-80">{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-6 py-32">
        <div className="bg-slate-900 dark:bg-white/[0.02] rounded-[3.5rem] p-8 md:p-20 border border-white/5 dark:border-white/10 shadow-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-cyan-500 dark:text-cyan-400 font-mono text-[10px] uppercase mb-6 block tracking-[0.4em] font-black px-1">SYSTEM_CAPABILITIES</span>
              <h2 className="text-5xl md:text-6xl font-black mb-10 leading-[1.1] text-white dark:text-white italic uppercase tracking-tighter">Prompt-to-Scale <br />Architecture.</h2>
              <div className="space-y-8">
                {[
                  { title: "Direct Neural Access", desc: "Edit your generated company's code in our Monaco-powered IDE.", icon: Code },
                  { title: "Zero Latency Preview", desc: "See your app come to life instantly as the AI Developer types.", icon: Zap },
                  { title: "Global Neural Mesh", desc: "Deploy to Cloud Run, Vercel, or AWS with one click from AI DevOps.", icon: Globe },
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="mt-1 p-3 bg-white/5 dark:bg-cyan-500/10 rounded-2xl text-white dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all border border-white/5 shadow-xl"><f.icon className="w-6 h-6" /></div>
                    <div>
                      <h4 className="font-black text-xl mb-2 text-white uppercase tracking-tight italic">{f.title}</h4>
                      <p className="text-sm text-slate-400 italic font-black uppercase tracking-tight opacity-70 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square md:aspect-video rounded-[3rem] bg-slate-950 border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.1)]">
              <div className="absolute inset-0 flex items-center justify-center p-8 md:p-16">
                 <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border border-white/10 relative transition-colors duration-500">
                   <div className="h-10 bg-slate-100 dark:bg-slate-950/50 border-b border-black/5 dark:border-white/5 flex items-center px-6 gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400/30" />
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30" />
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/30" />
                   </div>
                   <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-cyan-600 rounded-3xl mb-6 flex items-center justify-center text-white font-black text-3xl shadow-xl italic tracking-tighter">A</div>
                      <div className="h-6 w-40 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse mb-3" />
                      <div className="h-3 w-64 bg-slate-50 dark:bg-slate-800/50 rounded-full animate-pulse" />
                   </div>
                 </div>
              </div>
              {/* Mock Floating Metrics */}
              <div className="absolute bottom-8 right-8 p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl space-y-2 hidden md:block">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">DEPLOY_OK: node_v4</span>
                 </div>
                 <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest text-right">999.9ms LATENCY</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-32 border-t border-black/5 dark:border-white/10">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Neural Subscription Tiers</h2>
          <p className="text-slate-400 dark:text-slate-500 max-w-lg mx-auto uppercase text-[10px] font-black tracking-[0.3em] leading-relaxed">Select the cognitive throughput that aligns with your architectural complexity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[
            { 
              name: "Scale", 
              price: "69", 
              desc: "Neural core for ambitious founders. Orchestrate small-scale neural nodes with high precision.",
              features: ["1M Neural Tokens", "500 Agent Hours", "2 Concurrent Agents", "Community Support", "Standard CI/CD"],
              color: "text-cyan-500",
              border: "border-cyan-500/10"
            },
            { 
              name: "Enterprise", 
              price: "299", 
              desc: "Unlimited neural workforce orchestration. Enterprise-grade throughput and security isolation.",
              features: ["Unlimited Tokens", "Unlimited Agent Hours", "Infinite Agent Clustering", "24/7 Neural Link Support", "Advanced SOC2 Compliance"],
              color: "text-purple-500",
              border: "border-purple-500/10",
              popular: true
            }
          ].map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "p-12 rounded-[3.5rem] border bg-white dark:bg-white/[0.01] relative overflow-hidden transition-all hover:scale-[1.02]",
                plan.border,
                plan.popular ? "ring-2 ring-purple-500/20" : ""
              )}
            >
              {plan.popular && (
                <div className="absolute top-10 right-[-35px] bg-purple-500 text-slate-950 text-[8px] font-black uppercase py-1.5 px-12 rotate-45 tracking-widest">
                  MOST_ADOPTED
                </div>
              )}
              <h3 className={cn("text-2xl font-black italic uppercase tracking-tight mb-4", plan.color)}>{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black text-slate-900 dark:text-white">$</span>
                <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">{plan.price}</span>
                <span className="text-slate-400 dark:text-slate-600 font-mono text-xs uppercase font-black">/mo</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-10 font-black uppercase tracking-tight opacity-80">{plan.desc}</p>
              
              <ul className="space-y-4 mb-12">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                    <Sparkles className={cn("w-3.5 h-3.5", plan.color)} /> {f}
                  </li>
                ))}
              </ul>

              <Link to="/auth" className={cn(
                "w-full py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] italic transition-all flex items-center justify-center gap-3",
                plan.popular ? "bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-400 text-white" : "bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950"
              )}>
                Initialize {plan.name} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-40 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 blur-[150px] rounded-full" />
        </div>
        <h2 className="text-5xl md:text-7xl font-black mb-12 italic text-slate-900 dark:text-white leading-[1] uppercase tracking-tighter">Ready to fire your boss <br />& hire Aigent?</h2>
        <Link to="/auth" className="px-14 py-7 bg-slate-900 dark:bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-black text-2xl rounded-3xl shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105 inline-block uppercase tracking-[0.2em] italic">
          INITIALIZE_AIGENT
        </Link>
      </section>

      {/* Footer */}
      <footer className="pt-32 pb-16 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-500">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2">
              <Link to="/" className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white mb-8 block uppercase group">
                <span className="text-cyan-600 dark:text-cyan-500">Aigent</span>.ai
                <div className="h-1 w-0 group-hover:w-20 bg-cyan-500 transition-all duration-500" />
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-sm italic font-black uppercase tracking-tight leading-relaxed max-w-sm opacity-80">
                Architecting the decentralized future of software development through parallel neural coordination and high-throughput agent clusters.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.4em] mb-10 px-1 border-l-2 border-cyan-500">Neural_Nodes</h4>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">About Us</Link></li>
                <li><Link to="/contact" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">Contact Us</Link></li>
                <li><Link to="/auth" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">Join Collective</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-[0.4em] mb-10 px-1 border-l-2 border-cyan-500">Governance</h4>
              <ul className="space-y-4">
                <li><Link to="/terms" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">Privacy Policy</Link></li>
                <li><Link to="/refunds" className="text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors italic font-black uppercase tracking-widest block">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em] italic font-mono">
              © 2026 AIGENT.AI // THE NEURAL OPERATING SYSTEM // ALL RIGHTS RESERVED
            </p>
            <div className="flex flex-wrap justify-center gap-10 opacity-30 dark:opacity-40 grayscale group-hover:grayscale-0 transition-all">
              <span className="text-[8px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic font-mono">SYNC_STABILITY: 99.99%</span>
              <span className="text-[8px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic font-mono">VERSION: v4.2.0-STABLE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
