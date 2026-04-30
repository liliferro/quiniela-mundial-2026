"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen stadium-bg relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#0057ff]/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[260px] h-[260px] rounded-full bg-[#f5c542]/10 blur-3xl pointer-events-none" />

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side — Brand + value prop */}
        <section className="flex-1 px-6 sm:px-10 lg:px-16 pt-10 lg:pt-0 lg:flex lg:items-center">
          <div className="max-w-xl mx-auto lg:mx-0 w-full">
            <div className="flex items-center gap-3 mb-8 lg:mb-12">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00a859] to-[#007a3d] flex items-center justify-center font-display font-extrabold text-white text-xl shadow-lg shadow-emerald-500/30">
                Q
              </div>
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

        {/* Right side — Login card */}
        <section className="flex-1 px-6 sm:px-10 lg:px-16 py-10 lg:py-0 lg:flex lg:items-center">
          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#00a859]/30 via-transparent to-[#0057ff]/30 rounded-[28px] blur-xl opacity-60 pointer-events-none" />

              <div className="relative rounded-3xl bg-white shadow-[0_24px_60px_rgba(7,17,31,0.45)] border border-white/40 p-7 sm:p-9">
                {sent ? (
                  <SentState
                    email={email}
                    onReset={() => {
                      setSent(false);
                      setEmail("");
                    }}
                  />
                ) : (
                  <>
                    <div className="mb-7">
                      <h3 className="font-display text-2xl sm:text-[26px] font-extrabold text-[#07111f] tracking-tight">
                        Entra a tu quiniela
                      </h3>
                      <p className="text-sm text-[#64748b] mt-1.5">
                        Te enviamos un enlace mágico al correo. No necesitas
                        contraseña.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-[12px] font-bold uppercase tracking-wider text-[#475569] mb-2"
                        >
                          Correo electrónico
                        </label>
                        <div className="relative">
                          <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] placeholder-[#94a3b8] focus:bg-white focus:border-[#00a859] focus:shadow-[0_0_0_4px_rgba(0,168,89,0.15)] outline-none transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-sm">
                          <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !email}
                        className={`w-full py-3.5 rounded-xl font-display font-bold text-white text-sm tracking-wide transition-all
                          ${
                            loading || !email
                              ? "bg-[#cbd5e1] cursor-not-allowed"
                              : "bg-gradient-to-br from-[#00a859] to-[#007a3d] shadow-[0_8px_20px_rgba(0,168,89,0.32)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,168,89,0.42)] cursor-pointer"
                          }`}
                      >
                        {loading ? "Enviando enlace..." : "Enviar enlace mágico"}
                      </button>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                          ¿Cómo funciona?
                        </span>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                      </div>

                      <ol className="space-y-2 text-sm text-[#475569]">
                        <Step n={1}>Pones tu correo y le das clic a entrar.</Step>
                        <Step n={2}>Te llega un enlace seguro a tu inbox.</Step>
                        <Step n={3}>Abres el enlace y ya estás dentro.</Step>
                      </ol>
                    </form>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-white/40 text-center mt-6 lg:hidden">
              Sin contraseñas. Sin spam. Solo fútbol.
            </p>
          </div>
        </section>
      </div>
    </div>
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

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-5 h-5 shrink-0 rounded-full bg-[#063b22] text-white font-display font-bold text-[10px] flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function SentState({
  email,
  onReset,
}: {
  email: string;
  onReset: () => void;
}) {
  return (
    <div className="text-center py-2">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
        <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-300/60 flex items-center justify-center shadow-inner">
          <svg
            className="w-10 h-10 text-[#00a859]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <h3 className="font-display text-2xl font-extrabold text-[#07111f] tracking-tight">
        ¡Listo, revisa tu correo!
      </h3>
      <p className="text-sm text-[#64748b] mt-2">
        Enviamos un enlace mágico a
      </p>
      <p className="font-display font-bold text-[#063b22] text-base mt-1 break-all">
        {email}
      </p>

      <div className="mt-6 px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-left">
        <div className="flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div className="text-xs text-[#475569]">
            <span className="font-bold text-[#0f172a]">¿No lo ves? </span>
            Revisa tu carpeta de Spam o Promociones. El enlace expira en
            1 hora.
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-5 text-sm font-semibold text-[#00a859] hover:text-[#063b22] transition-colors cursor-pointer"
      >
        ← Usar otro correo
      </button>
    </div>
  );
}
