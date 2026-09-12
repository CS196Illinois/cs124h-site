import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { table } from "../../../../lib/tables";
import { isSandboxRole, getSandboxMode, mergeSandboxRows } from "../../../../lib/sandbox";

// Returns the list of event IDs the current user has checked into
export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!userRole || userRole === "error") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from(table("eventCheckins"))
    .select("event_id, checked_in_at")
    .eq("net_id", netID)
    .order("checked_in_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Something went wrong while processing your request. Please try again. If the problem continues, contact your course staff." }, { status: 500 });

  let rows = data;
  if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
    rows = await mergeSandboxRows(netID, "eventCheckins", rows, (row) => row.net_id === netID);
    rows.sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
  }
  return NextResponse.json(rows);
}
