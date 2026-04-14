import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email ?? "Jugador";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900">
      <header className="bg-green-900/50 border-b border-green-600/30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Quiniela Mundial 2026 🏆
          </h1>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-green-200 hover:text-white transition-colors cursor-pointer"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Bienvenido, {displayName}!
          </h2>
          <p className="text-green-200">
            Prepárate para predecir los resultados del Mundial 2026.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/partidos"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
            >
              ⚽ Ver partidos
            </a>
            <a
              href="/ranking"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
            >
              🏅 Ver ranking
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
