import { useEffect } from "react";

type Props = {
  onClose: () => void;
};

const termsSections = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "Welcome to PESO-Hub, the digital employment service platform of the Public Employment Service Office (PESO) of Mabini, Batangas. By accessing, registering, or using this platform, you acknowledge that you have read, understood, and agreed to comply with these Terms and Conditions. If you do not agree with any part of these terms, you should refrain from using the platform.",
    ],
  },
  {
    title: "2. Purpose of the Platform",
    paragraphs: [
      "PESO-Hub is designed to improve employment facilitation by providing a centralized platform for job seekers, employers, and PESO personnel. It offers services such as job vacancy announcements, online job applications, employer registration, applicant management, employment assistance, notifications, and AI-assisted job recommendations.",
    ],
  },
  {
    title: "3. User Registration and Account Responsibilities",
    paragraphs: [
      "Users must provide accurate, complete, and updated information when creating an account. Each user is responsible for maintaining the confidentiality of their login credentials and for all activities performed through their account. Users must immediately notify the PESO administrator if they suspect unauthorized access or misuse of their accounts.",
      "Creating multiple accounts for fraudulent purposes, impersonating another person, or providing false information is strictly prohibited.",
    ],
  },
  {
    title: "4. Job Seeker Responsibilities",
    paragraphs: [
      "Job Seekers are responsible for ensuring that their personal information, educational background, employment history, skills, and other submitted details are accurate and truthful. They must use the platform responsibly when searching for job opportunities and submitting applications.",
      "Submitting fraudulent documents, providing misleading qualifications, or using the platform for purposes unrelated to employment is prohibited.",
    ],
  },
  {
    title: "5. Employer Responsibilities",
    paragraphs: [
      "Employers must provide legitimate and accurate company information and ensure that all published job vacancies contain truthful descriptions, qualifications, employment conditions, and contact information.",
      "Employers are responsible for reviewing applications fairly and using applicant information only for legitimate recruitment and employment-related purposes. Posting fraudulent job opportunities, misleading applicants, collecting unauthorized fees, or misusing applicant information is strictly prohibited.",
    ],
  },
  {
    title: "6. PESO Staff and Administrator Responsibilities",
    paragraphs: [
      "PESO Staff and authorized administrators are responsible for managing employment-related information, assisting users, maintaining accurate records, and performing their assigned functions within the platform.",
      "Personnel must protect confidential information, follow their assigned access permissions, and use the platform only for authorized official purposes. Unauthorized disclosure, alteration, or misuse of user information is prohibited.",
    ],
  },
  {
    title: "7. Job Applications and Employment Opportunities",
    paragraphs: [
      "PESO-Hub serves as a platform connecting job seekers and employers. Submitting an application does not guarantee employment, an interview, or acceptance by an employer. Employers retain responsibility for their recruitment decisions, while applicants are responsible for communicating truthfully and professionally throughout the application process.",
      "PESO Mabini facilitates employment services but does not guarantee the legitimacy, availability, or outcome of every employment opportunity posted by employers. Users are encouraged to verify relevant employment details before proceeding with any recruitment arrangement.",
    ],
  },
  {
    title: "8. AI-Powered Job Recommendations",
    paragraphs: [
      "PESO-Hub may use artificial intelligence to recommend job opportunities based on the information, qualifications, skills, and preferences provided by Job Seekers.",
      "AI-generated recommendations are intended to assist users in identifying potentially suitable employment opportunities. These recommendations are not guarantees of qualification, interview invitations, or employment. Users and employers should independently review job requirements and applicant qualifications before making employment decisions.",
    ],
  },
  {
    title: "9. Messaging and Notifications",
    paragraphs: [
      "The platform may provide internal messaging and notification services to facilitate communication between Job Seekers, Employers, and authorized PESO personnel. Users agree to receive system-related notifications concerning account activities, job applications, messages, announcements, and other relevant service updates.",
      "Email notifications may also be sent to the registered email address of users. Users are responsible for maintaining an accessible and valid email address and should regularly check their PESO-Hub accounts for important updates.",
    ],
  },
  {
    title: "10. Privacy and Protection of Personal Information",
    paragraphs: [
      "PESO-Hub collects and processes personal information necessary to provide employment services, manage user accounts, facilitate job applications, and improve system operations.",
      "All personal information shall be handled responsibly and protected against unauthorized access, disclosure, alteration, or misuse in accordance with applicable data protection laws, including the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).",
      "Users acknowledge that certain information may be shared with relevant employers or authorized PESO personnel when necessary to facilitate recruitment and employment services. Personal information shall not be used for unrelated purposes without an appropriate lawful basis.",
    ],
  },
  {
    title: "11. Prohibited Activities",
    paragraphs: ["Users are prohibited from:"],
    list: [
      "Providing false, misleading, or fraudulent information.",
      "Impersonating another individual, employer, or organization.",
      "Posting fake job vacancies or misleading employment opportunities.",
      "Harassing, threatening, or discriminating against other users.",
      "Accessing accounts, records, or system functions without authorization.",
      "Attempting to disrupt, damage, or compromise the security of PESO-Hub.",
      "Collecting, distributing, or misusing personal information without authorization.",
      "Using the platform for illegal, fraudulent, or unauthorized activities.",
    ],
    after:
      "Violations may result in account suspension, restriction, or termination, subject to applicable policies and procedures.",
  },
  {
    title: "12. Account Suspension and Termination",
    paragraphs: [
      "PESO-Hub administrators reserve the right to investigate reported violations and restrict, suspend, or terminate accounts involved in unauthorized or prohibited activities, subject to applicable policies and legal requirements.",
      "Users may request account deactivation or deletion through the appropriate platform procedures. Certain records may be retained when required for legal compliance, legitimate administrative purposes, audit requirements, or other lawful grounds.",
    ],
  },
  {
    title: "13. System Availability and Limitations",
    paragraphs: [
      "PESO-Hub aims to provide accessible and reliable employment services. However, temporary interruptions may occur due to maintenance, technical issues, internet connectivity problems, or other circumstances beyond the system's control.",
      "The PESO administration will make reasonable efforts to maintain system availability, protect stored information, and address technical issues when they arise.",
    ],
  },
  {
    title: "14. Intellectual Property and Platform Use",
    paragraphs: [
      "The PESO-Hub name, platform design, system features, content, and other original materials are intended for authorized use in connection with PESO Mabini employment services. Users may not reproduce, distribute, modify, or commercially exploit protected platform materials without appropriate authorization.",
    ],
  },
  {
    title: "15. Amendments to the Terms and Conditions",
    paragraphs: [
      "PESO Mabini reserves the right to modify or update these Terms and Conditions when necessary to reflect changes in system features, operational policies, or applicable laws and regulations. Users will be informed of significant changes through appropriate platform announcements or notifications.",
      "Continued use of PESO-Hub after the implementation of updated terms constitutes acknowledgment of the revised conditions, subject to applicable consent requirements.",
    ],
  },
  {
    title: "16. Contact and Assistance",
    paragraphs: [
      "For questions, concerns, complaints, or assistance regarding these Terms and Conditions or the use of PESO-Hub, users may contact the Public Employment Service Office (PESO) of Mabini, Batangas through its official communication channels.",
    ],
  },
];

