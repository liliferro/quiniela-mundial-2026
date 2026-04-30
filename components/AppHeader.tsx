"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Active = "dashboard" | "partidos" | "ranking";

const NAV: { id: Active; label: string; href: string }[] = [
  { id: "dashboard", label: "Inicio", href: "/dashboard" },
  { id: "partidos", label: "Partidos", href: "/partidos" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
];

export default function AppHeader({ active }: { active: Active }) {
  const [points, setPoints] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const display =
        (user.user_metadata?.full_name as string) ??
        user.email ??
        "Jugador";
      setName(display);

      const { data } = await supabase
        .from("league_rankings")
        .select("total_pts, position")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPoints(data.total_pts);
        setPosition(data.position);
      } else {
        setPoints(0);
      }
    })();
  }, []);

  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  const positionLabel = position ? `#${position}` : "#—";

  return (
    <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/15 sticky top-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
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
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                active === n.id
                  ? "bg-white text-[#07111f] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Stats chip */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="text-[#f5c542] font-display font-bold text-sm">
                {points ?? "—"}
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

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0057ff] to-[#0036a8] flex items-center justify-center font-display font-bold text-white text-sm ring-2 ring-white/20"
            title={name}
          >
            {initial}
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="md:hidden border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-2 pretty-scroll overflow-x-auto flex items-center gap-1.5">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                active === n.id
                  ? "bg-white text-[#07111f] shadow"
                  : "text-white/70 hover:text-white bg-white/5"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
