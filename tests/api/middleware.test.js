import { it, expect, vi } from "vitest";
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";
vi.mock("../../lib/roleViews", () => ({ fetchApprovedViews: vi.fn(async () => []) }));
import middleware from "../../middleware";

it.each(["student", "pm", "head_pm", "course_lead", "web_dev"])("%s cannot visit lead web developer pages", async (role) => {
  const token = await encode({ token: { role, netID: "test" }, secret: process.env.NEXTAUTH_SECRET });
  const req = new NextRequest("http://localhost/user/lead_web_dev/people", { headers: { cookie: `next-auth.session-token=${token}` } });
  const res = await middleware(req);
  expect(res.status).toBe(307);
  expect(new URL(res.headers.get("location")).pathname).toBe("/unauthorized");
});
