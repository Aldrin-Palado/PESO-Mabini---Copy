import { useEffect, useState } from "react";

type HeroBackgroundProps = {
  /** Resolved image URL (Vite asset, CDN, Supabase storage, ...). */
  src: string;
  /**
   * Above-the-fold heroes should pass `priority` so the browser starts the
   * request before layout and skips the lazy-loading observer.
   */
  priority?: boolean;
  /** Extra classes for the <img> itself (overlay filters, etc). */
  className?: string;
};

/**
 * Responsive full-bleed hero background picture.
 *
 * Why an <img> instead of `style={{ backgroundImage: url(...) }}`:
 *   - `object-fit: cover` + a per-breakpoint `object-position` (see
 *     `.hero-media` in index.css) keeps the subject of a landscape photo
 *     in frame on tall, narrow phone screens. A CSS background pinned to
 *     `center` crops the sides off and hides the subject.
 *   - Real load/decode hints (`fetchPriority`, `decoding`) instead of an
 *     opaque background download.
 *   - The surrounding section keeps a solid colour underneath, so a slow or
 *     failed image still renders a readable hero rather than a black box.
 *
 * Purely decorative: exposed to assistive tech as `aria-hidden`, so it is
 * never announced as a separate image node.
 */
export default function HeroBackground({
  src,
  priority = false,
  className = "",
}: HeroBackgroundProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  // Reset when the source changes so a swapped hero does not stay hidden.
  useEffect(() => {
    setStatus("loading");
  }, [src]);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
      data-status={status}
      className={`hero-media ${
        status === "loaded" ? "opacity-100" : "opacity-0"
      } transition-opacity duration-500 motion-reduce:transition-none ${
        status === "error" ? "hidden" : ""
      } ${className}`}
    />
  );
}
