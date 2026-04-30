import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";

type RankingEntry = {
  user_id: string;
  display_name: string | null;
  total_pts: number;
  exact_count: number;
  position: number;
};

const DEMO_RANKING: RankingEntry[] = [
  { user_id: "demo-1",  display_name: "Carlos Mendoza",    total_pts: 47, exact_count: 3, position: 1 },
  { user_id: "demo-2",  display_name: "Ana Sofía Reyes",   total_pts: 43, exact_count: 2, position: 2 },
  { user_id: "demo-3",  display_name: "Roberto Torres",    total_pts: 41, exact_count: 2, position: 3 },
  { user_id: "demo-4",  display_name: "María José López",  total_pts: 38, exact_count: 2, position: 4 },
  { user_id: "demo-5",  display_name: "Diego Álvarez",     total_pts: 36, exact_count: 1, position: 5 },
  { user_id: "demo-6",  display_name: "Valentina Gómez",   total_pts: 33, exact_count: 1, position: 6 },
  { user_id: "demo-7",  display_name: "Andrés Peña",       total_pts: 31, exact_count: 1, position: 7 },
  { user_id: "demo-8",  display_name: "Lucía Fernández",   total_pts: 28, exact_count: 1, position: 8 },
  { user_id: "demo-9",  display_name: "Mateo Hernández",   total_pts: 26, exact_count: 0, position: 9 },
  { user_id: "demo-10", display_name: "Camila Vargas",     total_pts: 24, exact_count: 0, position: 10 },
  { user_id: "demo-11", display_name: "Sebastián Castro",  total_pts: 21, exact_count: 0, position: 11 },
  { user_id: "demo-12", display_name: "Renata Bravo",      total_pts: 19, exact_count: 0, position: 12 },
];

