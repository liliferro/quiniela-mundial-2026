import { createClient } from "@/lib/supabase/server";

type RankingEntry = {
  user_id: string;
  display_name: string;
  total_pts: number;
  exact_count: number;
  position: number;
};

function PositionBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-2xl">🥇</span>;
  if (pos === 2) return <span className="text-2xl">🥈</span>;
  if (pos === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-800/50 text-white text-sm font-bold">
      {pos}
    </span>
  );
}

export default async function RankingPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("league_rankings")
    .select("*")
    .order("position");

  const ranking = (data as RankingEntry[]) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900">
      <header className="bg-green-900/50 border-b border-green-600/30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Quiniela Mundial 2026 🏆
          </h1>
          <a
            href="/dashboard"
            className="text-sm text-green-200 hover:text-white transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          🏅 Ranking
        </h2>

        {ranking.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-green-500/20 text-center">
            <p className="text-green-200 text-lg">
              Aún no hay predicciones.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[60px_1fr_80px_80px] bg-green-800 text-white text-xs font-semibold uppercase tracking-wider">
              <div className="px-4 py-3 text-center">#</div>
              <div className="px-4 py-3">Jugador</div>
              <div className="px-4 py-3 text-center">Puntos</div>
              <div className="px-4 py-3 text-center">🎯</div>
            </div>

            {/* Rows */}
            {ranking.map((entry) => {
              const isTop3 = entry.position <= 3;

              return (
                <div
                  key={entry.user_id}
                  className={`grid grid-cols-[60px_1fr_80px_80px] items-center border-b border-gray-100 last:border-b-0 transition-colors ${
                    isTop3
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="px-4 py-4 flex justify-center">
                    <PositionBadge pos={entry.position} />
                  </div>

                  <div className="px-4 py-4">
                    <span
                      className={`font-semibold ${
                        isTop3 ? "text-green-900" : "text-gray-800"
                      }`}
                    >
                      {entry.display_name}
                    </span>
                  </div>

                  <div className="px-4 py-4 text-center">
                    <span
                      className={`text-lg font-bold ${
                        isTop3 ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      {entry.total_pts}
                    </span>
                  </div>

                  <div className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                      🏆 {entry.exact_count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {ranking.length > 0 && (
          <p className="text-green-300/60 text-xs text-center mt-4">
            🎯 = aciertos exactos
          </p>
        )}
      </main>
    </div>
  );
}
