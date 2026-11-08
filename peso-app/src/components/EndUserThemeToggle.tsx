import { useEffect, useState } from "react";

const storageKey = "peso-end-user-theme";

function isDarkMode() {
  try {
    return localStorage.getItem(storageKey) === "dark";
  } catch (error) {
    console.error("Could not read the saved theme preference:", error);
    return false;
  }
}

export default function EndUserThemeToggle() {
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    const syncTheme = () => setDarkMode(isDarkMode());
    window.addEventListener("peso-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("peso-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);

    if (nextDarkMode) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }

    try {
      localStorage.setItem(storageKey, nextDarkMode ? "dark" : "light");
    } catch (error) {
      console.error("Could not save the theme preference:", error);
    }
    window.dispatchEvent(new Event("peso-theme-change"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
      aria-pressed={darkMode}
      title={`Switch to ${darkMode ? "light" : "dark"} mode`}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {darkMode ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
        </svg>
      )}
      <span className="hidden sm:inline">{darkMode ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
