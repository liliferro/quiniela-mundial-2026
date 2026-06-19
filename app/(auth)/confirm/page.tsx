import { Suspense } from "react";
import { headers } from "next/headers";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrandFromHost } from "@/lib/brand-config";
import { LOGO_URL, BRAND_NAME } from "@/lib/tenant";
import BrandLogo from "@/components/BrandLogo";
import ConfirmForm from "./ConfirmForm";

export default async function ConfirmPage() {
  const host = (await headers()).get("host") ?? "";
    const hostBrand = getBrandFromHost(host);
      const logoUrl = LOGO_URL || hostBrand?.logoPath || null;
        const brandName = LOGO_URL ? BRAND_NAME : (hostBrand?.name ?? BRAND_NAME);
          const logoFilter = hostBrand?.logoFilter;

            return (
                <BrandProvider logoUrl={logoUrl} brandName={brandName} logoFilter={logoFilter}>
                      <div className="min-h-screen stadium-bg relative overflow-hidden flex items-center justify-center px-6">
                              <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
                                      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#0057ff]/15 blur-3xl pointer-events-none" />

                                              <div className="relative max-w-md w-full">
                                                        <div className="mb-8 flex flex-col items-center text-center">
                                                                    <BrandLogo className="h-9 sm:h-10 w-auto mb-3" />
                                                                              </div>
                                                                                        <div className="relative">
                                                                                                    <div className="absolute -inset-1 bg-gradient-to-br from-[#00a859]/30 via-transparent to-[#0057ff]/30 rounded-[28px] blur-xl opacity-60 pointer-events-none" />
                                                                                                                <div className="relative rounded-3xl bg-white shadow-[0_24px_60px_rgba(7,17,31,0.45)] border border-white/40 p-7 sm:p-9">
                                                                                                                              <Suspense fallback={<div className="text-center text-[#64748b] py-8 text-sm">Cargando...</div>}>
                                                                                                                                              <ConfirmForm />
                                                                                                                                                            </Suspense>
                                                                                                                                                                        </div>
                                                                                                                                                                                  </div>
                                                                                                                                                                                          </div>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                    </BrandProvider>
                                                                                                                                                                                                      );
                                                                                                                                                                                                      }
                                                                                                                                                                                                      
