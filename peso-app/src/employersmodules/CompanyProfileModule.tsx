
import { useEffect, useState, type FormEvent } from "react";

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
}

export default function CompanyProfileModule({
  profile,
  onSave,
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
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData(profile);
    setLogoFile(null);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setFormData({
        ...updatedProfile,
        company_logo_url: savedLogoUrl,
      });
      setLogoFile(null);
      setIsEditing(false);
      setSuccess("Company profile updated successfully.");
    } catch (err) {
      console.error("Company profile update failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update company profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#0446A7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

  const labelClass =
    "mb-2 block text-sm font-bold text-slate-700";

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#123B70] sm:text-3xl">
            Company Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your company description and profile image.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setIsEditing(true);
            }}
            className="rounded-xl bg-[#0446A7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123B70]"
          >
            Edit Profile
          </button>
        )}
      </section>

      {/* Success Message */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Company Header */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-2xl font-black text-[#0446A7]">
              {logoPreviewUrl || formData.company_logo_url ? (
                <img
                  src={logoPreviewUrl || formData.company_logo_url || ""}
                  alt={`${formData.company_name || "Company"} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                formData.company_name?.trim().charAt(0).toUpperCase() || "C"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-[#123B70]">
                {formData.company_name || "Company Information"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {formData.industry || "Company profile"}
              </p>
              {isEditing && (
                <div className="mt-3">
                  <label
                    htmlFor="company-logo"
                    className="inline-flex cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {logoFile ? "Change image" : "Upload company image"}
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
          </div>
        </div>

        {/* Company Description */}
        <div className="p-6">
          <label
            htmlFor="company_description"
            className={labelClass}
          >
            Company Description
          </label>

          <textarea
            id="company_description"
            name="company_description"
            rows={5}
            maxLength={3000}
            value={formData.company_description ?? ""}
            onChange={handleChange}
            disabled={!isEditing || isSaving}
            placeholder="Describe your company, services, and workplace..."
            className={`${inputClass} resize-y`}
          />

          <p className="mt-2 text-right text-xs text-slate-400">
            {(formData.company_description ?? "").length}/3000
            characters
          </p>
        </div>

        {/* Actions */}
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

      {/* Profile Information */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="font-bold text-[#123B70]">
          Keep your company profile updated
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          A clear description helps job seekers understand your organization
          and workplace.
        </p>
      </div>
    </div>
  );
}
