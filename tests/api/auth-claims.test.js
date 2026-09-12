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
