"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "@/components/AppHeader";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  status: "scheduled" | "live" | "finished";
  group_name: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
};

function formatDay(iso: string) {
  const raw = new Date(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "¡Empieza pronto!";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DashboardPage() {
  const [name, setName] = useState("Jugador");
  const [points, setPoints] = useState(0);
  const [position, setPosition] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [hasPredictionForNext, setHasPredictionForNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setName(
        (user.user_metadata?.full_name as string) ?? user.email ?? "Jugador"
      );

      const [
        { data: matches },
        { data: preds },
        { data: rank },
      ] = await Promise.all([
        supabase
          .from("matches")
          .select("*")
          .order("match_date", { ascending: true }),
        supabase
          .from("predictions")
          .select("match_id")
          .eq("user_id", user.id),
        supabase
          .from("league_rankings")
          .select("total_pts, position")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const all = (matches as Match[]) ?? [];
      setTotal(all.length);
      setCompleted(preds?.length ?? 0);
      setPoints(rank?.total_pts ?? 0);
      setPosition(rank?.position ?? null);

      const next = all.find(
        (m) => new Date(m.match_date).getTime() > Date.now() && m.status === "scheduled"
      );
      setNextMatch(next ?? null);
      if (next && preds) {
        setHasPredictionForNext(preds.some((p) => p.match_id === next.id));
      }

      setLoading(false);
    })();
  }, []);

  const progressPct = useMemo(
    () => (total === 0 ? 0 : Math.round((completed / total) * 100)),
    [completed, total]
  );

  const countdown = useMemo(() => {
    if (!nextMatch) return "";
    return formatCountdown(new Date(nextMatch.match_date).getTime() - now);
  }, [nextMatch, now]);

  return (
    <div className="min-h-screen stadium-bg">
      <AppHeader active="dashboard" />

      <main className="relative z-0 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Welcome hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full bg-[#0057ff]/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-[#f5c542] mb-3">
                Tu cancha
              </span>
              <h2 className="font-display text-3xl sm:text-[34px] font-extrabold text-white leading-tight tracking-tight">
                ¡Hola, {name.split(" ")[0]}!
              </h2>
              <p className="text-sm sm:text-base text-white/70 mt-2">
                Aquí tienes el resumen de tu participación. Mantén tus
                marcadores al día y escala posiciones en el ranking.
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/70 font-medium mb-2">
                  <span>
                    {completed} de {total} predicciones
                  </span>
                  <span className="font-display font-bold text-white">
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00a859] via-[#22d3a4] to-[#f5c542] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/partidos"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-display font-bold text-sm text-white bg-gradient-to-br from-[#00a859] to-[#007a3d] shadow-[0_8px_20px_rgba(0,168,89,0.28)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,168,89,0.38)] transition-all"
                >
                  ⚽ Hacer predicciones
                </Link>
                <Link
                  href="/ranking"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-display font-bold text-sm text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
                >
                  🏅 Ver ranking
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
              <StatCard
                label="Puntos"
                value={points.toString()}
                accent="gold"
              />
              <StatCard
                label="Ranking"
                value={position ? `#${position}` : "#—"}
                accent="blue"
              />
              <StatCard
                label="Predicciones"
                value={`${completed}/${total}`}
                accent="green"
              />
              <StatCard
                label="Pendientes"
                value={(total - completed).toString()}
                accent="white"
              />
            </div>
          </div>
        </section>

        {/* Next match */}
        <section>
          <div className="flex items-end justify-between mb-3 sm:mb-4">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Próximo partido
            </h3>
            <Link
              href="/partidos"
              className="text-sm text-emerald-300/90 hover:text-emerald-200 font-semibold"
            >
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="h-[180px] rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
          ) : !nextMatch ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
              <p className="font-display text-lg text-white font-bold">
                No hay próximos partidos
              </p>
              <p className="text-sm text-white/60 mt-1">
                Vuelve más tarde para ver el siguiente encuentro.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl bg-white border border-[#e2e8f0] p-5 sm:p-6 shadow-[0_18px_45px_rgba(7,17,31,0.18)]">
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex items-start justify-between gap-3 mb-5">
                <div>
                  <div className="text-[13px] text-[#0f172a] font-semibold">
                    <span>{formatDay(nextMatch.match_date)}</span>
                    <span className="mx-1.5 text-[#cbd5e1]">·</span>
                    <span>{formatTime(nextMatch.match_date)}</span>
                  </div>
                  {nextMatch.venue && (
                    <div className="flex items-center gap-1.5 text-[12.5px] text-[#475569] mt-1 font-medium">
                      <svg
                        className="w-3.5 h-3.5 shrink-0 text-[#00a859]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                      </svg>
                      <span className="truncate">
                        <span className="text-[#0f172a] font-semibold">
                          {nextMatch.venue}
                        </span>
                        {(nextMatch.city || nextMatch.country) && (
                          <span className="text-[#64748b]">
                            {" · "}
                            {nextMatch.city}
                            {nextMatch.city && nextMatch.country ? ", " : ""}
                            {nextMatch.country}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {nextMatch.group_name && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-br from-[#f5c542] to-[#e0a921] text-[#3d2300] text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-[0_4px_12px_rgba(245,197,66,0.35)]">
                      Grupo {nextMatch.group_name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dbeafe] text-[#1e40af] text-[11px] font-bold uppercase tracking-wide">
                    Empieza en {countdown}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-3 sm:gap-6 py-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#063b22] to-[#0a6b3a] text-white font-display font-bold text-base flex items-center justify-center shadow-md ring-2 ring-white/60">
                    {nextMatch.home_flag}
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl font-extrabold text-[#07111f] leading-none tracking-tight">
                      {nextMatch.home_flag}
                    </div>
                    <div className="text-xs text-[#64748b] font-medium mt-0.5">
                      {nextMatch.home_team}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <span className="font-display font-bold text-sm tracking-[0.18em] text-[#64748b]">
                    VS
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#063b22] to-[#0a6b3a] text-white font-display font-bold text-base flex items-center justify-center shadow-md ring-2 ring-white/60">
                    {nextMatch.away_flag}
                  </div>
                  <div className="text-center">
                    <div className="font-display text-2xl font-extrabold text-[#07111f] leading-none tracking-tight">
                      {nextMatch.away_flag}
                    </div>
                    <div className="text-xs text-[#64748b] font-medium mt-0.5">
                      {nextMatch.away_team}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/partidos"
                className={`mt-5 w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-display font-bold text-white text-sm tracking-wide transition-all
                  ${
                    hasPredictionForNext
                      ? "bg-white text-[#07111f] border border-[#e2e8f0] hover:bg-[#f8fafc]"
                      : "bg-gradient-to-br from-[#00a859] to-[#007a3d] shadow-[0_8px_20px_rgba(0,168,89,0.28)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,168,89,0.38)]"
                  }`}
              >
                {hasPredictionForNext
                  ? "✓ Predicción guardada · Editar"
                  : "Hacer mi predicción →"}
              </Link>
            </div>
          )}
        </section>

        {/* Tips */}
        <section className="grid sm:grid-cols-3 gap-4">
          <TipCard
            emoji="🎯"
            title="3 puntos"
            description="Marcador exacto"
          />
          <TipCard
            emoji="✅"
            title="2 puntos"
            description="Resultado correcto (gana, pierde o empata)"
          />
          <TipCard
            emoji="👍"
            title="1 punto"
            description="Tendencia acertada"
          />
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "gold" | "blue" | "green" | "white";
}) {
  const accentMap = {
    gold: "text-[#f5c542]",
    blue: "text-[#7aa6ff]",
    green: "text-[#22d3a4]",
    white: "text-white",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-4">
      <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div
        className={`font-display font-extrabold text-2xl sm:text-3xl mt-1 leading-none ${accentMap[accent]}`}
      >
        {value}
      </div>
    </div>
  );
}

function TipCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 flex items-start gap-3">
      <div className="text-2xl shrink-0">{emoji}</div>
      <div>
        <div className="font-display font-bold text-white text-base">
          {title}
        </div>
        <div className="text-sm text-white/60 mt-0.5">{description}</div>
      </div>
    </div>
  );
}
