import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
      const supabase = createAdminClient();
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || null;

  const filtered = tenantId
        ? await supabase.from("league_rankings").select("*").eq("league_id", tenantId).order("position").limit(10)
          : await supabase.from("league_rankings").select("*").order("position").limit(10);

  const unfiltered = await supabase.from("league_rankings").select("*").order("position").limit(10);

  return NextResponse.json({
          tenantId,
          filteredCount: filtered.data?.length ?? 0,
          filteredError: filtered.error?.message ?? null,
          filteredSample: filtered.data?.slice(0, 3) ?? [],
          unfilteredCount: unfiltered.data?.length ?? 0,
          unfilteredError: unfiltered.error?.message ?? null,
          unfilteredSample: unfiltered.data?.slice(0, 3) ?? [],
  });
}
