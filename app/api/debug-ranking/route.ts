import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
        const supabase = createAdminClient();

  const ranking = await supabase
          .from("league_rankings")
          .select("user_id, display_name:full_name, total_pts, exact_count:exact_hits, position")
          .order("position")
          .limit(5);

  const profilesSample = await supabase.from("profiles").select("*").limit(3);

  const usersResp = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 });

  return NextResponse.json({
            aliasedRankingError: ranking.error?.message ?? null,
            aliasedRankingSample: ranking.data ?? [],
            profilesColumns: profilesSample.data?.[0] ? Object.keys(profilesSample.data[0]) : [],
            profilesSample: profilesSample.data ?? [],
            profilesError: profilesSample.error?.message ?? null,
            authUsersSample: (usersResp.data?.users ?? []).map((u) => ({
                        id: u.id,
                        email: u.email,
                        user_metadata: u.user_metadata,
            })),
            authUsersError: usersResp.error?.message ?? null,
  });
}
