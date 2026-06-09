import { headers } from "next/headers";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrandFromHost } from "@/lib/brand-config";
import { LOGO_URL, BRAND_NAME } from "@/lib/tenant";
import BrandLogo from "@/components/BrandLogo";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const host = (await headers()).get("host") ?? "";
  const hostBrand = getBrandFromHost(host);
  const logoUrl = LOGO_URL || hostBrand?.logoPath || null;
  const brandName = LOGO_URL ? BRAND_NAME : (hostBrand?.name ?? BRAND_NAME);

  return (
    <BrandProvider logoUrl={logoUrl} brandName={brandName}>
      <div className="min-h-screen stadium-bg relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#0057ff]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[260px] h-[260px] rounded-full bg-[#f5c542]/10 blur-3xl pointer-events-none" />

        <div className="relative lg:min-h-screen lg:flex lg:flex-row">
          <section className="lg:flex-1 lg:flex lg:items-center px-6 sm:px-10 lg:px-16 pt-10 pb-6 lg:py-0">
            <div className="max-w-xl mx-auto lg:mx-0 w-full">
              <div className="mb-8 lg:mb-12">
                <BrandLogo className="h-9 sm:h-10 w-auto mb-3" />
                <div>
                  <h1 className="font-display text-base font-bold text-white leading-tight">
                    Quiniela Mundial 2026
                  </h1>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
                    Fase de grupos
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5c542]/15 border border-[#f5c542]/30 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f5c542] mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542]" />
                72 partidos · 12 grupos
              </span>

              <h2 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.05] tracking-tight">
                Predice.
                <br />
                <span className="text-[#f5c542]">Compite.</span>
                <br />
                Levanta la copa.
              </h2>

              <p className="text-base sm:text-lg text-white/70 mt-5 max-w-md">
                Vive el Mundial 2026 con tu propia quiniela. Predice los marcadores
                de cada partido, suma puntos y mide quién la rompe en el ranking.
              </p>

              <ul className="mt-8 space-y-3">
                <Feature
                  icon="⚽"
                  title="Predice antes del silbatazo"
                  desc="Marcadores cerrados al inicio de cada partido."
                />
                <Feature
                  icon="🎯"
                  title="Gana hasta 3 puntos por jugada"
                  desc="Exacto, resultado o tendencia — todo suma."
                />
                <Feature
                  icon="🏆"
                  title="Sube en el ranking"
                  desc="Compara tu olfato con el resto y reclama tu lugar."
                />
              </ul>

              <p className="text-xs text-white/40 mt-10 hidden lg:block">
                Sin contraseñas. Sin spam. Solo fútbol.
              </p>
            </div>
          </section>

          <section className="lg:flex-1 lg:flex lg:items-center px-6 sm:px-10 lg:px-16 py-8 lg:py-0">
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#00a859]/30 via-transparent to-[#0057ff]/30 rounded-[28px] blur-xl opacity-60 pointer-events-none" />
                <div className="relative rounded-3xl bg-white shadow-[0_24px_60px_rgba(7,17,31,0.45)] border border-white/40 p-7 sm:p-9">
                  <LoginForm />
                </div>
              </div>

              <p className="text-xs text-white/40 text-center mt-6 lg:hidden">
                Sin contraseñas. Sin spam. Solo fútbol.
              </p>
            </div>
          </section>
        </div>
      </div>
    </BrandProvider>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <div className="font-display font-bold text-white text-base leading-tight">
          {title}
        </div>
        <div className="text-sm text-white/60 mt-0.5">{desc}</div>
      </div>
    </li>
  );
}
