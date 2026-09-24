import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Employers from "./pages/Employers";
import JobVacancies from "./pages/JobVacancies";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/employers" element={<Employers />} />

        <Route path="/jobs" element={<JobVacancies />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;