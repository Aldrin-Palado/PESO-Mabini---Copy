import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";

const BUCKET = "peso-profile-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;
const SIGNED_URL_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProfileAvatarProps = {
  userId: string;
  fullName: string;
  size?: "small" | "large";
  showControls?: boolean;
  editable?: boolean;
  onPhotoStatusChange?: (hasPhoto: boolean) => void;
};

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ProfileAvatar({
  userId,
  fullName,
  size = "large",
  showControls = true,
  editable = false,
  onPhotoStatusChange,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarExpiresAtRef = useRef(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(`${userId}/avatar`, SIGNED_URL_TTL_SECONDS);

      if (cancelled) return;

      if (error) {
        if (error.statusCode === "404") {
          onPhotoStatusChange?.(false);
        } else {
          console.error("Profile photo load error:", error);
          setErrorMessage(`Unable to load profile photo: ${error.message}`);
        }
        return;
      }

      avatarExpiresAtRef.current =
        Date.now() + SIGNED_URL_TTL_SECONDS * 1000;
      setAvatarUrl(data.signedUrl);
      setErrorMessage("");
      onPhotoStatusChange?.(true);
    };

    void loadAvatar();
    return () => {
      cancelled = true;
    };
  }, [userId, onPhotoStatusChange, refreshKey]);

  useEffect(() => {
    const refreshExpiredAvatar = () => {
      if (
        document.visibilityState === "visible" &&
        avatarUrl &&
        Date.now() >=
          avatarExpiresAtRef.current - SIGNED_URL_REFRESH_BUFFER_MS
      ) {
        setRefreshKey((key) => key + 1);
      }
    };

    document.addEventListener("visibilitychange", refreshExpiredAvatar);
    return () =>
      document.removeEventListener("visibilitychange", refreshExpiredAvatar);
  }, [avatarUrl]);

  const handleAvatarError = () => {
    console.error("Profile photo failed to load; requesting a fresh image URL.");
    setAvatarUrl(null);
    setErrorMessage("Unable to load profile photo. Refreshing the image...");
    setRefreshKey((key) => key + 1);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("The image must be 5 MB or smaller.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const filePath = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

      if (urlError) throw urlError;
      avatarExpiresAtRef.current =
        Date.now() + SIGNED_URL_TTL_SECONDS * 1000;
      setAvatarUrl(data.signedUrl);
      setErrorMessage("");
      onPhotoStatusChange?.(true);
    } catch (error) {
      console.error("Profile photo upload error:", error);
      setErrorMessage(
        error instanceof Error
          ? `Unable to save profile photo: ${error.message}`
          : "Unable to save profile photo. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const avatarSize =
    size === "small" ? "h-10 w-10 text-sm" : "h-24 w-24 text-2xl";
  const avatar = (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#123B70] font-bold text-white shadow-md ring-1 ring-slate-200 ${avatarSize}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${fullName}'s profile`}
          className="h-full w-full object-cover"
          onError={handleAvatarError}
        />
      ) : (
        getInitials(fullName)
      )}
    </div>
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPTED_TYPES.join(",")}
      onChange={handleFileChange}
      disabled={loading}
      className="sr-only"
      aria-label="Choose a profile picture"
    />
  );

  if (editable) {
    return (
      <div className="flex flex-col items-start gap-2">
        {fileInput}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          aria-label={loading ? "Saving profile picture" : "Change profile picture"}
          className="relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B70] disabled:cursor-wait disabled:opacity-70"
        >
          {avatar}
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0759AE] text-white shadow">
            {loading ? (
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
        {loading && <span className="text-xs text-slate-500">Saving photo...</span>}
        {errorMessage && (
          <p role="alert" className="max-w-40 text-xs text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (!showControls) {
    return avatar;
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      {avatar}
      <div>
        <h4 className="font-semibold text-slate-900">Profile picture</h4>
        <p className="mt-1 text-sm text-slate-500">
          JPG, PNG, or WebP, up to 5 MB.
        </p>
        {fileInput}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="mt-3 rounded-lg bg-[#123B70] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0D315F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123B70] disabled:cursor-wait disabled:opacity-60"
        >
          {loading
            ? "Saving photo..."
            : avatarUrl
              ? "Change picture"
              : "Add picture"}
        </button>
        {errorMessage && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
