import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

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

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

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

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 bg-slate-50 px-6 py-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black text-[#0446A7] shadow-sm">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${formData.company_name || "Company"} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              formData.company_name?.trim().charAt(0).toUpperCase() || "C"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0759AE]">
              Company Profile
            </p>
            <h2 className="mt-1 break-words text-xl font-black text-[#123B70]">
              {formData.company_name || "Company Name"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formData.industry || "Industry not specified"}
            </p>
            <p className="mt-1 break-words text-sm text-slate-500">
              {formData.company_email || "Email not provided"}
            </p>

            {isEditing && (
              <div className="mt-4">
                <label
                  htmlFor="company-logo"
                  className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {logoFile ? "Change company logo" : "Upload company logo"}
                </label>
                <input
                  id="company-logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  disabled={isSaving}
                  className="sr-only"
                />
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, or WebP; maximum 5 MB.
                </p>
              </div>
            )}
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
              className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70] sm:ml-auto"
            >
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* COMPANY INFORMATION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
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
              <textarea
                id="company_description"
                name="company_description"
                rows={6}
                maxLength={3000}
                value={formData.company_description ?? ""}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="Describe your company, services, and workplace..."
                className={`${inputClass} resize-y`}
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
