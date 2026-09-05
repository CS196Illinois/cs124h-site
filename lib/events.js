import { supabaseServer } from "./supabaseServer";
import { table } from "./tables";
import { isSandboxRole, getSandboxMode, getEffectiveRow } from "./sandbox";

// Course leads and the lead web dev keep full reach over every event - the
// escape hatch for cleaning up an event whose creator has left the course.
// Everyone else (PMs, head PMs, web devs) can only touch what they created.
export const EVENT_ADMIN_ROLES = ["course_lead", "lead_web_dev"];

export const canAdminEvents = (role) => EVENT_ADMIN_ROLES.includes(role);

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
