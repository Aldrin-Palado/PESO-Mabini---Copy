import React, { useState, type FormEvent } from "react";
import Footer from "../components/Footer";
import LocationMap, {
  MABINI_MUNICIPAL_HALL,
  MABINI_LOCATION_COORDS,
  buildDirectionsUrl,
} from "../components/LocationMap";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import { supabase } from "../services/supabase";

interface ContactMethod {
  title: string;
  detail: string;
  accent: string;
  borderAccent: string;
  label: string;
  link?: string;
}

const pesoContactEmail = "pesomabini901@gmail.com";

const contactMethods: ContactMethod[] = [
  {
    title: "Office Address",
    detail:
      "PESO Mabini, Public Employment Service Office\nMabini Municipal Hall, R. P. Amurao St.\nPoblacion, Mabini, Batangas 4202",
    accent: "bg-sky-50 text-sky-600",
    borderAccent: "bg-sky-600",
    label: "Get Directions",
    link: buildDirectionsUrl(MABINI_LOCATION_COORDS),
  },
  {
    title: "Email Us",
    detail: pesoContactEmail,
    accent: "bg-yellow-50 text-yellow-600",
    borderAccent: "bg-yellow-500",
    label: "Send Email",
  },
  {
    title: "Call Us",
    detail: "(043) 754-XXXX\nMon to Fri • 8:00 AM – 5:00 PM",
    accent: "bg-red-50 text-red-500",
    borderAccent: "bg-red-500",
    label: "Call Office",
  },
];

const officeHours = [
  "Monday to Friday",
  "8:00 AM – 5:00 PM",
  "Closed on weekends and holidays",
];

const quickLinks = [
  "Job placement assistance",
  "Employer registration support",
  "Career guidance and referral",
  "Skills and livelihood programs",
];

const Contact: React.FC = () => {
  const [contactStatus, setContactStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submission = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim(),
    };

    setIsSending(true);
    setContactStatus("");
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
      }>("contact-message", { body: submission });
      if (error) throw error;
      if (!data?.success) throw new Error("The contact message was not accepted.");

      form.reset();
      setContactStatus("Your message was sent to PESO Mabini. Thank you for reaching out.");
    } catch (error) {
      console.error("Could not send the PESO contact message:", error);
      setContactStatus(
        `We couldn't send your message. Please try again or email ${pesoContactEmail} directly.`,
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="whirl-page-background min-h-screen text-slate-800">

      <Navbar />

      {/* Top Philippine-inspired accent */}
      <div className="h-1 bg-[#123B70]" />

      {/* Hero */}
      <section className="hero-shell-compact relative isolate overflow-hidden bg-slate-950">

        {/* Decorative background */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-600/20 blur-3xl" />

        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-24">

          <div className="max-w-3xl">

            {/* Label */}
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />

              <span className="text-xs font-semibold text-white sm:text-sm">
                Public Employment Service Office
              </span>
            </div>

            {/* Heading */}
            <h1 className="hero-heading-compact font-black text-white">
              Contact{" "}
              <span className="text-sky-300">
                PESO Mabini
              </span>
            </h1>

            <p className="hero-lead mt-6 max-w-2xl text-slate-300">
              We are here to support job seekers, employers, and community
              partners with responsive, people-focused employment services
              and livelihood assistance.
            </p>

          </div>

        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-[#123B70]" />

      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8 lg:py-16">

        {/* Contact Methods */}
        <section>

          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
              Get In Touch
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              How Can We Help?
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              Reach out to PESO Mabini through any of the available contact
              channels below.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {contactMethods.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                {/* Card accent */}
                <div className={`h-1 ${item.borderAccent}`} />

                <div className="p-6">

                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${item.accent}`}
                  >
                    {item.label}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {item.detail}
                  </p>

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 transition hover:text-sky-700"
                    >
                      Open in Google Maps
                      <AppIcon name="arrowRight" className="h-4 w-4" />
                    </a>
                  )}

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* Message + Sidebar */}
        <section className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-8">

          {/* Contact Form */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="h-1 bg-sky-600" />

            <div className="p-5 sm:p-6 md:p-8">

              <div className="mb-7">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                  Send a Message
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  We’d Love to Hear From You
                </h2>

                <p className="mt-2 text-slate-500">
                  Have a question or need assistance? Send us a message.
                </p>

              </div>

              <form className="space-y-5" onSubmit={(event) => void handleContactSubmit(event)}>

                <div
                  aria-hidden="true"
                  className="absolute -left-[10000px] h-px w-px overflow-hidden"
                >
                  <label htmlFor="contact-website">Leave this field empty</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name
                    </label>

                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>

                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                </div>

                <div>
                  <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>

                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    placeholder="How can we help?"
                    maxLength={160}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    maxLength={5000}
                    required
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="rounded-xl bg-sky-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md"
                >
                  {isSending ? "Sending..." : "Send Message"}
                </button>

              </form>
              <p className="mt-4 text-sm text-slate-500" aria-live="polite" role="status">
                Messages are sent directly to {pesoContactEmail}.
                {contactStatus && <span className="mt-2 block">{contactStatus}</span>}
              </p>

            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Office Hours */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="h-1 bg-sky-500" />

              <div className="p-6">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                  Office Hours
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-900">
                  When We're Available
                </h3>

                <div className="mt-5 space-y-4">

                  {officeHours.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />

                      <span className="text-sm leading-6 text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

            </div>

            {/* Quick Services */}
            <div className="overflow-hidden rounded-3xl bg-[#062B4F] text-white shadow-sm">

              <div className="h-1 bg-sky-600" />

              <div className="p-6">

                <p className="text-sm font-bold uppercase tracking-widest text-sky-300">
                  Quick Services
                </p>

                <h3 className="mt-2 text-xl font-black text-white">
                  Employment Assistance
                </h3>

                <ul className="mt-5 space-y-4">

                  {quickLinks.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" />

                      <span className="text-sm leading-6 text-slate-300">
                        {item}
                      </span>
                    </li>
                  ))}

                </ul>

              </div>

            </div>

          </aside>

        </section>

        {/* Visit Office */}
        <section className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="h-1 bg-sky-600" />

          <div className="grid gap-0 lg:grid-cols-2">

            {/* Text */}
            <div className="p-5 sm:p-8 md:p-10">

              <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
                Visit Our Office
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-900">
                Located in the Heart of the Community
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                PESO Mabini is committed to making public employment services
                accessible, transparent, and responsive to the needs of
                residents, employers, and local partners.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-5">

                <p className="font-bold text-slate-900">
                  PESO Mabini
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Public Employment Service Office
                </p>

                <p className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                  <AppIcon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  <span>
                    {MABINI_MUNICIPAL_HALL.name}
                    <br />
                    {MABINI_MUNICIPAL_HALL.address}
                  </span>
                </p>

                <a
                  href={buildDirectionsUrl(MABINI_LOCATION_COORDS)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  Get Directions to the Municipal Hall
                </a>

              </div>

            </div>

            {/* Map */}
            <div className="bg-slate-100 p-4 sm:p-5 lg:p-8">

              <LocationMap className="h-full min-h-[280px]" />

            </div>

          </div>

        </section>

      </main>

      <Footer />

    </div>
  );
};

export default Contact;