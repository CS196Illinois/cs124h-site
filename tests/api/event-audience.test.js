import { describe, it, expect } from "vitest";
import { audienceMatches } from "../../lib/events";

describe("event audience matching", () => {
  it("allows everyone and exact people", () => {
    expect(audienceMatches({ audience_type: "all" }, { netID: "any", role: "student" })).toBe(true);
    expect(audienceMatches({ audience_type: "people", audience_values: ["s1"] }, { netID: "s1", role: "student" })).toBe(true);
    expect(audienceMatches({ audience_type: "people", audience_values: ["s1"] }, { netID: "s2", role: "student" })).toBe(false);
  });
  it("matches canonical roles and groups", () => {
    expect(audienceMatches({ audience_type: "roles", audience_values: ["PM", "HEAD"] }, { netID: "p", role: "pm" })).toBe(true);
    expect(audienceMatches({ audience_type: "roles", audience_values: ["STUDENT"] }, { netID: "p", role: "pm" })).toBe(false);
    expect(audienceMatches({ audience_type: "groups", audience_values: ["4"] }, { netID: "s", role: "student", groupNumber: 4 })).toBe(true);
    expect(audienceMatches({ audience_type: "groups", audience_values: ["4"] }, { netID: "s", role: "student", groupNumber: 5 })).toBe(false);
  });
});
