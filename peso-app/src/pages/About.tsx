import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About PESO Mabini</h1>
        <p className="tagline">Public Employment Service Office</p>
      </div>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          To provide quality employment services and livelihood assistance to job seekers and employers,
          promoting productive employment and national development.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Vision</h2>
        <p>
          A center of excellence in employment and livelihood services that empowers individuals
          and contributes to economic growth and social stability.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Services</h2>
        <ul className="services-list">
          <li>Job Placement and Employment Services</li>
          <li>Career Counseling and Guidance</li>
          <li>Skills Training and Development Programs</li>
          <li>Livelihood Assistance and Support</li>
          <li>Employer-Employee Networking</li>
          <li>Job Referral Services</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Why Choose Us?</h2>
        <ul className="benefits-list">
          <li>Professional and dedicated team</li>
          <li>Comprehensive employment solutions</li>
          <li>Free access to job opportunities</li>
          <li>Personalized career support</li>
          <li>Strong employer network</li>
        </ul>
      </section>

      <section className="about-section contact-section">
        <h2>Contact Us</h2>
        <p>
          <strong>PESO Mabini</strong><br />
          Public Employment Service Office<br />
          Email: <a href="mailto:peso.mabini@plo.gov.ph">peso.mabini@plo.gov.ph</a><br />
          Phone: (02) XXXX-XXXX
        </p>
      </section>
    </div>
  );
};

export default About;
