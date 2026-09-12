import { it, expect } from "vitest";
import "../helpers/mockAuth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";

it.each([
  ["/user", "https://example.com/user"],
  ["https://example.com/user/pm", "https://example.com/user/pm"],
  ["https://example.com.attacker.test/user", "https://example.com"],
  ["//attacker.test", "https://example.com"],
  ["javascript:alert(1)", "https://example.com"],
])("restricts sign-in redirects to the same origin: %s", async (url, expected) => {
  expect(await authOptions.callbacks.redirect({ url, baseUrl: "https://example.com" })).toBe(expected);
});
