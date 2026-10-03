type SidebarToggleProps = {
  open: boolean;
  onClick: () => void;
  label?: string;
};

/**
 * Floating hamburger button that opens the dashboard sidebar drawer on
 * phones and tablets. Hidden from `lg` up, where the sidebar is a permanent
 * column and the dashboards' `lg:ml-*` offset already reserves the space.
 *
 * Anchored bottom-right so it never sits under a sticky page header, and so
 * it stays reachable even while the drawer is open.
 */
export default function SidebarToggle({
  open,
  onClick,
  label = "Toggle navigation menu",
}: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={label}
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#0446A7] text-white shadow-lg shadow-slate-900/20 transition hover:bg-[#023a8c] active:scale-95 lg:hidden"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {open ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        )}
      </svg>
    </button>
  );
}
