import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, LayoutDashboard, Settings, Crown, Briefcase, Folder } from "lucide-react";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";

export default function Navbar({ user }: { user: any }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:rotate-6 transition-transform">
            <span className="text-white font-bold text-xl leading-none">A</span>
          </div>
          <span className="font-semibold text-xl tracking-tight text-slate-900 dark:text-white italic">
            Aigent<span className="text-cyan-400">.ai</span>
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-6 text-sm">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <Link to="/dashboard" className="font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-white transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Operations</span>
            </Link>
            <Link to="/projects" className="font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-white transition-colors flex items-center gap-2">
              <Folder className="w-4 h-4" /> <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link to="/admin" className="font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-white transition-colors flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> <span className="hidden sm:inline">Admin</span>
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center hover:border-cyan-500/50 transition-all overflow-hidden"
              >
                {user.photoURL ? <img src={user.photoURL} alt="p" /> : <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-50 transition-colors duration-300"
                    >
                      <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{user.displayName || "Operator"}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate font-mono">{user.email}</p>
                      </div>
                      <div className="w-full border-t border-black/5 dark:border-white/5 my-1" />
                      <div className="md:hidden px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Theme Switcher</p>
                        <ThemeToggle />
                      </div>
                      <button 
                        onClick={() => alert("System Settings Hub: Accessing restricted neural parameters. [Coming Soon]")}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-left"
                      >
                        <Settings className="w-4 h-4" /> System Settings
                      </button>
                      <button 
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/billing");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-left"
                      >
                        <Briefcase className="w-4 h-4" /> Billing / Payouts
                      </button>
                      <div className="w-full border-t border-black/5 dark:border-white/5 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-left font-bold"
                      >
                        <LogOut className="w-4 h-4" /> Terminate Instance
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/auth" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-white transition-colors">Login</Link>
            <Link to="/auth" className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-md shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
