const backgroundImage = new URL(
  "../assets/images/peso-auth-building.jpg",
  import.meta.url,
).href;

type AuthSideImageProps = {
  variant?: "login" | "register";
};

function AuthSideImage({ variant = "login" }: AuthSideImageProps) {
  return (
    <section className="relative flex min-h-[19rem] flex-col justify-end overflow-hidden bg-[#123B70] px-6 py-7 text-white after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-0 after:bg-[#F3F6FB] sm:min-h-[23rem] sm:px-10 sm:py-9 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:px-12 lg:py-11 lg:after:-right-14 lg:after:-top-[10%] lg:after:z-10 lg:after:h-[120%] lg:after:w-28 lg:after:rounded-[50%] lg:after:content-[''] xl:px-16 xl:py-14">
      <img
        src={backgroundImage}
        alt="Public Employment Service Office in Mabini, Batangas"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#09244A]/55 via-[#09244A]/10 to-[#071A33]/90" />

      <div className="relative z-20 max-w-xl pb-2 sm:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F1D58A] sm:text-sm">
          Public Employment Service Office
        </p>
        <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {variant === "register"
            ? "Your next opportunity starts here."
            : "Welcome back to your PESO community."}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
          Find meaningful work, connect with local employers, and access
          employment services in Mabini.
        </p>
        <div className="mt-7 flex items-center gap-3 text-xs font-medium tracking-wide text-white/75 sm:text-sm">
          <span className="h-px w-9 bg-[#F1D58A]" />
          Connecting Mabini to opportunity
        </div>
      </div>
    </section>
  );
}

export default AuthSideImage;
