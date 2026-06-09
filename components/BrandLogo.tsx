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
  return <PhasaLogo className={className} />;
}
