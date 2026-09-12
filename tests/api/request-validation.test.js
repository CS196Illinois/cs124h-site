import { it, expect } from "vitest";
import { asRole } from "../helpers/mockAuth";
import { makeRequest } from "../helpers/request";
import { POST as event } from "../../app/api/events/route";
import { POST as assignment } from "../../app/api/action_items/route";

it.each([null, [], { title: 42 }, { title: "Meeting", start_time: "nonsense" }, { title: "Meeting", start_time: "2026-09-10T12:00:00Z", end_time: "2026-09-10T11:00:00Z" }, { title: "Meeting", description: {} }])("rejects malformed event input %j", async (body) => {
  asRole("course_lead", "lead");
  expect((await event(makeRequest("http://localhost/api/events", { method: "POST", body }))).status).toBe(400);
});
it.each([null, [], { title: 42 }, { title: "Work" }, { title: "Work", target_type: "individual", target_net_ids: [42] }])("rejects malformed assignment input %j", async (body) => {
  asRole("course_lead", "lead");
  expect((await assignment(makeRequest("http://localhost/api/action_items", { method: "POST", body }))).status).toBe(400);
});
