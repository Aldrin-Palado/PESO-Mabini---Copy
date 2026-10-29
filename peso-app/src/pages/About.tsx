import { Link } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import Footer from "../components/Footer";
import HeroBackground from "../components/HeroBackground";
import Navbar from "../components/Navbar";

const backgroundImage = new URL(
  "../assets/images/contact.png",
  import.meta.url,
).href;

const aboutVideo = new URL(
  "../assets/videos/pesoadvertisement.mp4",
  import.meta.url,
).href;

const services = [
  "Job placement and employment services",
  "Career counseling and guidance",
  "Skills training and development",
  "Livelihood assistance and support",
  "Employer and jobseeker networking",
  "Job referral services",
];

const values = [
  {
    title: "Integrity",
    description: "We provide responsible, transparent, and ethical service.",
  },
  {
    title: "Accessibility",
    description: "We work to make employment support easier to reach.",
  },
  {
    title: "Collaboration",
    description: "We build partnerships with employers and our community.",
  },
  {
    title: "Excellence",
    description: "We deliver thoughtful, client-centered assistance.",
  },
];

function About() {
  return (
    <div className="whirl-page-background flex min-h-screen flex-col text-slate-800">
      <Navbar />
      <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />

      <section className="hero-shell-compact relative isolate overflow-hidden bg-slate-950">
        <HeroBackground src={backgroundImage} priority />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/70 via-sky-950/35 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              Public Employment Service Office
            </p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              About <span className="text-sky-300">PESO Mabini</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              We connect jobseekers and employers with accessible employment
              services, career support, and opportunities to help Mabini thrive.
            </p>
            <Link
              to="/jobs"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-yellow-300"
            >
              Explore job opportunities
              <AppIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="mb-12" aria-label="PESO Mabini video">
          <video
            className="mx-auto aspect-video w-full max-w-4xl rounded-xl border border-slate-200 bg-slate-950 object-cover"
            controls
            playsInline
            preload="metadata"
          >
            <source src={aboutVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase text-red-600">Our purpose</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Our Mission</h2>
            <p className="mt-4 leading-7 text-slate-600">
              To provide quality employment services and livelihood assistance
              to jobseekers and employers, promoting productive employment and
              local development.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-sm font-bold uppercase text-sky-700">Our future</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Our Vision</h2>
            <p className="mt-4 leading-7 text-slate-600">
              A community where people can access meaningful work and employers
              can connect with the talent they need to grow.
            </p>
          </article>
        </section>

        <section className="mt-14" aria-labelledby="values-heading">
          <p className="text-sm font-bold uppercase text-red-600">What guides us</p>
          <h2 id="values-heading" className="mt-2 text-3xl font-black text-slate-900">
            Our Core Values
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <article
                key={value.title}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <span className="text-sm font-black text-sky-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="services-heading">
          <p className="text-sm font-bold uppercase text-red-600">How we help</p>
          <h2 id="services-heading" className="mt-2 text-3xl font-black text-slate-900">
            Employment Services
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-5"
              >
                <AppIcon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="font-semibold leading-6 text-slate-800">{service}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-1 bg-gradient-to-r from-sky-500 via-yellow-400 to-red-500" />
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-red-600">Visit or contact us</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">PESO Mabini</h2>
              <p className="mt-3 flex items-center gap-2 text-slate-600">
                <AppIcon name="mapPin" className="h-5 w-5 shrink-0 text-sky-700" />
                Mabini, Batangas
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-800 px-5 py-3 font-bold text-white transition hover:bg-sky-900"
            >
              Contact PESO
              <AppIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default About;
