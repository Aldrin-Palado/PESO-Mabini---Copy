import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Employers from "./pages/Employers";
import Home from "./pages/Home";
import JobVacancies from "./pages/JobVacancies";
import AIChatbotModule from "./jobseekersmodules/AIChatbotModule";
import ForgotPassword from "./components/ForgotPassword";
import JobSeekerRegistration from "./components/JobSeekerRegistration";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import SessionTimeout from "./components/SessionTimeout";
import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./components/OAuthCallback";
import AdminDashboard from "./dashboards/AdminDashboard";
import EmployerDashboard from "./dashboards/EmployerDashboard";
import JobSeekerDashboard from "./dashboards/JobSeekerDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";

const publicPagePaths = new Set(["/", "/about", "/jobs", "/employers", "/contact"]);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PublicAIChatbot() {
  const { pathname } = useLocation();

  return publicPagePaths.has(pathname) ? <AIChatbotModule floating /> : null;
}

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/jobs" element={<JobVacancies />} />
        <Route path="/employers" element={<Employers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<JobSeekerRegistration />} />
        <Route
          path="/jobseekerregistration"
          element={<JobSeekerRegistration />}
        />
        <Route
          path="/superadmin"
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/staff"
          element={<ProtectedRoute><StaffDashboard /></ProtectedRoute>}
        />
        <Route
          path="/employer"
          element={<ProtectedRoute><EmployerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/jobseeker"
          element={<ProtectedRoute><JobSeekerDashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Home />} />
      </Routes>
      <PublicAIChatbot />
    </BrowserRouter>
  );
}

export default App;