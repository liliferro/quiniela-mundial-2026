"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import MatchCard from "@/components/MatchCard";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  status: "scheduled" | "live" | "finished";
  home_score: number | null;
  away_score: number | null;
};

type Prediction = {
  pred_home: number;
  pred_away: number;
  pts_earned: number;
  is_locked: boolean;
};

type Toast = { message: string; type: "success" | "error" };

type RankingRow = {
  total_pts: number;
  position: number;
  exact_count: number;
};

type FilterId =
  | "all"
  | "today"
  | "upcoming"
  | "missing"
  | "predicted";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "today", label: "Hoy" },
  { id: "upcoming", label: "Próximos" },
  { id: "missing", label: "Sin predecir" },
  { id: "predicted", label: "Predichos" },
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function userInitial(name: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

export default function PartidosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [userName, setUserName] = useState<string>("");
  const [ranking, setRanking] = useState<RankingRow | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserName(
        (user.user_metadata?.full_name as string) ??
          user.email ??
          "Jugador"
      );
    }

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });

    setMatches((matchesData as Match[]) ?? []);

    if (user) {
      const [{ data: predsData }, { data: rankRow }] = await Promise.all([
        supabase
          .from("predictions")
          .select("match_id, pred_home, pred_away, pts_earned, is_locked")
          .eq("user_id", user.id),
        supabase
          .from("league_rankings")
          .select("total_pts, position, exact_count")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const predsMap: Record<string, Prediction> = {};
      predsData?.forEach((p) => {
        predsMap[p.match_id] = {
          pred_home: p.pred_home,
          pred_away: p.pred_away,
          pts_earned: p.pts_earned,
          is_locked: p.is_locked,
        };
      });
      setPredictions(predsMap);
      setRanking((rankRow as RankingRow) ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave(matchId: string, home: number, away: number) {
    setSubmittingId(matchId);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          pred_home: home,
          pred_away: away,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al guardar", "error");
        return;
      }
      setPredictions((prev) => ({
        ...prev,
        [matchId]: {
          pred_home: home,
          pred_away: away,
          pts_earned: prev[matchId]?.pts_earned ?? 0,
          is_locked: prev[matchId]?.is_locked ?? false,
        },
      }));
      showToast("Predicción guardada", "success");
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSubmittingId(null);
    }
  }

  const stats = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter((m) => predictions[m.id]).length;
    const localPoints = Object.values(predictions).reduce(
      (sum, p) => sum + (p.pts_earned ?? 0),
      0
    );
    const points = ranking?.total_pts ?? localPoints;
    const position = ranking?.position ?? null;
    const pending = total - completed;
    return { total, completed, points, pending, position };
  }, [matches, predictions, ranking]);

  const positionLabel = stats.position ? `#${stats.position}` : "#—";

  const filteredMatches = useMemo(() => {
    const now = new Date();
    return matches.filter((m) => {
      const d = new Date(m.match_date);
      switch (filter) {
        case "today":
          return isSameDay(d, now);
        case "upcoming":
          return d >= now && m.status === "scheduled";
        case "missing":
          return !predictions[m.id] && m.status === "scheduled" && d >= now;
        case "predicted":
          return !!predictions[m.id];
        default:
          return true;
      }
    });
  }, [matches, predictions, filter]);

  const progressPct =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="min-h-screen stadium-bg">
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a859] to-[#007a3d] flex items-center justify-center font-display font-extrabold text-white shadow-lg shadow-emerald-500/20">
              Q
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-base font-bold text-white leading-tight">
                Quiniela Mundial 2026
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">
                Fase de grupos
              </span>
            </div>
            <span className="sm:hidden inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              Fase de grupos
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              ← Dashboard
            </a>
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-[#f5c542] font-display font-bold text-sm">
                  {stats.points}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                  pts
                </span>
              </div>
              <span className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5">
                <span className="text-white font-display font-bold text-sm">
                  {positionLabel}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                  ranking
                </span>
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0057ff] to-[#0036a8] flex items-center justify-center font-display font-bold text-white text-sm ring-2 ring-white/20"
              title={userName}
            >
              {userInitial(userName)}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-0 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero / Progress */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full bg-[#0057ff]/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-[#f5c542] mb-3">
                Match prediction hub
              </span>
              <h2 className="font-display text-3xl sm:text-[32px] font-extrabold text-white leading-tight tracking-tight">
                Predice los partidos de la fase de grupos
              </h2>
              <p className="text-sm sm:text-base text-white/70 mt-2">
                Completa tus marcadores antes del inicio de cada partido. Cuanto
                más cerca del marcador real, más puntos ganas.
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-white/70 font-medium mb-2">
                  <span>
                    {stats.completed} de {stats.total} predicciones completadas
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
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
              <StatCard
                label="Puntos"
                value={stats.points.toString()}
                accent="gold"
              />
              <StatCard label="Ranking" value={positionLabel} accent="blue" />
              <StatCard
                label="Pendientes"
                value={stats.pending.toString()}
                accent="green"
              />
            </div>
          </div>
        </section>

        {/* Filters */}
        <nav className="mt-6 sm:mt-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="pretty-scroll flex items-center gap-2 overflow-x-auto pb-2">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border
                    ${
                      active
                        ? "bg-white text-[#07111f] border-white shadow-lg shadow-black/20"
                        : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* List */}
        <section className="mt-6 sm:mt-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-white/15 bg-white/5">
              <p className="font-display text-lg text-white font-bold">
                Nada por aquí
              </p>
              <p className="text-sm text-white/60 mt-1">
                No hay partidos para este filtro.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={handleSave}
                  isSubmitting={submittingId === match.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-5 py-3 rounded-xl shadow-2xl font-display font-bold text-sm
              ${
                toast.type === "success"
                  ? "bg-gradient-to-br from-[#00a859] to-[#007a3d] text-white"
                  : "bg-[#ef4444] text-white"
              }`}
          >
            {toast.type === "success" ? "✓" : "✕"} {toast.message}
          </div>
        </div>
      )}
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
  accent: "gold" | "blue" | "green";
}) {
  const accentMap = {
    gold: "text-[#f5c542]",
    blue: "text-[#7aa6ff]",
    green: "text-[#22d3a4]",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-3 sm:p-4">
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
