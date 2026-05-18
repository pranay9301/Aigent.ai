import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";
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
import Navbar from "./components/layout/Navbar";
import { ThemeProvider } from "./lib/ThemeContext";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 selection:bg-blue-500/30">
          <Navbar user={user} />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/workspace/:projectId" element={user ? <Workspace /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/auth" />} />
          <Route path="/billing" element={user ? <Billing /> : <Navigate to="/auth" />} />
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
);
}
