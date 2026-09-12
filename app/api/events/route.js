import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseServer } from "../../../lib/supabaseServer";
import { table } from "../../../lib/tables";
import { isSandboxRole, getSandboxMode, mergeSandboxRows, sandboxWrite } from "../../../lib/sandbox";
import { canAdminEvents, EVENT_AUDIENCE_TYPES, audienceMatches } from "../../../lib/events";

const STAFF_ROLES = ["course_lead", "lead_web_dev", "head_pm", "pm", "web_dev"];

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!userRole || userRole === "error") {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  // scope=checkin: the Attendance tab - every open event plus any the user
  // has already checked into (for their attendance history).
  // default: the Events tab - only events this user created (course
  // leads / lead web dev see all, so an orphaned event stays reachable).
  const scope = new URL(request.url).searchParams.get("scope") || "mine";

  let { data, error } = await supabaseServer
    .from(table("events"))
    .select("id, title, description, location, presenter, start_time, check_in_open, check_in_opened_at, created_by, created_at, point_value, sheet_synced_at, sheet_sync_error, audience_type, audience_values")
    .order("created_at", { ascending: false });

  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ data, error } = await supabaseServer.from(table("events")).select("id, title, description, location, presenter, start_time, check_in_open, check_in_opened_at, created_by, created_at, point_value, sheet_synced_at, sheet_sync_error").order("created_at", { ascending: false }));
    if (data) data = data.map((row) => ({ ...row, audience_type: "all", audience_values: [] }));
  }
  if (error) return NextResponse.json({ error: "Something went wrong while processing your request. Please try again. If the problem continues, contact your course staff." }, { status: 500 });

  let rows = data;
  if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
    rows = await mergeSandboxRows(netID, "events", rows, () => true);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const { data: viewer } = await supabaseServer.from(table("users")).select("group_number").eq("net_id", netID).maybeSingle();
  const viewerGroup = viewer?.group_number ?? null;
  if (scope === "checkin") {
    const { data: mine } = await supabaseServer
      .from(table("eventCheckins")).select("event_id").eq("net_id", netID);
    let attendedIds = new Set((mine ?? []).map((r) => r.event_id));
    if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
      const merged = await mergeSandboxRows(netID, "eventCheckins", mine ?? [], (r) => r.net_id === netID);
      attendedIds = new Set(merged.map((r) => r.event_id));
    }
    rows = rows.filter((e) => audienceMatches(e, { netID, role: userRole, groupNumber: viewerGroup }) && (e.check_in_open || attendedIds.has(e.id)));
  } else if (!canAdminEvents(userRole)) {
    rows = rows.filter((e) => e.created_by === netID || (e.audience_type !== "all" && audienceMatches(e, { netID, role: userRole, groupNumber: viewerGroup })));
  }

  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!STAFF_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Please check the information you entered and try again." }, { status: 400 });
  const { title, description, location, presenter, start_time, end_time, audience_type = "all", audience_values = [] } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Please enter a title." }, { status: 400 });
  }
  if (!EVENT_AUDIENCE_TYPES.includes(audience_type) || !Array.isArray(audience_values) || audience_values.some((v) => typeof v !== "string" && typeof v !== "number")) {
    return NextResponse.json({ error: "Please choose a valid event audience." }, { status: 400 });
  }
  const cleanAudience = [...new Set(audience_values.map(String).map((v) => v.trim()).filter(Boolean))];
  if (audience_type !== "all" && cleanAudience.length === 0) return NextResponse.json({ error: "Select at least one audience member" }, { status: 400 });
  if (audience_type === "roles" && cleanAudience.some((v) => !["LEAD", "LEAD_WEB", "HEAD", "PM", "WEB", "STUDENT"].includes(v.toUpperCase()))) return NextResponse.json({ error: "One or more selected audience roles are not valid." }, { status: 400 });
  if (audience_type === "roles") cleanAudience.forEach((value, index) => { cleanAudience[index] = value.toUpperCase(); });
  if (audience_type === "people" || audience_type === "groups") {
    const { data: roster } = await supabaseServer.from(table("users")).select("net_id, group_number");
    const valid = audience_type === "people"
      ? new Set((roster ?? []).map((person) => person.net_id))
      : new Set((roster ?? []).filter((person) => person.group_number != null).map((person) => String(person.group_number)));
    if (cleanAudience.some((value) => !valid.has(value))) return NextResponse.json({ error: "One or more audience selections are not in the roster" }, { status: 400 });
  }

  if ([description, location, presenter].some((value) => value != null && typeof value !== "string")) {
    return NextResponse.json({ error: "Description, location and presenter must be text" }, { status: 400 });
  }
  if ([start_time, end_time].some((value) => value != null && value !== "" && (typeof value !== "string" || !Number.isFinite(Date.parse(value))))) {
    return NextResponse.json({ error: "Please enter a valid event date and time." }, { status: 400 });
  }
  if (start_time && end_time && Date.parse(end_time) <= Date.parse(start_time)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  // end_time is required by the DB - default to 1 hour after start_time, or now + 1h
  const resolvedEndTime = end_time || (
    start_time
      ? new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 60 * 60 * 1000).toISOString()
  );

  const row = {
    title: title.trim(),
    description: description?.trim() || null,
    location: location?.trim() || null,
    presenter: presenter?.trim() || null,
    start_time: start_time || null,
    end_time: resolvedEndTime,
    created_by: netID,
    audience_type,
    audience_values: audience_type === "all" ? [] : cleanAudience,
  };

  if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
    const fullRow = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      point_value: 0,
      check_in_open: false,
      check_in_opened_at: null,
      is_active: true,
      checked_in_students: [],
      qr_code_secret: null,
      join_link: null,
      ...row,
      audience_type,
      audience_values: audience_type === "all" ? [] : cleanAudience,
    };
    await sandboxWrite(netID, "events", "insert", fullRow.id, fullRow);
    return NextResponse.json(fullRow, { status: 201 });
  }

  let { data, error } = await supabaseServer
    .from(table("events"))
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Event creation failed", { code: error.code, message: error.message });
    const message = error.code === "PGRST204" || error.code === "42703"
      ? "Events need a database update before they can be created. Ask the website administrator to apply the event audience migration, then try again."
      : error.code === "23502"
        ? "The event could not be saved because the database requires additional information. Try adding a start time. If it still fails, contact the website administrator."
        : error.code === "23503"
          ? "Your account could not be linked to the event. Refresh the page and try again; if this continues, ask the website administrator to check your roster entry."
          : "The event could not be saved. Please try again. If this continues, contact the website administrator.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
