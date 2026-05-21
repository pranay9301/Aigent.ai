import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import Billing from "./pages/Billing";
import Projects from "./pages/Projects";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Company from "./pages/Company";
import Navbar from "./components/layout/Navbar";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ThemeProvider } from "./lib/ThemeContext";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setUserRole(snap.data().role || "user");
          }
        } catch {
          setUserRole("user");
        }
      } else {
        setUserRole("user");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-xl text-blue-500 font-mono tracking-widest uppercase italic font-black">INITIALIZING AIGENT CORE...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 selection:bg-blue-500/30">
          <Navbar user={user} userRole={userRole} />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/workspace/:projectId" element={user ? <Workspace /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user && userRole === "admin" ? <AdminPanel /> : <Navigate to="/dashboard" />} />
          <Route path="/billing" element={user ? <Billing /> : <Navigate to="/auth" />} />
          <Route path="/company" element={user ? <Company /> : <Navigate to="/auth" />} />
          <Route path="/projects" element={user ? <Projects /> : <Navigate to="/auth" />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refunds" element={<RefundPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </div>
    </Router>
  </ThemeProvider>
  </ErrorBoundary>
);
}
