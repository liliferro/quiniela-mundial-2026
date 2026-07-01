import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ONE-SHOT: Envía email de cierre de la Quiniela Mundial 2026
 * con el podio final (1°, 2° y 3° lugar) y el ranking completo.
 * Sin auth — endpoint de uso único, eliminar después de ejecutar.
 */

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function buildFinalEmailHtml(params: {
  userName: string;
  userId: string;
  appUrl: string;
  brandName: string;
  ranking: Array<{
    position: number;
    display_name: string | null;
    total_pts: number;
    exact_count: number;
    user_id: string;
  }>;
}) {
  const { userName, userId, appUrl, brandName, ranking } = params;
  const firstName = userName.split(" ")[0] || "Jugador";

  const top3 = ranking.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const podiumHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px">
      <tr>
        <!-- 2° lugar -->
        <td style="width:33%;text-align:center;vertical-align:bottom;padding:0 4px">
          <div style="background:#f1f5f9;border-radius:12px 12px 0 0;padding:20px 8px 16px;border:2px solid #cbd5e1">
            <div style="font-size:36px;line-height:1">🥈</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#0f172a;margin-top:8px;word-break:break-word">${second?.display_name || "—"}</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:900;color:#475569;margin-top:6px">${second?.total_pts ?? 0}<span style="font-size:12px;font-weight:500;color:#94a3b8"> pts</span></div>
            <div style="font-size:11px;color:#854d0e;margin-top:4px">🎯 ${second?.exact_count ?? 0} exactos</div>
          </div>
          <div style="background:#cbd5e1;height:32px;border-radius:0 0 4px 4px"></div>
        </td>
        <!-- 1° lugar -->
        <td style="width:34%;text-align:center;vertical-align:bottom;padding:0 4px">
          <div style="background:linear-gradient(135deg,#fef9c3,#fef08a);border-radius:12px 12px 0 0;padding:24px 8px 16px;border:2px solid #f5c542;box-shadow:0 4px 16px rgba(245,197,66,0.3)">
            <div style="font-size:44px;line-height:1">🥇</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:900;color:#063b22;margin-top:8px;word-break:break-word">${first?.display_name || "—"}</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:900;color:#063b22;margin-top:6px">${first?.total_pts ?? 0}<span style="font-size:12px;font-weight:500;color:#64748b"> pts</span></div>
            <div style="font-size:11px;color:#854d0e;margin-top:4px">🎯 ${first?.exact_count ?? 0} exactos</div>
          </div>
          <div style="background:#f5c542;height:48px;border-radius:0 0 4px 4px"></div>
        </td>
        <!-- 3° lugar -->
        <td style="width:33%;text-align:center;vertical-align:bottom;padding:0 4px">
          <div style="background:#fff7ed;border-radius:12px 12px 0 0;padding:16px 8px 16px;border:2px solid #fed7aa">
            <div style="font-size:32px;line-height:1">🥉</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#0f172a;margin-top:8px;word-break:break-word">${third?.display_name || "—"}</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:900;color:#9a3412;margin-top:6px">${third?.total_pts ?? 0}<span style="font-size:12px;font-weight:500;color:#94a3b8"> pts</span></div>
            <div style="font-size:11px;color:#854d0e;margin-top:4px">🎯 ${third?.exact_count ?? 0} exactos</div>
          </div>
          <div style="background:#fed7aa;height:20px;border-radius:0 0 4px 4px"></div>
        </td>
      </tr>
    </table>`;

  const rankingRows = ranking
    .map((r) => {
      const isMe = r.user_id === userId;
      const medal = MEDAL[r.position] ?? "";
      const name = r.display_name || "Jugador";
      return `
      <tr style="background:${isMe ? "#f0fdf4" : "transparent"};border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#475569;text-align:center;width:48px">
          ${medal || `<span style="font-weight:700;color:${isMe ? "#00a859" : "#64748b"}">${r.position}</span>`}
        </td>
        <td style="padding:10px 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:${isMe ? "700" : "500"};color:${isMe ? "#063b22" : "#0f172a"}">
          ${name}${isMe ? ' <span style="font-size:10px;color:#00a859;font-weight:800;text-transform:uppercase;letter-spacing:0.08em">tú</span>' : ""}
        </td>
        <td style="padding:10px 16px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:800;color:#063b22">
          ${r.total_pts} <span style="font-size:11px;font-weight:500;color:#94a3b8">pts</span>
        </td>
        <td style="padding:10px 16px;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#854d0e">
          🎯 ${r.exact_count}
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${brandName} · ¡Resultados finales!</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">
          <tr>
            <td style="background:linear-gradient(135deg,#063b22 0%,#0a5c35 50%,#063b22 100%);border-radius:16px 16px 0 0;padding:36px 32px 32px;text-align:center">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:48px;line-height:1;margin-bottom:12px">🏆</div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#f5c542;margin-bottom:8px">⚽ ${brandName}</div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;margin-bottom:12px">¡La quiniela ha terminado!</div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.6">
                Hola <strong style="color:#f5c542">${firstName}</strong>, gracias por participar.<br>
                Aquí están los resultados finales de nuestra quiniela del Mundial 2026.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:32px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#475569;margin-bottom:16px;text-align:center">🏅 Podio final</div>
              ${podiumHtml}
              <div style="margin-top:8px">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#475569;margin-bottom:12px">📊 Clasificación final</div>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
                  <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
                    <td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;width:48px;text-align:center">#</td>
                    <td style="padding:8px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8">Jugador</td>
                    <td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;text-align:right">Pts</td>
                    <td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;text-align:right">🎯</td>
                  </tr>
                  ${rankingRows}
                </table>
              </div>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin-top:28px;text-align:center">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#063b22;margin-bottom:8px">¡Gracias por jugar! ⚽</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#15803d;line-height:1.6">Fue un Mundial increíble. Esperamos verlos en la próxima edición.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6">
                Recibiste este correo porque participaste en la ${brandName}.<br>
                <a href="${appUrl}" style="color:#00a859;text-decoration:none;font-weight:600">Ver quiniela</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quiniela-mundial-2026-alpha.vercel.app";
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Quiniela Mundial 2026";

  if (!resendKey || !fromEmail) {
    return NextResponse.json({ error: "RESEND_API_KEY o RESEND_FROM_EMAIL no configurados" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = createAdminClient();

  try {
    // 1. Profiles (emails + names)
    const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("id, email, display_name");
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const profiles = (profilesData ?? []) as Array<{ id: string; email: string | null; display_name: string | null }>;
    const profileMap: Record<string, { email: string | null; display_name: string | null }> = {};
    profiles.forEach((p) => { profileMap[p.id] = { email: p.email, display_name: p.display_name }; });

    const recipients = profiles.filter((p) => p.email && p.email.includes("@"));

    // 2. Ranking (no display_name column in view — join via profileMap)
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || null;
    const rankQuery = tenantId
      ? supabase.from("league_rankings").select("user_id, total_pts, exact_count, position").eq("league_id", tenantId).order("position")
      : supabase.from("league_rankings").select("user_id, total_pts, exact_count, position").is("league_id", null).order("position");

    const { data: rankingData, error: rankError } = await rankQuery;
    if (rankError) {
      console.error("Error fetching ranking:", rankError);
      return NextResponse.json({ error: rankError.message }, { status: 500 });
    }

    const ranking = ((rankingData ?? []) as Array<{
      position: number;
      total_pts: number;
      exact_count: number;
      user_id: string;
    }>).map((r) => {
      const prof = profileMap[r.user_id];
      const display_name = prof?.display_name || prof?.email?.split("@")[0] || "Jugador";
      return { ...r, display_name };
    });

    if (recipients.length === 0) {
      return NextResponse.json({ message: "No hay usuarios con email", sent: 0 });
    }

    const BATCH = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (user) => {
          try {
            const userName = user.display_name || user.email?.split("@")[0] || "Jugador";
            const html = buildFinalEmailHtml({ userName, userId: user.id, appUrl, brandName, ranking });
            const subject = `🏆 ${brandName} · ¡Resultados finales del Mundial!`;
            await resend.emails.send({ from: fromEmail, to: user.email!, subject, html });
            sent++;
          } catch (err) {
            console.error(`Error enviando a ${user.email}:`, err instanceof Error ? err.message : err);
            failed++;
          }
        })
      );
      if (i + BATCH < recipients.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      message: "Emails de cierre enviados",
      sent,
      failed,
      recipients: recipients.length,
      top3: ranking.slice(0, 3).map((r) => ({ position: r.position, name: r.display_name, pts: r.total_pts })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("send-final-email error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
