import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSideImage from "./AuthSideImage";
import EmployerRegistration from "./EmployerRegistration";
import PesoLogo from "./PesoLogo";
import { supabase } from "../services/supabase";

function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("jobseeker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  if (accountType === "employer") {
    return <EmployerRegistration onBack={() => setAccountType("jobseeker")} />;
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    if (!formData.contactNumber.trim()) {
      alert("Please enter your contact number.");
      return;
    }

    if (!formData.address.trim()) {
      alert("Please enter your address.");
      return;
    }

    if (!resumeFile) {
      alert("Please upload your resume.");
      return;
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      alert("Resume must not exceed 5 MB.");
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx"];
    const fileExtension = resumeFile.name.split(".").pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    setLoading(true);

    let uploadedResumePath: string | null = null;

    try {
      const email = formData.email.trim().toLowerCase();
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const fullName = `${firstName} ${lastName}`.trim();

      // STEP 1: Create the Supabase Auth account.
      // The database trigger creates the initial job_seeker profile.
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            role: "jobseeker",
            contact_no: formData.contactNumber.trim(),
            address: formData.address.trim(),
          },
        },
      });

      if (error) {
        console.error("Supabase Auth registration error:", error);
        alert(`Registration failed: ${error.message}`);
        return;
      }

      if (!data.user) {
        alert("Supabase did not return a user account. Please try again.");
        return;
      }

      if (!data.session) {
        alert(
          "Your account was created. Confirm your email and sign in, then upload your resume from My Profile.",
        );
        navigate("/login");
        return;
      }

      const userId = data.user.id;

      // STEP 2: Upload the resume to the private `resumes` bucket.
      const safeExtension = fileExtension;
      const resumePath = `${userId}/${Date.now()}.${safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("Resume Files")
        .upload(resumePath, resumeFile, {
          upsert: false,
          contentType: resumeFile.type || undefined,
        });

      if (uploadError) {
        console.error("Resume upload error:", uploadError);
        alert(
          `Your account was created, but the resume could not be uploaded: ${uploadError.message}. Sign in and upload it from My Profile.`,
        );
        navigate("/login");
        return;
      }

      uploadedResumePath = resumePath;

      // STEP 3: Update the profile created by the auth.users trigger.
      // Do not INSERT another job_seeker record.
      const { error: profileError } = await supabase
        .from("job_seeker")
        .update({
          contact_no: formData.contactNumber.trim(),
          address: formData.address.trim(),
          resume_url: resumePath,
        })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Job seeker profile update error:", profileError);
        alert(
          `Account and resume were created, but your profile could not be updated: ${profileError.message}. Please contact the administrator.`,
        );
        return;
      }

      alert(
        "Account created successfully! Please check your email to confirm your account, then log in.",
      );
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred.";
      alert(
        `Something went wrong while creating your account.\n\nReason: ${errorMessage}`,
      );

      // If profile setup failed after the upload, leave the uploaded file in
      // Storage for recovery instead of deleting a potentially needed resume.
      if (uploadedResumePath) {
        console.warn("Resume remains in Storage at:", uploadedResumePath);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="whirl-page-background min-h-screen">
      <main className="grid min-h-screen lg:grid-cols-2">
        <AuthSideImage variant="register" />

        <section className="flex flex-col justify-center bg-white/85 px-5 py-9 backdrop-blur-sm sm:px-10 lg:min-h-screen lg:px-12 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[38rem]">
            {/* Header */}
            <div className="mb-8">
              <PesoLogo
                size="sm"
                showName
                subtitle="Registration"
                linkTo={null}
                className="mb-6"
              />
              <p className="text-sm font-semibold text-[#3156A2]">
                Join your local employment network              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#102A4C] sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Join PESO MABINI and access employment services in Mabini.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Account Type */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Choose your account type
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Job Seeker */}
                  <button
                    type="button"
                    aria-pressed={accountType === "jobseeker"}
                    onClick={() => setAccountType("jobseeker")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "jobseeker"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                        accountType === "jobseeker"
                          ? "bg-[#315FEA] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      JS
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Job Seeker</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Find jobs and submit applications
                    </p>
                  </button>

                  {/* Employer */}
                  <button
                    type="button"
                    aria-pressed={accountType === "employer"}
                    onClick={() => setAccountType("employer")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      accountType === "employer"
                        ? "border-[#315FEA] bg-[#EEF3FF] shadow-sm ring-2 ring-[#315FEA]/10"
                        : "border-[#D5DEEB] bg-white hover:border-[#315FEA]/50 hover:bg-blue-50/40"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide ${
                        accountType === "employer"
                          ? "bg-[#315FEA] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      EMP
                    </div>
                    <h3 className="font-bold text-[#102A4C]">Employer</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Post vacancies and find applicants
                    </p>
                  </button>
                </div>
              </div>

              {/* First and Last Name */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                />
              </div>

              {/* Job Seeker Contact, Address, Resume */}
              {accountType === "jobseeker" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                      required
                      className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((previous) => ({
                          ...previous,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Enter your complete address"
                      required
                      rows={3}
                      className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-800">
                      Upload Resume
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      required
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#315FEA] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#244FD4]"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Accepted formats: PDF, DOC, DOCX. Maximum file size: 5 MB.
                    </p>
                    {resumeFile && (
                      <p className="mt-2 text-sm font-medium text-green-600">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    className="w-full rounded-2xl border border-[#D5DEEB] bg-white px-5 py-3.5 pr-20 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#315FEA] focus:ring-4 focus:ring-[#315FEA]/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 transition hover:text-[#315FEA]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#315FEA] focus:ring-[#315FEA]"
                />
                <p className="text-sm text-slate-500">
                  I agree to the PESO MABINI terms and conditions and understand that
                  my information will be used for employment services.
                </p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#315FEA] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_-12px_rgba(49,95,234,0.75)] transition hover:bg-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-7 pt-2 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#315FEA] underline decoration-[#315FEA]/40 underline-offset-4 transition hover:text-[#123B70]"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Your information is protected and used only to provide employment
              services.
            </p>

            <Link
              to="/"
              className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#D5DEEB] bg-white px-6 py-3 text-sm font-semibold text-[#3156A2] shadow-sm transition hover:border-[#315FEA]/40 hover:text-[#244FD4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315FEA]"
            >
              <AppIcon name="arrowLeft" className="h-4 w-4" />
              Return to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
import AppIcon from "./AppIcon";
