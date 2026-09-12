/** Course leads can prepare future sprints; everyone else sees them on/after start_date. */
export function isSprintVisibleToRole(sprint, role, today = new Date().toISOString().slice(0, 10)) {
  return role === "course_lead" || !sprint?.start_date || String(sprint.start_date).slice(0, 10) <= today;
}
