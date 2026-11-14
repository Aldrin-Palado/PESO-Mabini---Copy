import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import AppIcon from "../components/AppIcon";
import AutoResizeTextarea from "../components/AutoResizeTextarea";

interface CompanyProfile {
  employer_id?: number | string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_description: string;
  industry?: string | null;
  website?: string | null;
  contact_person?: string | null;
  company_logo_url?: string | null;
}

interface CompanyProfileModuleProps {
  profile: CompanyProfile;
  onSave: (
    updatedProfile: CompanyProfile,
    logoFile: File | null,
  ) => Promise<string | null>;
  onEditProfile: () => void;
  onCancelEdit: () => void;
}

export default function CompanyProfileModule({
  profile,
  onSave,
  onEditProfile,
  onCancelEdit,
}: CompanyProfileModuleProps) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData((current) =>
      isEditing
        ? { ...profile, company_description: current.company_description }
        : profile,
    );
  }, [isEditing, profile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData(profile);
    setLogoFile(null);
    setIsEditing(false);
    setError("");
    setSuccess("");
    onCancelEdit();
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setSuccess("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Company image must be 5 MB or smaller.");
      return;
    }
    setLogoFile(file);
    setIsSaving(true);
    try {
      const savedLogoUrl = await onSave(profile, file);
      setFormData((current) => ({
        ...current,
        company_logo_url: savedLogoUrl,
      }));
      setLogoFile(null);
      setSuccess("Company logo updated successfully.");
    } catch (saveError) {
      console.error("Company logo update failed:", saveError);
      setLogoFile(null);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the company logo. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const updatedProfile: CompanyProfile = {
      ...formData,
      company_description: formData.company_description.trim(),
    };
    try {
      setIsSaving(true);
      const savedLogoUrl = await onSave(updatedProfile, logoFile);
      setFormData({ ...updatedProfile, company_logo_url: savedLogoUrl });
      setLogoFile(null);
      setIsEditing(false);
      setSuccess("Company profile updated successfully.");
    } catch (err) {
      console.error("Company profile update failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update company profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400";
  const logoSrc = logoPreviewUrl || formData.company_logo_url;

  const information = [
    { label: "Contact Person", value: formData.contact_person },
    { label: "Company Email", value: formData.company_email },
    { label: "Contact Number", value: formData.company_phone },
    { label: "Company Address", value: formData.company_address },
    { label: "Website", value: formData.website },
    { label: "Industry", value: formData.industry },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-black text-[#123B70]">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage your company profile and business information.
        </p>
      </header>

      {success && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* COMPANY PROFILE OVERVIEW */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 md:items-center xl:grid-cols-[auto_minmax(0,1.35fr)_minmax(15rem,auto)_minmax(0,0.65fr)]">
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void handleLogoChange(event)}
              disabled={isSaving}
              className="sr-only"
              aria-label="Choose a company logo"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isSaving}
              aria-label={isSaving ? "Saving company logo" : "Change company logo"}
              className="relative block rounded-2xl text-[#0446A7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B70] disabled:cursor-wait disabled:opacity-70"
            >
              <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black shadow-sm">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`${formData.company_name || "Company"} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  formData.company_name?.trim().charAt(0).toUpperCase() || "C"
                )}
              </span>
              <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0759AE] text-white shadow">
                {isSaving ? (
                  <span aria-hidden="true" className="text-xs font-bold">...</span>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  >
                    <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" />
                  </svg>
                )}
              </span>
            </button>
            <p className="mt-1 text-center text-xs text-slate-500">JPG, PNG, or WebP; max 5 MB</p>
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-xl font-black text-[#123B70] sm:text-2xl">
              {formData.company_name || "Company Name"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#0759AE]">
                Employer
              </span>
              <span className="text-sm text-slate-500">
                {formData.industry || "Industry not specified"}
              </span>
            </div>
          </div>

          <div className="col-span-2 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-700 md:grid-cols-3 md:border-t-0 md:pt-0 xl:col-span-1 xl:grid-cols-1 xl:border-l xl:border-t-0 xl:pl-5">
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon name="mail" className="h-4 w-4 shrink-0 text-[#0759AE]" />
              <span className="break-all">{formData.company_email || "Email not provided"}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon name="phone" className="h-4 w-4 shrink-0 text-[#0759AE]" />
              <span>{formData.company_phone || "Phone not provided"}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <AppIcon name="mapPin" className="h-4 w-4 shrink-0 text-[#0759AE]" />
              <span className="break-words">{formData.company_address || "Address not provided"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY INFORMATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
              Business Details
            </p>
            <h2 className="mt-1 text-xl font-black text-[#123B70]">
              Company Information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your registered company and contact information.
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setIsEditing(true);
                onEditProfile();
              }}
              className="rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-bold text-[#0759AE] transition hover:bg-blue-50"
            >
              Edit Company Details
            </button>
          )}
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          {information.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-4">
              <dt className={labelClass}>{item.label}</dt>
              <dd className="break-words text-sm font-semibold text-slate-800">
                {item.value || "Not provided"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* COMPANY DESCRIPTION AND EDIT FORM */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
            About the Business
          </p>
          <h2 className="mt-1 text-xl font-black text-[#123B70]">
            Company Description
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tell job seekers about your company, services, and workplace.
          </p>

          {isEditing ? (
            <div className="mt-5">
              <label htmlFor="company_description" className="mb-2 block text-sm font-bold text-slate-700">
                Description
              </label>
              <AutoResizeTextarea
                id="company_description"
                name="company_description"
                rows={6}
                maxLength={3000}
                value={formData.company_description ?? ""}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="Describe your company, services, and workplace..."
                className={inputClass}
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {(formData.company_description ?? "").length}/3000 characters
              </p>
            </div>
          ) : (
            <div className="mt-5 min-h-24 rounded-xl bg-slate-50 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {formData.company_description?.trim() || "No company description provided."}
              </p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
