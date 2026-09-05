import { supabaseServer } from "./supabaseServer";
import { table } from "./tables";
import { isSandboxRole, getSandboxMode, getEffectiveRow } from "./sandbox";

/**
 * An event is managed only by the person who created it. Returns the event
 * row when `netID` created it, otherwise null (callers turn that into a
 * 403). Sandbox-aware so a web dev previewing their own overlay still works.
 */
export async function getManagedEvent(id, netID, userRole, columns = "id, title, created_by, check_in_open") {
  const { data: real } = await supabaseServer
    .from(table("events")).select(columns).eq("id", id).maybeSingle();
  let event = real;
  if (isSandboxRole(userRole) && (await getSandboxMode(netID)) !== "off") {
    event = await getEffectiveRow(netID, "events", id, real);
  }
  return event && event.created_by === netID ? event : null;
}
