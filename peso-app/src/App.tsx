import { BrowserRouter, Route, Routes } from "react-router-dom";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Employers from "./pages/Employers";
import Home from "./pages/Home";
import JobVacancies from "./pages/JobVacancies";
import ForgotPassword from "./components/ForgotPassword";
import JobSeekerRegistration from "./components/JobSeekerRegistration";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import SessionTimeout from "./components/SessionTimeout";
import AdminDashboard from "./dashboards/AdminDashboard";
import EmployerDashboard from "./dashboards/EmployerDashboard";
import JobSeekerDashboard from "./dashboards/JobSeekerDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/jobs" element={<JobVacancies />} />
        <Route path="/employers" element={<Employers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<JobSeekerRegistration />} />
        <Route
          path="/jobseekerregistration"
          element={<JobSeekerRegistration />}
        />
        <Route path="/superadmin" element={<AdminDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
        <Route path="/jobseeker" element={<JobSeekerDashboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;