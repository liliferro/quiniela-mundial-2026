import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    buildDailyEmailHtml,
    buildDailyEmailSubject,
    type RankingEntry,
    type MatchInfo,
} from "@/lib/email/templates";

function isSameDayMX(isoDate: string, now: Date): boolean {
    const match = new Date(isoDate).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    const today = now.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    return match === today;
}

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quiniela-mundial-2026-alpha.vercel.app";
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Quiniela Mundial 2026";

  if (!resendKey || !fromEmail) {
        return NextResponse.json({ error: "RESEND_API_KEY o RESEND_FROM_EMAIL no configurados" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
    const supabase = createAdminClient();
    const now = new Date();

  try {
        const { data: matchesData } = await supabase
          .from("matches")
          .select("home_team, away_team, home_flag, away_flag, match_date, venue, city, group_name, status")
          .order("match_date", { ascending: true });

      const allMatches = (matchesData ?? []) as (MatchInfo & { status: string })[];
        const todayMatches = allMatches.filter(
                (m) => isSameDayMX(m.match_date, now) && m.status !== "finished"
              );

      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || null;
        const rankQuery = tenantId
          ? supabase.from("league_rankings").select("user_id, display_name, total_pts, exact_count, position").eq("league_id", tenantId).order("position").limit(10)
                : supabase.from("league_rankings").select("user_id, display_name, total_pts, exact_count, position").order("position").limit(10);

      const { data: rankingData } = await rankQuery;
        const ranking = (rankingData ?? []) as RankingEntry[];

      const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, display_name");

      const profiles = (profilesData ?? []) as { id: string; email: string | null; display_name: string | null }[];
        const profileMap: Record<string, { email: string | null; display_name: string | null }> = {};
        profiles.forEach((p) => {
                profileMap[p.id] = { email: p.email, display_name: p.display_name };
        });

      type AuthUser = { id: string; email: string | null };
        const authUsers: AuthUser[] = [];
        let page = 1;
        while (true) {
                const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
                if (error || !data?.users?.length) break;
                authUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null })));
                if (data.users.length < 1000) break;
                page++;
        }

      const recipients = authUsers
          .map((u) => ({
                    id: u.id,
                    email: u.email || profileMap[u.id]?.email || null,
                    display_name: profileMap[u.id]?.display_name || null,
          }))
          .filter((u): u is { id: string; email: string; display_name: string | null } => !!u.email && u.email.includes("@"));

      if (recipients.length === 0) {
              return NextResponse.json({ message: "No hay usuarios con email", sent: 0 });
      }

      const todayMatchDates = todayMatches.map((m) => m.match_date);
        const { data: todayMatchIds } = await supabase
          .from("matches")
          .select("id")
          .in("match_date", todayMatchDates);

      const { data: predsData } = await supabase
          .from("predictions")
          .select("user_id, match_id")
          .in("match_id", (todayMatchIds ?? []).map((m: { id: string }) => m.id));

      const predsMap: Record<string, Set<string>> = {};
        (predsData ?? []).forEach((p: { user_id: string; match_id: string }) => {
                if (!predsMap[p.user_id]) predsMap[p.user_id] = new Set();
                predsMap[p.user_id].add(p.match_id);
        });

      const BATCH = 50;
        let sent = 0;
        let failed = 0;

      for (let i = 0; i < recipients.length; i += BATCH) {
              const batch = recipients.slice(i, i + BATCH);
              await Promise.all(
                        batch.map(async (user) => {
                                    try {
                                                  const userRank = ranking.find((r) => r.user_id === user.id);
                                                  const userPosition = userRank?.position ?? null;
                                                  const userPoints = userRank?.total_pts ?? 0;
                                                  const userPreds = predsMap[user.id] ?? new Set();
                                                  const unvotedCount = Math.max(0, todayMatches.length - userPreds.size);
                                                  const userName = user.display_name || user.email?.split("@")[0] || "Jugador";

                                      const html = buildDailyEmailHtml({ userName, appUrl, ranking, todayMatches, userId: user.id, userPosition, userPoints, unvotedCount, brandName });
                                                  const subject = buildDailyEmailSubject({ todayMatchCount: todayMatches.length, unvotedCount, brandName });

                                      await resend.emails.send({ from: fromEmail, to: user.email!, subject, html });
                                                  sent++;
                                    } catch (err) {
                                                  console.error(`Error enviando a ${user.email}:`, err instanceof Error ? err.message : err);
                                                  failed++;
                                    }
                        })
                      );
              if (i + BATCH < recipients.length) await new Promise((r) => setTimeout(r, 500));
      }

      return NextResponse.json({ message: "Emails enviados", sent, failed, todayMatches: todayMatches.length, recipients: recipients.length });
  } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error("daily-email error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
  }
}
