"use client";

import { useEffect, useState, useCallback } from "react";
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

type Toast = {
  message: string;
  type: "success" | "error";
};

export default function PartidosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });

    setMatches((matchesData as Match[]) ?? []);

    if (user) {
      const { data: predsData } = await supabase
        .from("predictions")
        .select("match_id, pred_home, pred_away, pts_earned, is_locked")
        .eq("user_id", user.id);

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
          pts_earned: 0,
          is_locked: false,
        },
      }));

      showToast("Predicción guardada", "success");
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSubmittingId(null);
    }
  }

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
          ⚽ Partidos del Mundial
        </h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-green-200 text-lg">
              No hay partidos disponibles aún.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
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
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
          <div
            className={`px-5 py-3 rounded-lg shadow-lg font-medium text-sm ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? "✓" : "✕"} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
