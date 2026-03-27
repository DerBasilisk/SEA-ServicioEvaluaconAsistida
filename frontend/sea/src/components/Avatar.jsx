export default function Avatar({ src, name, size = "md", className = "" }) {
  const sizes = {
    xs:  "w-7 h-7 text-xs",
    sm:  "w-9 h-9 text-sm",
    md:  "w-10 h-10 text-sm",
    lg:  "w-14 h-14 text-xl",
    xl:  "w-20 h-20 text-2xl",
    "2xl": "w-24 h-24 text-4xl",
  };

  const initial = name?.trim()?.[0]?.toUpperCase() || "?";
  const shape = className.includes("rounded") ? "" : "rounded-2xl"; // ← usa la del className si viene, si no usa cuadrado

  return (
    <div className={`${sizes[size]} ${shape} overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || "avatar"}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div
        className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-black"
        style={{ display: src ? "none" : "flex" }}
      >
        {initial}
      </div>
    </div>
  );
}