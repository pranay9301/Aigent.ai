import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="pt-32 pb-16 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-2">
            <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 block uppercase group transition-colors">
              <span className="text-cyan-700 dark:text-cyan-500">Aigent</span>.ai
              <div className="h-0.5 w-0 group-hover:w-20 bg-cyan-500 transition-all duration-500" />
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-tight leading-relaxed max-w-sm opacity-80 transition-colors">
              Architecting the decentralized future of software development through parallel neural coordination and high-throughput agent clusters.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-[0.3em] mb-10 px-1 border-l-2 border-cyan-500 transition-colors">Neural_Nodes</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">About Us</Link></li>
              <li><Link to="/contact" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Contact Us</Link></li>
              <li><Link to="/auth" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Join Collective</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-[0.3em] mb-10 px-1 border-l-2 border-cyan-500 transition-colors">Governance</h4>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Privacy Policy</Link></li>
              <li><Link to="/refunds" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Refund Policy</Link></li>
              <li><Link to="/shipping" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-bold uppercase tracking-widest block">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-16 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-700 uppercase tracking-widest font-mono transition-colors">
            © 2026 AIGENT.AI // THE NEURAL OPERATING SYSTEM // ALL RIGHTS RESERVED
          </p>
          <div className="flex flex-wrap justify-center gap-10 opacity-30 dark:opacity-40 grayscale group-hover:grayscale-0 transition-all">
            <span className="text-[8px] font-bold text-slate-900 dark:text-white uppercase tracking-widest font-mono">SYNC_STABILITY: 99.99%</span>
            <span className="text-[8px] font-bold text-slate-900 dark:text-white uppercase tracking-widest font-mono">VERSION: v4.2.0-STABLE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