export default function TermsAndConditionsModal({ onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <h2 id="terms-title" className="text-xl font-black text-[#123B70]">
              TERMS AND CONDITIONS
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              PESO-Hub – Public Employment Service Office Mabini
            </p>
            <p className="mt-1 text-xs text-slate-500">Effective Date: [Insert Date]</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms and Conditions"
            className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 text-sm leading-6 text-slate-700 sm:px-7">
          <div className="space-y-5">
            {termsSections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-1 font-bold text-slate-900">{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-2 last:mb-0">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="my-2 list-disc space-y-1 pl-6">
                    {section.list.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
                {section.after && <p>{section.after}</p>}
              </section>
            ))}

            <section>
              <h3 className="mb-1 font-bold text-slate-900">
                USER ACKNOWLEDGMENT AND AGREEMENT
              </h3>
              <p className="mb-2">
                By selecting the "I Agree" option during registration or when prompted to accept these Terms and Conditions, I confirm that I have read, understood, and voluntarily agreed to follow the rules, responsibilities, and conditions governing the use of PESO-Hub.
              </p>
              <p>
                I understand that providing false information, violating platform policies, or misusing the services may result in appropriate administrative action, including restriction or suspension of my account.
              </p>
            </section>
          </div>
        </div>

        <footer className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#315FEA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#244FD4]"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
