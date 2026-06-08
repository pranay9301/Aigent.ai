import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Navbar from "./components/layout/Navbar";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { ThemeProvider } from "./lib/ThemeContext";

const Workspace = lazy(() => import("./pages/Workspace"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Billing = lazy(() => import("./pages/Billing"));
const Projects = lazy(() => import("./pages/Projects"));
const AIProjectWizard = lazy(() => import("./pages/AIProjectWizard"));
const Company = lazy(() => import("./pages/Company"));
const OrchestratorPage = lazy(() => import("./pages/OrchestratorPage"));

function RouteLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="text-blue-500 font-mono tracking-widest uppercase italic font-black">
        LOADING...
      </div>
    </div>
  );
}

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
          setUserRole(snap.exists() ? snap.data().role || "user" : "user");
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
          <Suspense fallback={<RouteLoader />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/workspace/:projectId" element={user ? <Workspace /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user && userRole === "admin" ? <AdminPanel /> : <Navigate to="/dashboard" />} />
          <Route path="/billing" element={user ? <Billing /> : <Navigate to="/auth" />} />
          <Route path="/company" element={user ? <Company /> : <Navigate to="/auth" />} />
          <Route path="/projects" element={user ? <Projects /> : <Navigate to="/auth" />} />
          <Route path="/wizard" element={<AIProjectWizard />} />
          <Route path="/orchestrator" element={<OrchestratorPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refunds" element={<RefundPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
        </Suspense>
      </div>
    </Router>
  </ThemeProvider>
  </ErrorBoundary>
);
}
