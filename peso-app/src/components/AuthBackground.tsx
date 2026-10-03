import mabiniSeal from "../assets/images/mabini logo.jpg";
import pesoSeal from "../assets/images/peso-logo-mark.png";

export default function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute left-[5%] top-[9%] h-28 w-28 overflow-hidden rounded-full bg-white/90 p-1 opacity-25 shadow-xl sm:h-48 sm:w-48 sm:p-2">
        <img
          src={mabiniSeal}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      <div className="absolute bottom-[7%] right-[5%] h-32 w-32 rounded-full bg-white/90 p-2 opacity-20 shadow-xl sm:h-52 sm:w-52 sm:p-3">
        <img
          src={pesoSeal}
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,59,115,0.74),rgba(8,124,180,0.52)_55%,rgba(19,170,180,0.68))]" />
    </div>
  );
}