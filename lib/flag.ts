const SPECIAL_CODES: Record<string, string> = {
  EN: "gb-eng",
  SC: "gb-sct",
  WL: "gb-wls",
};

export function flagSrc(code: string | null | undefined): string {
  if (!code) return "/flags/un.svg";
  const upper = code.toUpperCase();
  const special = SPECIAL_CODES[upper];
  if (special) return `/flags/${special}.svg`;
  return `/flags/${upper.toLowerCase()}.svg`;
}
