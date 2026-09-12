import { supabaseServer } from "./supabaseServer";
import { table } from "./tables";
import { isSandboxRole, getSandboxMode, getEffectiveRow } from "./sandbox";

// Course leads and the lead web dev keep full reach over every event - the
// escape hatch for cleaning up an event whose creator has left the course.
// Everyone else (PMs, head PMs, web devs) can only touch what they created.
export const EVENT_ADMIN_ROLES = ["course_lead", "lead_web_dev"];

export const canAdminEvents = (role) => EVENT_ADMIN_ROLES.includes(role);

export const EVENT_AUDIENCE_TYPES = ["all", "people", "roles", "groups"];

export function eventHasEnded(event, now = Date.now()) {
  return !!event?.end_time && Number.isFinite(Date.parse(event.end_time)) && Date.parse(event.end_time) <= now;
}

export function audienceMatches(event, { netID, role, groupNumber }) {
  const type = event?.audience_type || "all";
  const values = Array.isArray(event?.audience_values) ? event.audience_values.map(String) : [];
  if (type === "all") return true;
  if (type === "people") return values.includes(String(netID));
  if (type === "roles") return values.includes(String(role).toUpperCase());
  if (type === "groups") return groupNumber != null && values.includes(String(groupNumber));
  return false;
}

/**
 * Returns the event row when `netID` may manage it - they created it, or
 * they hold an admin role - otherwise null (callers turn that into a 403).
 * Sandbox-aware so a web dev previewing their own overlay still works.
 */
export async function getManagedEvent(id, netID, userRole, columns = "id, title, created_by, check_in_open") {
  const { data: real } = await supabaseServer
    .from(table("events")).select(columns).eq("id", id).maybeSingle();
  let event = real;
  if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
    event = await getEffectiveRow(netID, "events", id, real);
  }
  if (!event) return null;
  return event.created_by === netID || canAdminEvents(userRole) ? event : null;
}
