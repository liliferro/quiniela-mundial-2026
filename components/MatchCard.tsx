"use client";

import { useEffect, useState } from "react";

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
    group_name?: string | null;
    venue?: string | null;
    city?: string | null;
    country?: string | null;
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

function formatDay(iso: string) {
  const raw = new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

function StatusBadge({
  state,
}: {
  state: "scheduled" | "saved" | "closed" | "live";
}) {
  const map = {
    scheduled: { label: "Programado", cls: "bg-sky-100 text-sky-800" },
    saved: { label: "Predicción guardada", cls: "bg-emerald-100 text-emerald-800" },
    closed: { label: "Cerrado", cls: "bg-red-100 text-red-800" },
    live: { label: "EN VIVO", cls: "bg-red-500 text-white" },
  } as const;
  const c = map[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full ${c.cls}`}
    >
      {state === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
      )}
      {c.label}
    </span>
  );
}

function TeamColumn({
  code,
  name,
  align,
}: {
  code: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col items-center sm:items-${align === "left" ? "start" : "end"} gap-2`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#063b22] to-[#0a6b3a] text-white font-display font-bold text-sm flex items-center justify-center shadow-md ring-2 ring-white/60">
        {code}
      </div>
      <div
        className={`text-center sm:text-${align === "left" ? "left" : "right"}`}
      >
        <div className="font-display text-xl sm:text-2xl font-extrabold text-[#07111f] leading-none tracking-tight">
          {code}
        </div>
        <div className="text-[11px] sm:text-xs text-[#64748b] font-medium mt-0.5 max-w-[100px] truncate">
          {name}
        </div>
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className="no-spin w-[68px] h-16 sm:w-[72px] sm:h-[64px] rounded-2xl bg-[#f8fafc] border-2 border-[#e2e8f0] text-center font-display font-extrabold text-3xl text-[#07111f] outline-none transition-all focus:border-[#00a859] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,168,89,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

export default function MatchCard({
  match,
  prediction,
  onSave,
  isSubmitting,
}: MatchCardProps) {
  const [home, setHome] = useState(prediction?.pred_home ?? 0);
  const [away, setAway] = useState(prediction?.pred_away ?? 0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setHome(prediction?.pred_home ?? 0);
    setAway(prediction?.pred_away ?? 0);
    setDirty(false);
  }, [prediction?.pred_home, prediction?.pred_away]);

  const isPast = new Date(match.match_date) < new Date();
  const locked = prediction?.is_locked || isPast;
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasPrediction = !!prediction;

  const state: "scheduled" | "saved" | "closed" | "live" = isLive
    ? "live"
    : isFinished || locked
      ? "closed"
      : hasPrediction
        ? "saved"
        : "scheduled";

  function handleHome(n: number) {
    setHome(n);
    setDirty(true);
  }
  function handleAway(n: number) {
    setAway(n);
    setDirty(true);
  }

  const buttonLabel = isSubmitting
    ? "Guardando..."
    : hasPrediction
      ? dirty
        ? "Actualizar predicción"
        : "Predicción guardada"
      : "Guardar predicción";

  const buttonDisabled = isSubmitting || locked || (hasPrediction && !dirty);

  return (
    <article className="w-full max-w-[820px] mx-auto rounded-3xl bg-white border border-[#e2e8f0] p-5 sm:p-6 shadow-[0_18px_45px_rgba(7,17,31,0.14)] transition-shadow hover:shadow-[0_22px_55px_rgba(7,17,31,0.18)]">
      {/* Top row: date/venue + status */}
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-[#64748b] font-medium">
            <span>{formatDay(match.match_date)}</span>
            <span className="mx-1.5 text-[#cbd5e1]">·</span>
            <span>{formatTime(match.match_date)}</span>
          </div>
          {(match.venue || match.city) && (
            <div className="text-[12px] text-[#94a3b8] mt-0.5 truncate">
              {match.venue}
              {match.venue && (match.city || match.country) && (
                <span className="mx-1 text-[#cbd5e1]">·</span>
              )}
              {match.city}
              {match.city && match.country ? ", " : ""}
              {match.country}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {match.group_name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] text-[10px] font-bold uppercase tracking-wider">
              Grupo {match.group_name}
            </span>
          )}
          <StatusBadge state={state} />
        </div>
      </header>

      {/* Teams + scoreboard */}
      <div className="grid grid-cols-3 items-center gap-3 sm:gap-6">
        <TeamColumn
          code={match.home_flag}
          name={match.home_team}
          align="right"
        />

        {/* Scoreboard center */}
        <div className="flex flex-col items-center gap-2">
          {isFinished && match.home_score !== null && match.away_score !== null ? (
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-3xl text-[#07111f]">
                {match.home_score}
              </span>
              <span className="font-display text-xl text-[#64748b]">-</span>
              <span className="font-display font-extrabold text-3xl text-[#07111f]">
                {match.away_score}
              </span>
            </div>
          ) : (
            <span className="font-display font-bold text-sm tracking-[0.18em] text-[#64748b]">
              VS
            </span>
          )}
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
            {locked ? "Tu predicción" : "Predicción"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <ScoreInput value={home} onChange={handleHome} disabled={locked} />
            <span className="font-display font-extrabold text-2xl text-[#cbd5e1]">
              :
            </span>
            <ScoreInput value={away} onChange={handleAway} disabled={locked} />
          </div>
        </div>

        <TeamColumn
          code={match.away_flag}
          name={match.away_team}
          align="left"
        />
      </div>

      {/* Action / status feedback */}
      <div className="mt-6">
        {isFinished && prediction ? (
          <PointsBadge pts={prediction.pts_earned} />
        ) : locked ? (
          <div className="w-full text-center text-sm text-[#64748b] font-medium py-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            🔒 Predicciones cerradas para este partido
          </div>
        ) : (
          <button
            onClick={() => {
              onSave(match.id, home, away);
              setDirty(false);
            }}
            disabled={buttonDisabled}
            className={`w-full sm:w-auto sm:min-w-[260px] sm:mx-auto sm:flex sm:justify-center px-6 py-3 rounded-xl font-display font-bold text-white text-sm tracking-wide transition-all
              ${
                buttonDisabled
                  ? "bg-[#cbd5e1] cursor-not-allowed"
                  : "bg-gradient-to-br from-[#00a859] to-[#007a3d] shadow-[0_8px_20px_rgba(0,168,89,0.28)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,168,89,0.38)] cursor-pointer"
              }`}
          >
            {hasPrediction && !dirty && (
              <span className="inline-block mr-2">✓</span>
            )}
            {buttonLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function PointsBadge({ pts }: { pts: number }) {
  const map = {
    3: { label: "Marcador exacto", emoji: "🎯", cls: "bg-[#fef9c3] text-[#854d0e] border-[#fde68a]" },
    2: { label: "Resultado correcto", emoji: "✅", cls: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]" },
    1: { label: "Tendencia acertada", emoji: "👍", cls: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]" },
    0: { label: "Sin acierto", emoji: "❌", cls: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]" },
  }[pts] ?? { label: `${pts} pts`, emoji: "•", cls: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${map.cls}`}>
      <span className="font-medium text-sm">
        {map.emoji} {map.label}
      </span>
      <span className="font-display font-extrabold text-lg">+{pts} pts</span>
    </div>
  );
}
