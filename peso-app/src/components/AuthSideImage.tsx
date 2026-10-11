const backgroundImage = new URL(
  "../assets/images/peso-auth-building.jpg",
  import.meta.url,
).href;

type AuthSideImageProps = {
  variant?: "login" | "register";
};

function AuthSideImage({ variant = "login" }: AuthSideImageProps) {
  const panelSize =
    variant === "register"
      ? "xl:aspect-[0.92] xl:min-h-[36rem] xl:max-h-[46rem] xl:self-center"
      : "xl:min-h-[calc(100dvh-5.5rem)]";

  return (
    <section
      aria-label="Mabini Public Employment Service Office"
      className={`relative hidden min-h-[34rem] w-full overflow-hidden rounded-[0_18%_18%_0] bg-[#123B70] xl:block ${panelSize}`}
    >
      <img
        src={backgroundImage}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${
          variant === "register" ? "object-[52%_center]" : "object-center"
        }`}
      />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#123B70]/10 to-transparent" />
    </section>
  );
}

export default AuthSideImage;
