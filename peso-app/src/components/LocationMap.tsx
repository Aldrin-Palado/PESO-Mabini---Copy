import React from "react";

/**
 * Mabini Municipal Hall, the office where PESO Mabini is located.
 * Coordinates from OpenStreetMap (way 369853924).
 */
export const MABINI_MUNICIPAL_HALL = {
  name: "Mabini Municipal Hall",
  address: "R. P. Amurao Street, Poblacion, Mabini, Batangas, 4202",
  lat: 13.7481712,
  lng: 120.9419955,
} as const;

/** Human-readable destination used by Google Maps links. */
export const MABINI_LOCATION_QUERY = `${MABINI_MUNICIPAL_HALL.name}, ${MABINI_MUNICIPAL_HALL.address}`;

/** Accurate map pin for the municipal hall. */
export const MABINI_LOCATION_COORDS = `${MABINI_MUNICIPAL_HALL.lat},${MABINI_MUNICIPAL_HALL.lng}`;

interface LocationMapProps {
  query?: string;
  zoom?: number;
  title?: string;
  className?: string;
}

const buildEmbedUrl = (query: string, zoom: number) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

/** Opens Google Maps driving directions from the user's current location. */
export const buildDirectionsUrl = (destination: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;

const LocationMap: React.FC<LocationMapProps> = ({
  query = MABINI_LOCATION_COORDS,
  zoom = 17,
  title = `Map of ${MABINI_MUNICIPAL_HALL.name}, Mabini, Batangas`,
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
        href={buildDirectionsUrl(MABINI_LOCATION_COORDS)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Get directions to ${MABINI_MUNICIPAL_HALL.name}`}
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

        Get Directions
      </a>
    </div>
  );
};

export default LocationMap;
