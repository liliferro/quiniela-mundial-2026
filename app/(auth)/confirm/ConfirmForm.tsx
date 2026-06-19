"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type) {
    return (
      <div className="text-center py-2">
        <h3 className="font-display text-2xl font-extrabold text-[#07111f] tracking-tight">
          Enlace inv&aacute;lido
        </h3>
        <p className="text-sm text-[#64748b] mt-2">
          Este enlace no es v&aacute;lido o le falta informaci&oacute;n. Pide uno nuevo desde el inicio.
        </p>
        <a
          href="/login"
          className="inline-block mt-5 text-sm font-semibold text-[#00a859] hover:text-[#063b22] transition-colors"
        >
          &larr; Volver a iniciar sesi&oacute;n
        </a>
      </div>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash as string,
      type: type as any,
    });

    if (error) {
      setError(
        "Este enlace ya fue usado o expiró. Vuelve a la página de inicio y pide uno nuevo."
      );
      setLoading(false);
      return;
    }

    if (data?.user) {
      const leagueId = process.env.NEXT_PUBLIC_TENANT_ID || null;
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, league_id: leagueId, email: data.user.email },
          { onConflict: "id" }
        );
    }

    router.push("/dashboard");
  }

  return (
    <div className="text-center py-2">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-300/60 flex items-center justify-center shadow-inner">
          <svg
            className="w-10 h-10 text-[#00a859]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <h3 className="font-display text-2xl font-extrabold text-[#07111f] tracking-tight">
        Confirma tu acceso
      </h3>
      <p className="text-sm text-[#64748b] mt-2">
        Da clic abajo para entrar a tu quiniela.
      </p>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-sm mt-4 text-left">
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full mt-6 py-3.5 rounded-xl font-display font-bold text-white text-sm tracking-wide transition-all"
      >
        {loading ? "Entrando..." : "Confirmar y entrar"}
      </button>
    </div>
  );
}
