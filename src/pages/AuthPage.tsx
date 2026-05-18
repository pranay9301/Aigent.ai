import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, githubProvider, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Github as GitHubIcon, Mail, Lock, User, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const syncUser = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Operator",
          role: "user",
          subscription: "free",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      let user;
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        user = res.user;
      }
      await syncUser(user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleProviderAuth = async (provider: any) => {
    try {
      const res = await signInWithPopup(auth, provider);
      await syncUser(res.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-6 animate-pulse-cyan">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black italic text-white tracking-tighter">AIGENT CORE</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            {isLogin ? "INITIALIZE OPERATOR SESSION" : "ENROLL NEW INTELLIGENCE"}
          </p>
        </div>

        {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase font-bold tracking-widest rounded-lg text-center">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="email" 
              placeholder="Operator Identity (Email)" 
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
            <input 
              type="password" 
              placeholder="Encryption Key" 
              className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/20 uppercase tracking-widest">
            {isLogin ? "BOOT SEQUENCE" : "GENERATE IDENTITY"}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-[#020617] px-4 text-slate-600 tracking-widest">Auth_Gateway</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleProviderAuth(googleProvider)} className="py-3 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors text-xs font-bold text-slate-300">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> 
            Google
          </button>
          <button onClick={() => handleProviderAuth(githubProvider)} className="py-3 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors text-xs font-bold text-slate-300">
            <GitHubIcon className="w-4 h-4" /> Github
          </button>
        </div>

        <p className="mt-10 text-center text-[10px] text-slate-600 font-bold tracking-widest uppercase">
          {isLogin ? "Missing access creds?" : "Intelligence already synced?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 font-black hover:underline cursor-pointer">
            {isLogin ? "PROVISION_HERE" : "INITIATE_LOGIN"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
