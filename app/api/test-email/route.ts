import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDailyEmailHtml, buildDailyEmailSubject, type RankingEntry, type MatchInfo } from "@/lib/email/templates";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = createAdminClient();
    const now = new Date();

    // Get today's matches
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });

    const todayMX = now.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    const todayMatches: MatchInfo[] = (matches || [])
      .filter((m: any) => {
        const d = new Date(m.match_date).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
        return d === todayMX;
      })
      .map((m: any) => ({
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeFlag: m.home_flag,
        awayFlag: m.away_flag,
        matchDate: m.match_date,
        homeScore: m.home_score,
        awayScore: m.away_score,
        status: m.status,
      }));

    // Get ranking
    const { data: predictions } = await supabase.from("predictions").select("*");
    const { data: matchesAll } = await supabase.from("matches").select("*").eq("status", "finished");

    const scoreMap: Record<string, number> = {};
    for (const match of matchesAll || []) {
      for (const pred of (predictions || []).filter((p: any) => p.match_id === match.id)) {
        if (pred.predicted_home === match.home_score && pred.predicted_away === match.away_score) {
          scoreMap[pred.user_id] = (scoreMap[pred.user_id] || 0) + 3;
        } else if (
          (pred.predicted_home > pred.predicted_away && match.home_score > match.away_score) ||
          (pred.predicted_home < pred.predicted_away && match.home_score < match.away_score) ||
          (pred.predicted_home === pred.predicted_away && match.home_score === match.away_score)
        ) {
          scoreMap[pred.user_id] = (scoreMap[pred.user_id] || 0) + 1;
        }
      }
    }

    const { data: profiles } = await supabase.from("profiles").select("id, display_name, email, avatar_url");
    const ranking: RankingEntry[] = (profiles || [])
      .map((p: any) => ({ userId: p.id, name: p.display_name || p.email || "Usuario", points: scoreMap[p.id] || 0, avatarUrl: p.avatar_url }))
      .sort((a: RankingEntry, b: RankingEntry) => b.points - a.points)
      .map((e: RankingEntry, i: number) => ({ ...e, position: i + 1 }));

    const testEmail = "lilianaferro@gmail.com";
    const testUser = ranking.find((r) => r.name?.toLowerCase().includes("lili")) || ranking[0] || { userId: "test", name: "Lili", points: 0, position: 1 };

    const html = buildDailyEmailHtml({
      userName: testUser.name,
      userPosition: testUser.position || 1,
      userPoints: testUser.points,
      totalParticipants: ranking.length,
      todayMatches,
      topRanking: ranking.slice(0, 10),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://quiniela-mundial-2026.vercel.app",
    });

    const subject = buildDailyEmailSubject({ userPosition: testUser.position || 1, totalParticipants: ranking.length });

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
