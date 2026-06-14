import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const API_URL = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE = 1;
const WORLD_CUP_SEASON = 2026;

const STATUS_MAP: Record<string, "scheduled" | "live" | "finished"> = {
  TBD: "scheduled", NS: "scheduled", PST: "scheduled",
  "1H": "live", HT: "live", "2H": "live",
  ET: "live", BT: "live", P: "live",
  SUSP: "live", INT: "live", LIVE: "live",
  FT: "finished", AET: "finished", PEN: "finished",
  CANC: "finished", ABD: "finished", AWD: "finished", WO: "finished",
};

const COUNTRY_TO_CODE: Record<string, string> = {
  "Mexico": "mx", "United States": "us", "Canada": "ca",
  "Brazil": "br", "Argentina": "ar", "Uruguay": "uy",
  "Colombia": "co", "Chile": "cl", "Ecuador": "ec", "Peru": "pe",
  "Paraguay": "py", "Bolivia": "bo", "Venezuela": "ve",
  "France": "fr", "Germany": "de", "Spain": "es", "Portugal": "pt",
  "England": "gb-eng", "Netherlands": "nl", "Belgium": "be",
  "Italy": "it", "Croatia": "hr", "Switzerland": "ch",
  "Denmark": "dk", "Sweden": "se", "Austria": "at", "Poland": "pl",
  "Serbia": "rs", "Slovakia": "sk", "Slovenia": "si",
  "Scotland": "gb-sct", "Wales": "gb-wls", "Ireland": "ie",
  "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng",
  "Egypt": "eg", "Ivory Coast": "ci", "Cameroon": "cm",
  "Ghana": "gh", "Tunisia": "tn", "Algeria": "dz",
  "South Africa": "za", "Mali": "ml", "Guinea": "gn",
  "Japan": "jp", "South Korea": "kr", "Australia": "au",
  "Iran": "ir", "Saudi Arabia": "sa", "Qatar": "qa",
  "Iraq": "iq", "United Arab Emirates": "ae", "Jordan": "jo",
  "Uzbekistan": "uz", "Indonesia": "id", "New Zealand": "nz",
  "Oman": "om", "Bahrain": "bh", "Kuwait": "kw",
  "Costa Rica": "cr", "Panama": "pa", "Honduras": "hn",
  "El Salvador": "sv", "Guatemala": "gt", "Jamaica": "jm",
  "Trinidad and Tobago": "tt", "Haiti": "ht",
  "Cote d'Ivoire": "ci", "DR Congo": "cd", "Congo": "cg",
  "Albania": "al", "Armenia": "am", "Azerbaijan": "az",
  "Georgia": "ge", "Bosnia": "ba", "North Macedonia": "mk",
  "Ukraine": "ua", "Romania": "ro", "Greece": "gr",
  "Hungary": "hu", "Czechia": "cz", "Bulgaria": "bg",
  "Kosovo": "xk", "Montenegro": "me",
  "Benin": "bj", "Burkina Faso": "bf", "Cape Verde": "cv",
  "Comoros": "km", "Equatorial Guinea": "gq", "Gabon": "ga",
  "Gambia": "gm", "Mauritania": "mr", "Mozambique": "mz",
  "Namibia": "na", "Tanzania": "tz", "Uganda": "ug",
  "Zambia": "zm", "Zimbabwe": "zw",
  "Dominican Republic": "do", "Kenya": "ke",
  "Lebanon": "lb", "Libya": "ly", "Nepal": "np",
  "Sudan": "sd", "Syria": "sy", "Yemen": "ye",
};

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
};

type DbMatch = {
  id: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FOOTBALL_API_KEY not set" }, { status: 500 });
  }

  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const fetchFixtures = async (date: string) => {
      const res = await fetch(
        `${API_URL}/fixtures?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}&date=${date}`,
        { headers: { "x-apisports-key": apiKey, "x-rapidapi-key": apiKey } }
      );
      if (!res.ok) throw new Error(`API-Football error ${res.status}`);
      const json = await res.json();
      return (json.response ?? []) as ApiFixture[];
    };

    const [todayFixtures, yesterdayFixtures] = await Promise.all([
      fetchFixtures(todayStr),
      fetchFixtures(yesterdayStr),
    ]);
    const allFixtures = [...todayFixtures, ...yesterdayFixtures];

    if (allFixtures.length === 0) {
      return NextResponse.json({ message: "No hay partidos que actualizar", updated: 0 });
    }

    const supabase = createAdminClient();
    const { data: dbMatches, error: dbError } = await supabase
      .from("matches")
      .select("id, home_flag, away_flag, match_date, status, home_score, away_score")
      .gte("match_date", `${yesterdayStr}T00:00:00`)
      .lte("match_date", `${todayStr}T23:59:59`);

    if (dbError) throw new Error(dbError.message);
    const matches = (dbMatches ?? []) as DbMatch[];

    let updated = 0;
    const updates: Promise<void>[] = [];

    for (const fixture of allFixtures) {
      const homeCode = COUNTRY_TO_CODE[fixture.teams.home.name];
      const awayCode = COUNTRY_TO_CODE[fixture.teams.away.name];
      if (!homeCode || !awayCode) continue;

      const dbMatch = matches.find(
        (m) =>
          m.home_flag.toLowerCase() === homeCode.toLowerCase() &&
          m.away_flag.toLowerCase() === awayCode.toLowerCase()
      );
      if (!dbMatch) continue;

      const newStatus = STATUS_MAP[fixture.fixture.status.short] ?? "scheduled";
      const newHomeScore = fixture.goals.home;
      const newAwayScore = fixture.goals.away;

      const changed =
        dbMatch.status !== newStatus ||
        dbMatch.home_score !== newHomeScore ||
        dbMatch.away_score !== newAwayScore;

      if (!changed) continue;

      updates.push(
        supabase
          .from("matches")
          .update({ status: newStatus, home_score: newHomeScore, away_score: newAwayScore })
          .eq("id", dbMatch.id)
          .then(({ error }) => {
            if (error) console.error(`Error actualizando ${dbMatch.id}:`, error.message);
            else updated++;
          })
      );
    }

    await Promise.all(updates);
    return NextResponse.json({ message: "Resultados actualizados", fixturesFetched: allFixtures.length, updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("update-scores error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }
