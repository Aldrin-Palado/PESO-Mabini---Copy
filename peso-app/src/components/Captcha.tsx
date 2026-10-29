import { useEffect, useRef, useState } from "react";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "compact";

type TurnstileRenderOptions = {
  sitekey: string;
  theme: TurnstileTheme;
  size: TurnstileSize;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type CaptchaProps = {
  /** Called with the token to verify on a trusted server. Empty string clears it. */
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  siteKey?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  resetKey?: number;
  className?: string;
};

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src^="${TURNSTILE_SCRIPT_URL}"]`,
    );
    const isNewScript = !script;

    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
    }

    const currentScript = script;
    const cleanupListeners = () => {
      currentScript.removeEventListener("load", handleLoad);
      currentScript.removeEventListener("error", handleError);
    };
    const handleLoad = () => {
      cleanupListeners();
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        scriptPromise = undefined;
        reject(new Error("Cloudflare Turnstile loaded without its API."));
      }
    };
    const handleError = () => {
      cleanupListeners();
      scriptPromise = undefined;
      reject(new Error("Unable to load Cloudflare Turnstile."));
    };

    currentScript.addEventListener("load", handleLoad, { once: true });
    currentScript.addEventListener("error", handleError, { once: true });

    if (isNewScript) document.head.appendChild(currentScript);
  });

  return scriptPromise;
}

export default function Captcha({
  onVerify,
  onExpire,
  onError,
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY,
  theme = "light",
  size = "normal",
  resetKey = 0,
  className = "",
}: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  }, [onVerify, onExpire, onError]);

  useEffect(() => {
    if (!siteKey) {
      setLoadError(
        "CAPTCHA is not configured. Set VITE_TURNSTILE_SITE_KEY to enable it.",
      );
      callbacksRef.current.onVerify("");
      callbacksRef.current.onError?.();
      return;
    }

    let active = true;
    let widgetId: string | undefined;
    setLoadError("");

    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;

        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token) => callbacksRef.current.onVerify(token),
          "expired-callback": () => {
            callbacksRef.current.onVerify("");
            callbacksRef.current.onExpire?.();
          },
          "error-callback": () => {
            callbacksRef.current.onVerify("");
            callbacksRef.current.onError?.();
          },
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Cloudflare Turnstile error:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the CAPTCHA challenge.",
        );
        callbacksRef.current.onVerify("");
        callbacksRef.current.onError?.();
      });

    return () => {
      active = false;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey, theme, size, resetKey]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      {loadError && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}
    </div>
  );
}
