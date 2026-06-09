import { headers } from "next/headers";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrandFromHost } from "@/lib/brand-config";
import { LOGO_URL, BRAND_NAME } from "@/lib/tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host") ?? "";
  const hostBrand = getBrandFromHost(host);
  const logoUrl = LOGO_URL || hostBrand?.logoPath || null;
  const brandName = LOGO_URL ? BRAND_NAME : (hostBrand?.name ?? BRAND_NAME);
  const logoFilter = hostBrand?.logoFilter;

  return (
    <BrandProvider logoUrl={logoUrl} brandName={brandName} logoFilter={logoFilter}>
      {children}
    </BrandProvider>
  );
}
