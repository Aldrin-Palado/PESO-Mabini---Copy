import React from "react";

export const MABINI_LOCATION_QUERY =
  "Municipality of Mabini, Batangas, Philippines";

interface LocationMapProps {
  query?: string;
  zoom?: number;
  title?: string;
  className?: string;
}

const buildEmbedUrl = (query: string, zoom: number) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

const buildDirectionsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const LocationMap: React.FC<LocationMapProps> = ({
  query = MABINI_LOCATION_QUERY,
  zoom = 12,
  title = "Map of Mabini, Batangas, Philippines",
  className = "",
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${className}`}
    >
      <iframe
        title={title}
        src={buildEmbedUrl(query, zoom)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-full min-h-[280px] w-full border-0"
      />

      <a
        href={buildDirectionsUrl(query)}
        target="_blank"
        rel="noreferrer"
        className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12 21s-7-6.35-7-11a7 7 0 1 1 14 0c0 4.65-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>

        View on Google Maps
      </a>
    </div>
  );
};

export default LocationMap;
