"use client";

import { useState } from "react";

interface MatchCardProps {
  match: {
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
  prediction?: {
    pred_home: number;
    pred_away: number;
    pts_earned: number;
    is_locked: boolean;
  };
  onSave: (matchId: string, home: number, away: number) => void;
  isSubmitting?: boolean;
}

function PointsBadge({ pts }: { pts: number }) {
  const config = {
    3: { label: "🏆 3pts — ¡Exacto!", bg: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    2: { label: "✅ 2pts — Resultado", bg: "bg-green-100 text-green-800 border-green-300" },
    1: { label: "👍 1pt — Tendencia", bg: "bg-blue-100 text-blue-800 border-blue-300" },
    0: { label: "❌ 0pts", bg: "bg-gray-100 text-gray-500 border-gray-300" },
  }[pts] ?? { label: `${pts}pts`, bg: "bg-gray-100 text-gray-500 border-gray-300" };

  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg}`}>
      {config.label}
    </span>
  );
}

function formatMatchDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchCard({
  match,
  prediction,
  onSave,
  isSubmitting,
}: MatchCardProps) {
  const [home, setHome] = useState(prediction?.pred_home ?? 0);
  const [away, setAway] = useState(prediction?.pred_away ?? 0);

  const isPast = new Date(match.match_date) < new Date();
  const locked = prediction?.is_locked || isPast;
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  const borderClass = isLive
    ? "border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
    : isFinished
      ? "border-gray-300"
      : "border-green-700/20";

  const bgClass = isFinished ? "bg-gray-50" : "bg-white";

  return (
    <div className={`rounded-2xl border-2 ${borderClass} ${bgClass} overflow-hidden transition-all`}>
      {/* Status bar */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs font-medium ${
        isLive
          ? "bg-green-600 text-white"
          : isFinished
            ? "bg-gray-200 text-gray-600"
            : "bg-green-800 text-green-100"
      }`}>
        <span>{formatMatchDate(match.match_date)}</span>
        <span>
          {isLive && "🔴 En vivo"}
          {isFinished && "Finalizado"}
          {match.status === "scheduled" && "Programado"}
        </span>
      </div>

      {/* Teams + Score */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex-1 text-center">
            <span className="text-3xl block mb-1">{match.home_flag}</span>
            <span className={`text-sm font-semibold block ${isFinished ? "text-gray-600" : "text-gray-900"}`}>
              {match.home_team}
            </span>
          </div>

          {/* Score / Inputs */}
          <div className="flex items-center gap-2">
            {isFinished && match.home_score !== null && match.away_score !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-800 w-10 text-center">
                  {match.home_score}
                </span>
                <span className="text-gray-400 text-lg">-</span>
                <span className="text-2xl font-bold text-gray-800 w-10 text-center">
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-400">vs</span>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 text-center">
            <span className="text-3xl block mb-1">{match.away_flag}</span>
            <span className={`text-sm font-semibold block ${isFinished ? "text-gray-600" : "text-gray-900"}`}>
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Prediction inputs */}
        <div className="mt-5">
          <p className="text-xs text-gray-500 font-medium mb-2 text-center uppercase tracking-wide">
            {locked ? "🔒 Predicción bloqueada" : "Tu predicción"}
          </p>

          <div className="flex items-center justify-center gap-3">
            <input
              type="number"
              min={0}
              value={home}
              onChange={(e) => setHome(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={locked}
              className="w-16 h-12 text-center text-xl font-bold rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900"
            />
            <span className="text-gray-400 font-bold">-</span>
            <input
              type="number"
              min={0}
              value={away}
              onChange={(e) => setAway(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={locked}
              className="w-16 h-12 text-center text-xl font-bold rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-900"
            />
          </div>
        </div>

        {/* Save button or points badge */}
        <div className="mt-4 flex justify-center">
          {isFinished && prediction ? (
            <PointsBadge pts={prediction.pts_earned} />
          ) : !locked ? (
            <button
              onClick={() => onSave(match.id, home, away)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : "Guardar predicción"}
            </button>
          ) : prediction ? (
            <p className="text-sm text-gray-500">
              Predicción: {prediction.pred_home} - {prediction.pred_away}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
