import { Link } from "react-router-dom";

/**
 * `peso-logo-mark.png` is `Peso-logo.png` with its fully transparent border
 * removed, so the file's aspect ratio (453x449) matches the visible mark
 * instead of the 546x457 padded canvas. Without this the browser letterboxes
 * the logo inside whatever square box it is given and it renders ~14%
 * smaller than intended.
 */
const pesoLogo = new URL(
  "../assets/images/peso-logo-mark.png",
  import.meta.url,
).href;

const sizes = {
  sm: "h-11 w-11",
  md: "h-[3.25rem] w-[3.25rem]",
  auth: "h-[4.5rem] w-[4.5rem]",
  lg: "h-[4.5rem] w-[4.5rem]",
} as const;

export type PesoLogoSize = keyof typeof sizes;

type PesoLogoProps = {
  size?: PesoLogoSize;
  /** Render the "PESO MABINI" wordmark beside the mark. */
  showName?: boolean;
  /** Smaller line under the wordmark. */
  subtitle?: string;
  /** `light` for dark backgrounds. */
  tone?: "dark" | "light";
  /** White tile behind the mark. See the note below before turning this off. */
  plate?: boolean;
  /** Wrap in a router link; pass `null` to render a plain div. */
  linkTo?: string | null;
  className?: string;
};

/**
 * The PESO MABINI brand mark, sized consistently everywhere it appears
 * (navbar, login, register, footer).
 *
 * `width`/`height` are the intrinsic pixel size so the browser reserves the
 * box before the image decodes — without them the mark shifts the layout on
 * every page load.
 */
export default function PesoLogo({
  size = "md",
  showName = false,
  subtitle,
  tone = "dark",
  plate = true,
  linkTo = "/",
  className = "",
}: PesoLogoProps) {
  const nameColor =
    tone === "light" ? "text-white" : "text-[#123B70]";
  const subtitleColor =
    tone === "light" ? "text-white" : "text-slate-500";

  /*
   * The logo is a full-colour seal: ~48% of its visible pixels are dark and
   * ~41% are light. Dropped straight onto `bg-slate-950` the dark half
   * disappears; onto the near-white auth pages the light half disappears.
   * A white tile gives the seal one predictable backdrop everywhere, which
   * is why `plate` defaults to on.
   */
  const mark = plate ? (
    <span
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-300/70`}
    >
      <img
        src={pesoLogo}
        alt="PESO MABINI logo"
        width={453}
        height={449}
        className="h-full w-full object-contain"
      />
    </span>
  ) : (
    <img
      src={pesoLogo}
      alt="PESO MABINI logo"
      width={453}
      height={449}
      className={`${sizes[size]} shrink-0 object-contain`}
    />
  );

  const content = showName ? (
    <>
      {mark}

      <span className="min-w-0">
        <span
          className={`block min-w-0 font-black leading-tight ${
            size === "lg"
              ? "text-[1.65rem]"
              : size === "auth"
                ? "text-[1.65rem]"
                : "text-[1.35rem]"
          } ${nameColor}`}
        >
          <span className="block whitespace-nowrap">PESO</span>
          <span className="block whitespace-nowrap text-red-600">MABINI</span>
        </span>

        {subtitle && (
          <span
            className={`mt-0.5 block truncate ${
              size === "auth" ? "text-sm" : "text-xs"
            } ${subtitleColor}`}
          >
            {subtitle}
          </span>
        )}
      </span>
    </>
  ) : (
    mark
  );

  const layout = showName
    ? "inline-flex items-center gap-3"
    : "inline-flex items-center";

  if (linkTo === null) {
    return <div className={`${layout} ${className}`}>{content}</div>;
  }

  return (
    <Link to={linkTo} className={`${layout} ${className}`}>
      {content}
    </Link>
  );
}
