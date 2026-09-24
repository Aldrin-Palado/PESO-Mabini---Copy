import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../App.css";

const About = () => {
  return (
    <div className="app-root">
      <Navbar />
      <main className="about-container">
        <section className="about-hero">
          <h1>About PESO-Mabini</h1>
          <p className="lead">
            PESO-Mabini (Public Employment Service Office) is dedicated to
            empowering jobseekers and employers by providing accessible,
            professional employment services, skills development, and local
            labor market information.
          </p>
        </section>

        <section className="about-mission">
          <h2>Our Mission</h2>
          <p>
            To connect community members to meaningful employment opportunities
            through responsive career services, employer engagement, and
            targeted programs that foster inclusive economic growth.
          </p>
        </section>

        <section className="about-vision">
          <h2>Our Vision</h2>
          <p>
            A thriving Mabini where every resident has the opportunity and
            support to participate in the local economy and build a prosperous
            future.
          </p>
        </section>

        <section className="about-values">
          <h2>Our Core Values</h2>
          <ul>
            <li><strong>Integrity:</strong> We act transparently and ethically.</li>
            <li><strong>Accessibility:</strong> Services that are easy to reach and use.</li>
            <li><strong>Collaboration:</strong> Working with employers and community partners.</li>
            <li><strong>Excellence:</strong> Delivering high-quality, client-centered support.</li>
          </ul>
        </section>

        <section className="about-programs">
          <h2>What We Offer</h2>
          <div className="programs-grid">
            <div className="program-card">
              <h3>Job Matching</h3>
              <p>Helping employers find qualified candidates and jobseekers find suitable roles.</p>
            </div>
            <div className="program-card">
              <h3>Career Counseling</h3>
              <p>One-on-one guidance, resume help, and interview preparation.</p>
            </div>
            <div className="program-card">
              <h3>Skills Training</h3>
              <p>Workshops and trainings aligned with local market needs.</p>
            </div>
            <div className="program-card">
              <h3>Employer Services</h3>
              <p>Recruitment support, labor market information, and partnership opportunities.</p>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <h2>Get Involved</h2>
          <p>
            Whether you're an employer seeking talent or a jobseeker looking for
            support, PESO-Mabini is here to help. Reach out to our office or
            explore opportunities on our Job Vacancies page.
          </p>
          <a href="/JobVacancies" className="btn-primary">View Job Vacancies</a>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
