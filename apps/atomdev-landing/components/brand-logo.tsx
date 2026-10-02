interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 330 76"
      className={className}
      role="img"
      aria-label="AtomDev"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image
        href="/logo/logo_gris.png"
        x="0"
        y="0"
        width="76"
        height="76"
        className="brand-logo-color dark:hidden"
      />
      <image
        href="/logo/logo_mono_blanco.png"
        x="0"
        y="0"
        width="76"
        height="76"
        className="brand-logo-mono hidden dark:block"
      />
      <text
        x="91"
        y="59"
        className="brand-wordmark"
        fontFamily="Avenir Next, Avenir, Segoe UI, sans-serif"
        fontSize="58"
        fontWeight="500"
        letterSpacing="-2.4"
      >
        AtomDev
      </text>
    </svg>
  )
}
