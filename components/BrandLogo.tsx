"use client";

import PhasaLogo from "@/components/PhasaLogo";
import { useBrand } from "@/components/BrandProvider";

export default function BrandLogo({ className }: { className?: string }) {
  const { logoUrl, brandName } = useBrand();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={brandName}
        className={className}
        style={{ objectFit: "contain" }}
      />
    );
  }
  return <PhasaLogo className={className} />;
}
