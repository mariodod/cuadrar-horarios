import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: availabilities, error } = await supabase
    .from("availabilities")
    .select("id, user_id, day, start_time, end_time")
    .eq("session_id", id)
    .order("day", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agrupar por día y usuario
  const byDayAndUser = new Map<string, Map<string, Array<{ start_time: string; end_time: string }>>>();

  for (const a of availabilities ?? []) {
    if (!byDayAndUser.has(a.day)) {
      byDayAndUser.set(a.day, new Map());
    }
    const byUser = byDayAndUser.get(a.day)!;
    if (!byUser.has(a.user_id)) {
      byUser.set(a.user_id, []);
    }
    byUser.get(a.user_id)!.push({
      start_time: a.start_time,
      end_time: a.end_time,
    });
  }

  // Calcular intersecciones entre pares de usuarios por día
  const overlaps: Array<{
    day: string;
    user_1_id: string;
    user_2_id: string;
    start: string;
    end: string;
  }> = [];

  for (const [day, byUser] of byDayAndUser) {
    const users = Array.from(byUser.entries());
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const [user1Id, blocks1] = users[i];
        const [user2Id, blocks2] = users[j];

        for (const b1 of blocks1) {
          for (const b2 of blocks2) {
            const start = b1.start_time > b2.start_time ? b1.start_time : b2.start_time;
            const end = b1.end_time < b2.end_time ? b1.end_time : b2.end_time;
            if (start < end) {
              overlaps.push({
                day,
                user_1_id: user1Id,
                user_2_id: user2Id,
                start,
                end,
              });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ overlaps });
}