function initialOf(name: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

export default async function RankingPage() {
  const supabase = await createClient();

  const [{ data: { user } }, { data }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("league_rankings").select("*").order("position"),
  ]);

  const realRanking = (data as RankingEntry[]) ?? [];
  // Demo mode: no real points have been awarded yet (all entries are 0 pts, or list is empty)
  const isDemo = !realRanking.some((r) => r.total_pts > 0);
  const ranking = isDemo ? DEMO_RANKING : realRanking;
  const meId = user?.id ?? "";
  const me = !isDemo ? realRanking.find((r) => r.user_id === meId) ?? null : null;

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="min-h-screen stadium-bg">
      <AppHeader active="ranking" />

      <main className="relative z-0 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[#f5c542]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-[#f5c542] mb-3">
                Leaderboard
              </span>
              <h2 className="font-display text-3xl sm:text-[34px] font-extrabold text-white leading-tight tracking-tight">
                Tabla de posiciones
              </h2>
              <p className="text-sm sm:text-base text-white/70 mt-2">
                {isDemo
                  ? "Vista previa de cómo lucirá la tabla durante el Mundial. Las posiciones reales se contarán cuando ruede el balón."
                  : `${realRanking.length} ${realRanking.length === 1 ? "jugador compitiendo" : "jugadores compitiendo"} por la corona del Mundial 2026.`}
              </p>
            </div>

            {me && (
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-4 sm:p-5 lg:min-w-[280px]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Tu posición
                </div>
                <div className="flex items-end justify-between mt-1.5">
                  <div className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-none">
                    #{me.position}
                  </div>
                  <div className="text-right">
                    <div className="font-display font-extrabold text-2xl text-[#f5c542] leading-none">
                      {me.total_pts}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold mt-1">
                      pts · 🎯 {me.exact_count}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Demo banner */}
        {isDemo && (
          <div className="rounded-2xl border border-[#f5c542]/30 bg-[#f5c542]/10 backdrop-blur-sm px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-3">
            <span className="text-xl shrink-0 leading-none">📋</span>
            <div className="text-sm text-white">
              <span className="font-display font-bold">Datos de ejemplo.</span>{" "}
              <span className="text-white/75">
                Estos jugadores son ficticios para mostrar cómo se verá la tabla.
                El ranking real empezará a contarse cuando finalicen los primeros
                partidos del Mundial.{" "}
              </span>
              <Link
                href="/partidos"
                className="font-semibold text-[#f5c542] hover:underline whitespace-nowrap"
              >
                Mientras tanto, predice →
              </Link>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <>
            {/* Podium */}
            {top3.length > 0 && (
              <section>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
                  Podio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Layout: en sm+, 2do va a la izquierda, 1ro centro elevado, 3ro derecha */}
                  {top3[1] && (
                    <PodiumCard
                      entry={top3[1]}
                      rank={2}
                      isMe={top3[1].user_id === meId}
                    />
                  )}
                  {top3[0] && (
                    <PodiumCard
                      entry={top3[0]}
                      rank={1}
                      isMe={top3[0].user_id === meId}
                    />
                  )}
                  {top3[2] && (
                    <PodiumCard
                      entry={top3[2]}
                      rank={3}
                      isMe={top3[2].user_id === meId}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <section>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
                  Tabla completa
                </h3>
                <div className="rounded-3xl bg-white border border-[#e2e8f0] shadow-[0_18px_45px_rgba(7,17,31,0.18)] overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[80px_1fr_120px_100px] bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748b] text-center">
                      Pos.
                    </div>
                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                      Jugador
                    </div>
                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748b] text-center">
                      Puntos
                    </div>
                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748b] text-center">
                      Exactos
                    </div>
                  </div>

                  {rest.map((entry) => {
                    const isMe = entry.user_id === meId;
                    return (
                      <div
                        key={entry.user_id}
                        className={`grid sm:grid-cols-[80px_1fr_120px_100px] items-center border-b border-[#f1f5f9] last:border-0 transition-colors ${
                          isMe
                            ? "bg-[#f0fdf4] ring-1 ring-inset ring-[#00a859]/30"
                            : "bg-white hover:bg-[#fafbfc]"
                        }`}
                      >
                        <div className="px-4 py-3 sm:py-4 flex items-center gap-3 sm:block sm:text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-full text-sm font-display font-bold ${
                              isMe
                                ? "bg-[#00a859] text-white"
                                : "bg-[#f1f5f9] text-[#475569]"
                            }`}
                          >
                            {entry.position}
                          </span>
                          <span className="sm:hidden font-semibold text-[#0f172a]">
                            {entry.display_name ?? "Jugador"}
                            {isMe && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#00a859]">
                                tú
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 px-4 py-4">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0057ff] to-[#0036a8] flex items-center justify-center font-display font-bold text-white text-sm">
                            {initialOf(entry.display_name)}
                          </div>
                          <span
                            className={`font-semibold ${isMe ? "text-[#063b22]" : "text-[#0f172a]"}`}
                          >
                            {entry.display_name ?? "Jugador"}
                            {isMe && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#00a859]">
                                tú
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="px-4 pb-3 sm:py-4 sm:text-center flex items-center gap-2 sm:block">
                          <span className="sm:hidden text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">
                            Pts
                          </span>
                          <span className="font-display font-extrabold text-lg text-[#063b22]">
                            {entry.total_pts}
                          </span>
                        </div>

                        <div className="px-4 pb-3 sm:py-4 sm:text-center flex items-center gap-2 sm:block">
                          <span className="sm:hidden text-[11px] uppercase tracking-wider text-[#64748b] font-semibold">
                            Exactos
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef9c3] text-[#854d0e] text-xs font-bold">
                            🎯 {entry.exact_count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <p className="text-xs text-white/50 text-center pt-2">
              🎯 Marcador exacto · Las posiciones se actualizan al cierre de cada partido
            </p>
        </>
      </main>
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
  isMe,
}: {
  entry: RankingEntry;
  rank: 1 | 2 | 3;
  isMe: boolean;
}) {
  const themes = {
    1: {
      medal: "🥇",
      bgGradient: "from-[#fde68a] to-[#f5c542]",
      ringColor: "ring-[#f5c542]",
      offset: "sm:-translate-y-3",
      labelColor: "text-[#7a4f00]",
    },
    2: {
      medal: "🥈",
      bgGradient: "from-[#f1f5f9] to-[#cbd5e1]",
      ringColor: "ring-[#cbd5e1]",
      offset: "",
      labelColor: "text-[#334155]",
    },
    3: {
      medal: "🥉",
      bgGradient: "from-[#fed7aa] to-[#f97316]",
      ringColor: "ring-[#fb923c]",
      offset: "",
      labelColor: "text-[#7c2d12]",
    },
  } as const;
  const t = themes[rank];

  return (
    <div
      className={`relative ${t.offset} rounded-3xl bg-white border border-[#e2e8f0] p-5 sm:p-6 shadow-[0_18px_45px_rgba(7,17,31,0.18)] ${
        isMe ? `ring-2 ${t.ringColor}` : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl sm:text-4xl">{t.medal}</div>
        <span
          className={`inline-block px-2 py-0.5 rounded-full bg-gradient-to-br ${t.bgGradient} text-[10px] font-extrabold uppercase tracking-[0.12em] ${t.labelColor}`}
        >
          #{rank}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0057ff] to-[#0036a8] flex items-center justify-center font-display font-bold text-white">
          {initialOf(entry.display_name)}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-[#0f172a] truncate">
            {entry.display_name ?? "Jugador"}
            {isMe && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#00a859]">
                tú
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#64748b]">
            Posición #{entry.position}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between pt-3 border-t border-[#f1f5f9]">
        <div>
          <div className="font-display font-extrabold text-3xl text-[#063b22] leading-none">
            {entry.total_pts}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#64748b] font-semibold mt-1">
            puntos
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef9c3] text-[#854d0e] text-xs font-bold">
          🎯 {entry.exact_count}
        </span>
      </div>
    </div>
  );
}
