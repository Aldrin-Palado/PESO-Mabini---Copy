
import { FormEvent, useEffect, useState } from "react";

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
}

interface CompanyProfileModuleProps {
  profile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => Promise<void>;
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

  // Update form when the profile changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

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
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const companyName = formData.company_name.trim();
    const companyEmail = formData.company_email.trim();
    const companyPhone = formData.company_phone.trim();
    const companyAddress = formData.company_address.trim();

    if (!companyName) {
      setError("Company name is required.");
      return;
    }

    if (!companyEmail) {
      setError("Company email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      setError("Please enter a valid company email address.");
      return;
    }

    if (!companyPhone) {
      setError("Company phone number is required.");
      return;
    }

    if (!companyAddress) {
      setError("Company address is required.");
      return;
    }

    const updatedProfile: CompanyProfile = {
      ...formData,
      company_name: companyName,
      company_email: companyEmail,
      company_phone: companyPhone,
      company_address: companyAddress,
      company_description: formData.company_description.trim(),
      industry: formData.industry?.trim() || null,
      website: formData.website?.trim() || null,
      contact_person: formData.contact_person?.trim() || null,
    };

    try {
      setIsSaving(true);

      await onSave(updatedProfile);

      setFormData(updatedProfile);
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
            Manage your company's information and contact details.
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0446A7] text-2xl font-black text-white">
              {formData.company_name?.trim().charAt(0).toUpperCase() || "C"}
            </div>

            <div>
              <h2 className="text-lg font-black text-[#123B70]">
                {formData.company_name || "Company Information"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {formData.industry || "Company profile"}
              </p>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className={labelClass}>
              Company Name *
            </label>

            <input
              id="company_name"
              name="company_name"
              type="text"
              required
              maxLength={150}
              value={formData.company_name ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="Enter company name"
              className={inputClass}
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className={labelClass}>
              Industry
            </label>

            <input
              id="industry"
              name="industry"
              type="text"
              maxLength={100}
              value={formData.industry ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="Enter company industry"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="company_email" className={labelClass}>
              Company Email *
            </label>

            <input
              id="company_email"
              name="company_email"
              type="email"
              required
              maxLength={254}
              value={formData.company_email ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="company@example.com"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="company_phone" className={labelClass}>
              Contact Number *
            </label>

            <input
              id="company_phone"
              name="company_phone"
              type="tel"
              required
              maxLength={30}
              value={formData.company_phone ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="Enter company contact number"
              className={inputClass}
            />
          </div>

          {/* Contact Person */}
          <div>
            <label htmlFor="contact_person" className={labelClass}>
              Contact Person
            </label>

            <input
              id="contact_person"
              name="contact_person"
              type="text"
              maxLength={150}
              value={formData.contact_person ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="Enter contact person"
              className={inputClass}
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className={labelClass}>
              Company Website
            </label>

            <input
              id="website"
              name="website"
              type="url"
              maxLength={2048}
              value={formData.website ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label htmlFor="company_address" className={labelClass}>
              Company Address *
            </label>

            <textarea
              id="company_address"
              name="company_address"
              required
              rows={3}
              maxLength={500}
              value={formData.company_address ?? ""}
              onChange={handleChange}
              disabled={!isEditing || isSaving}
              placeholder="Enter complete company address"
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
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
          Accurate company information helps job seekers understand your
          organization and contact you when necessary.
        </p>
      </div>
    </div>
  );
}
