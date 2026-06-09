export const BRAND_BY_HOSTNAME: Record<string, { name: string; logoPath: string }> = {
  lacomuna: { name: "La Comuna", logoPath: "/logo-lacomuna.png" },
};

export function getBrandFromHost(host: string) {
  const lower = host.toLowerCase();
  for (const [key, brand] of Object.entries(BRAND_BY_HOSTNAME)) {
    if (lower.includes(key)) return brand;
  }
  return null;
}
