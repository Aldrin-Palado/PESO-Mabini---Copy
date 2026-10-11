import PesoLogo from "./PesoLogo";

function AuthPageHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.02]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <PesoLogo
          size="md"
          showName
          subtitle="Municipality of Mabini, Batangas"
        />
      </div>
      <div className="h-1 bg-gradient-to-r from-[#123B70] via-[#168A9B] to-[#E6B84A]" />
    </header>
  );
}

export default AuthPageHeader;
