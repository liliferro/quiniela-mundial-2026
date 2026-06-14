// ─── Tipos ────────────────────────────────────────────────────────────────────

export type RankingEntry = {
  position: number;
  display_name: string | null;
  total_pts: number;
  exact_count: number;
  user_id: string;
};

export type MatchInfo = {
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  venue?: string | null;
  city?: string | null;
  group_name?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Mexico_City",
  });
}

function flagEmoji(code: string): string {
  if (!code) return "🏳️";
  const specialMap: Record<string, string> = {
    "gb-eng": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "gb-sct": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "gb-wls": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  };
  if (specialMap[code.toLowerCase()]) return specialMap[code.toLowerCase()];
  const upper = code.toUpperCase().replace(/-.*/, "");
  if (upper.length !== 2) return "🏳️";
  return upper
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// ─── Email: Resumen diario ─────────────────────────────────────────────────────

export function buildDailyEmailHtml(params: {
  userName: string;
  appUrl: string;
  ranking: RankingEntry[];
  todayMatches: MatchInfo[];
  userId: string;
  userPosition: number | null;
  userPoints: number;
  unvotedCount: number;
  brandName?: string;
}) {
  const {
    userName, appUrl, ranking, todayMatches, userId,
    userPosition, userPoints, unvotedCount, brandName = "Quiniela Mundial 2026",
  } = params;

  const firstName = userName.split(" ")[0] || "Jugador";
  const hasMatches = todayMatches.length > 0;
  const hasRanking = ranking.length > 0;

  const matchesHtml = hasMatches
    ? todayMatches.map((m) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="text-align:center;width:38%">
                <div style="font-size:28px;line-height:1">${flagEmoji(m.home_flag)}</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#0f172a;margin-top:4px">${m.home_team}</div>
              </td>
              <td style="text-align:center;width:24%">
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:800;color:#64748b;letter-spacing:0.1em">VS</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:#00a859;margin-top:4px">${formatTime(m.match_date)}</div>
                ${m.group_name ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">Grupo ${m.group_name}</div>` : ""}
              </td>
              <td style="text-align:center;width:38%">
                <div style="font-size:28px;line-height:1">${flagEmoji(m.away_flag)}</div>
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#0f172a;margin-top:4px">${m.away_team}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")
    : `<tr><td style="padding:20px;text-align:center;color:#94a3b8;font-size:14px">Sin partidos programados para hoy</td></tr>`;

  const rankingHtml = hasRanking
    ? ranking.slice(0, 10).map((r) => {
        const isMe = r.user_id === userId;
        const medal = MEDAL[r.position] ?? "";
        const name = r.display_name || "Jugador";
        return `
        <tr style="background:${isMe ? "#f0fdf4" : "transparent"}">
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
      }).join("")
    : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#94a3b8;font-size:14px">El ranking estará disponible pronto</td></tr>`;

  const myPositionHtml = userPosition ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#15803d">Tu posición</div>
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:900;color:#063b22;line-height:1;margin-top:4px">#${userPosition}</div>
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:900;color:#f5c542;line-height:1">${userPoints} <span style="font-size:11px;color:#64748b;font-weight:400">pts</span></div>
    </div>` : "";

  const ctaHtml = unvotedCount > 0
    ? `<div style="text-align:center;margin:28px 0"><a href="${appUrl}/partidos" style="display:inline-block;background:linear-gradient(135deg,#00a859,#007a3d);color:#fff;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:800;padding:14px 32px;border-radius:12px;">⚽ Predecir ${unvotedCount} partido${unvotedCount > 1 ? "s" : ""} pendiente${unvotedCount > 1 ? "s" : ""}</a></div>`
    : `<div style="text-align:center;margin:28px 0"><a href="${appUrl}/ranking" style="display:inline-block;background:linear-gradient(135deg,#f5c542,#e0a921);color:#3d2300;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:800;padding:14px 32px;border-radius:12px;">🏆 Ver ranking completo</a></div>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brandName} · Resumen del día</title></head>
<body style="margin:0;padding:0;background:#f8fafc;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">
<tr><td style="background:linear-gradient(135deg,#063b22 0%,#0a5c35 50%,#063b22 100%);border-radius:16px 16px 0 0;padding:32px 32px 28px">
  <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;color:#f5c542;margin-bottom:8px">⚽ ${brandName}</div>
  <div style="font-size:28px;font-weight:900;color:#ffffff;line-height:1.2;margin-bottom:8px">¡Buenos días, ${firstName}! 🌅</div>
  <div style="font-size:14px;color:rgba(255,255,255,0.75);">${hasMatches ? `Hoy hay <strong style="color:#f5c542">${todayMatches.length} partido${todayMatches.length > 1 ? "s" : ""}</strong>. Asegúrate de predecir antes del silbatazo.` : "Aquí tienes tu resumen del Mundial 2026."}</div>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
  ${myPositionHtml}
  ${hasMatches ? `<div style="margin-bottom:28px"><div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#475569;margin-bottom:12px">📅 Partidos de hoy</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">${matchesHtml}</table></div>` : ""}
  ${ctaHtml}
  ${hasRanking ? `<div><div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:#475569;margin-bottom:12px">🏆 Top 10 · Tabla de posiciones</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0"><td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;width:48px;text-align:center">#</td><td style="padding:8px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Jugador</td><td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;text-align:right">Pts</td><td style="padding:8px 16px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;text-align:right">🎯</td></tr>${rankingHtml}</table><div style="text-align:center;margin-top:12px"><a href="${appUrl}/ranking" style="font-size:13px;color:#00a859;text-decoration:none;font-weight:600">Ver tabla completa →</a></div></div>` : ""}
</td></tr>
<tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
  <div style="font-size:12px;color:#94a3b8;line-height:1.6">Recibiste este correo porque participas en la ${brandName}.<br><a href="${appUrl}" style="color:#00a859;text-decoration:none;font-weight:600">Ir a la quiniela</a> · <a href="${appUrl}/api/email/unsubscribe?uid=${userId}" style="color:#94a3b8;text-decoration:none">Cancelar suscripción</a></div>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

export function buildDailyEmailSubject(params: {
  todayMatchCount: number;
  unvotedCount: number;
  brandName?: string;
}) {
  const { todayMatchCount, unvotedCount, brandName = "Quiniela" } = params;
  if (unvotedCount > 0 && todayMatchCount > 0)
    return `⚽ ${brandName} · ${todayMatchCount} partido${todayMatchCount > 1 ? "s" : ""} hoy — predice antes del pitazo`;
  if (todayMatchCount > 0)
    return `🔴 ${brandName} · ${todayMatchCount} partido${todayMatchCount > 1 ? "s" : ""} en juego hoy`;
  return `🏆 ${brandName} · Ranking del día`;
    }
