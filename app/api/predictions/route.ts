import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { match_id, pred_home, pred_away, league_id } = body;
  const validLeagueId = league_id && typeof league_id === "string" && league_id !== "default"
    ? league_id
    : null;

  if (!match_id || pred_home == null || pred_away == null) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  if (pred_home < 0 || pred_away < 0) {
    return NextResponse.json(
      { error: "Los marcadores no pueden ser negativos" },
      { status: 400 }
    );
  }

  // Check if prediction is locked
  const { data: existing } = await supabase
    .from("predictions")
    .select("is_locked")
    .eq("user_id", user.id)
    .eq("match_id", match_id)
    .is("league_id", validLeagueId)
    .maybeSingle();

  if (existing?.is_locked) {
    return NextResponse.json(
      { error: "La predicción está bloqueada" },
      { status: 403 }
    );
  }

  // Check if match has already started
  const { data: match } = await supabase
    .from("matches")
    .select("match_date, status")
    .eq("id", match_id)
    .single();

  if (!match) {
    return NextResponse.json(
      { error: "Partido no encontrado" },
      { status: 404 }
    );
  }

  if (match.status !== "scheduled") {
    return NextResponse.json(
      { error: "El partido ya comenzó o finalizó" },
      { status: 403 }
    );
  }

  if (new Date(match.match_date) < new Date()) {
    return NextResponse.json(
      { error: "El partido ya comenzó" },
      { status: 403 }
    );
  }

  // Upsert prediction
  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id,
        league_id: validLeagueId,
        pred_home,
        pred_away,
      },
      { onConflict: "user_id,match_id,league_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prediction: data });
}
