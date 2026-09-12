import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { table } from "../../../../lib/tables";

// Public route - no auth required. The hall of fame page is intentionally
// visible to anyone, logged in or not.
export async function GET() {
  const { data, error } = await supabaseServer
    .from(table("projects"))
    .select("*")
    .order("semester_order", { ascending: true })
    .order("project_order", { ascending: true });

  if (error) return NextResponse.json({ error: "Something went wrong while processing your request. Please try again. If the problem continues, contact your course staff." }, { status: 500 });
  return NextResponse.json(data ?? []);
}
