import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import JobVacancies from "./pages/JobVacancies";
import Employers from "./pages/Employers";
import Contact from "./pages/Contact";

import Login from "./components/Login";
import Register from "./components/Register";

import AdminDashboard from "./dashboards/AdminDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";
import EmployerDashboard from "./dashboards/EmployerDashboard";
import JobSeekerDashboard from "./dashboards/JobSeekerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/jobs" element={<JobVacancies />} />
        <Route path="/employers" element={<Employers />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route
          path="/superadmin"
          element={<AdminDashboard />}
        />

        {/* Staff */}
        <Route
          path="/staff"
          element={<StaffDashboard />}
        />

        {/* Employer */}
        <Route
          path="/employer"
          element={<EmployerDashboard />}
        />

        {/* Job Seeker */}
        <Route
          path="/jobseeker"
          element={<JobSeekerDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;