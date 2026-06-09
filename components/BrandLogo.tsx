"use client";

import PhasaLogo from "@/components/PhasaLogo";
import { useBrand } from "@/components/BrandProvider";

export default function BrandLogo({ className }: { className?: string }) {
  const { logoUrl, brandName, logoFilter } = useBrand();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={brandName}
        className={className}
        style={{ objectFit: "contain", filter: logoFilter }}
      />
    );
  }

  if (brandName !== "PHASA") {
    return (
      <span
        className={className}
        style={{
          fontFamily: "var(--font-sora), sans-serif",
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          lineHeight: 1,
          display: "inline-block",
        }}
      >
        {brandName}
      </span>
    );
  }

  return <PhasaLogo className={className} />;
}
