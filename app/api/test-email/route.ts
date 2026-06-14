import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyEmailHtml, buildDailyEmailSubject, type RankingEntry, type MatchInfo } from "@/lib/email/templates";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = createAdminClient();
    const now = new Date();
    const todayMX = now.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

    // Get all matches, filter today's
    const { data: allMatches } = await supabase
      .from("matches")
      .select("id, home_team, away_team, home_flag, away_flag, match_date, venue, city, group_name, status, home_score, away_score")
      .order("match_date", { ascending: true });

    const todayRaw = (allMatches || []).filter((m: any) => {
      const d = new Date(m.match_date).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
      return d === todayMX;
    });

    const todayMatches: MatchInfo[] = todayRaw.map((m: any) => ({
      home_team: m.home_team,
      away_team: m.away_team,
      home_flag: m.home_flag,
      away_flag: m.away_flag,
      match_date: m.match_date,
      venue: m.venue ?? null,
      city: m.city ?? null,
      group_name: m.group_name ?? null,
    }));

    // Build ranking from predictions
    const { data: predictions } = await supabase.from("predictions").select("*");
    const finished = (allMatches || []).filter((m: any) => m.status === "finished");

    const scoreMap: Record<string, number> = {};
    const exactMap: Record<string, number> = {};
    for (const match of finished) {
      for (const pred of (predictions || []).filter((p: any) => p.match_id === match.id)) {
        if (pred.predicted_home === match.home_score && pred.predicted_away === match.away_score) {
          scoreMap[pred.user_id] = (scoreMap[pred.user_id] || 0) + 3;
          exactMap[pred.user_id] = (exactMap[pred.user_id] || 0) + 1;
        } else if (
          (pred.predicted_home > pred.predicted_away && match.home_score > match.away_score) ||
          (pred.predicted_home < pred.predicted_away && match.home_score < match.away_score) ||
          (pred.predicted_home === pred.predicted_away && match.home_score === match.away_score)
        ) {
          scoreMap[pred.user_id] = (scoreMap[pred.user_id] || 0) + 1;
        }
      }
    }

    const { data: profiles } = await supabase.from("profiles").select("id, display_name, email");
    const ranking: RankingEntry[] = (profiles || [])
      .map((p: any) => ({
        user_id: p.id,
        display_name: (p.display_name || p.email || "Usuario") as string,
        total_pts: scoreMap[p.id] || 0,
        exact_count: exactMap[p.id] || 0,
        position: 0,
      }))
      .sort((a: RankingEntry, b: RankingEntry) => b.total_pts - a.total_pts)
      .map((e: RankingEntry, i: number) => ({ ...e, position: i + 1 }));

    const testEmail = "lilianaferro@gmail.com";
    const testUser: RankingEntry = ranking.find((r) =>
      r.display_name?.toLowerCase().includes("lili")
    ) ?? ranking[0] ?? { user_id: "test", display_name: "Lili", total_pts: 0, exact_count: 0, position: 1 };

    // Count unvoted today matches
    const todayIds = new Set(todayRaw.map((m: any) => m.id as string));
    const { data: myPreds } = await supabase
      .from("predictions")
      .select("match_id")
      .eq("user_id", testUser.user_id);
    const myPredIds = new Set((myPreds || []).map((p: any) => p.match_id as string));
    const unvotedCount = [...todayIds].filter((id) => !myPredIds.has(id)).length;

    const html = buildDailyEmailHtml({
      userName: testUser.display_name || "Jugador",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://quiniela-mundial-2026-alpha.vercel.app",
      ranking,
      todayMatches,
      userId: testUser.user_id,
      userPosition: testUser.position,
      userPoints: testUser.total_pts,
      unvotedCount,
    });

    const subject = buildDailyEmailSubject({
      todayMatchCount: todayMatches.length,
      unvotedCount,
    });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [testEmail],
      subject: `[TEST] ${subject}`,
      html,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true, sentTo: testEmail, matches: todayMatches.length, participants: ranking.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
        }
