/**
 * Convierte un código ISO 3166-1 alpha-2 a su emoji de bandera.
 * Para subnaciones del Reino Unido sin código ISO (England/Scotland/Wales),
 * usamos códigos personalizados (EN/SC/WL) y emojis con tag-sequences.
 */

const SPECIAL_FLAGS: Record<string, string> = {
  EN: "🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", // England
  SC: "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", // Scotland
  WL: "🏴\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}", // Wales
};

export function flagEmoji(code: string | null | undefined): string {
  if (!code) return "🏳️";
  const upper = code.toUpperCase();
  if (SPECIAL_FLAGS[upper]) return SPECIAL_FLAGS[upper];
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return "🏳️";
  const offset = 127397; // 0x1F1E6 - 0x41
  try {
    return String.fromCodePoint(
      ...[...upper].map((c) => c.charCodeAt(0) + offset)
    );
  } catch {
    return "🏳️";
  }
}
