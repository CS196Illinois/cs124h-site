import { it, expect, beforeEach, afterAll } from "vitest";
import "../helpers/mockAuth";
import { insertUser, clearAllTestTables, testClient } from "../helpers/db";
import { table } from "../../lib/tables";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";

beforeEach(clearAllTestTables);
afterAll(clearAllTestTables);
it("only one identity can claim an unbound roster entry during concurrent sign-ins", async () => {
  await insertUser({ net_id: "claim-student", role: "STUDENT", sub: null });
  const results = await Promise.all(["claim-sub-a", "claim-sub-b"].map((id) => authOptions.callbacks.jwt({ token: {}, user: { id, email: "claim-student@illinois.edu", name: "Claim Student" } })));
  expect(results.filter((token) => token.role === "student")).toHaveLength(1);
  expect(results.filter((token) => token.role === "error")).toHaveLength(1);
  const { data } = await testClient().from(table("users")).select("sub").eq("net_id", "claim-student").single();
  expect(results.find((token) => token.role === "student").sub).toBe(data.sub);
});

it("allows a returning user whose provider response omits email", async () => {
  await insertUser({ net_id: "known-student", role: "STUDENT", sub: "known-sub" });
  const token = await authOptions.callbacks.jwt({ token: {}, user: { id: "known-sub", name: "Known Student" } });
  expect(token.role).toBe("student");
  expect(token.netID).toBe("known-student");
});

it("accepts CILogon's alternate preferred username identity for first login", async () => {
  await insertUser({ net_id: "alternate-student", role: "STUDENT", sub: null });
  const token = await authOptions.callbacks.jwt({ token: {}, user: { id: "alternate-sub", preferred_username: "alternate-student@illinois.edu", name: "Alternate Student" } });
  expect(token.role).toBe("student");
  expect(token.netID).toBe("alternate-student");
});
