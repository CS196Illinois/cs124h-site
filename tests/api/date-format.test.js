import { describe, it, expect } from "vitest";
import { formatDueDate, formatLocalDate, formatLocalDateTime, localTodayISO, datetimeLocalToISO } from "../../lib/dateFormat";

describe("dateFormat", () => {
  it("formats a due date (UTC-midnight) as the same calendar day everywhere", () => {
    // The bug this guards against: naive local formatting of a UTC-midnight
    // value shows the day before for anyone west of UTC.
    const naiveInLA = new Date("2026-09-10T00:00:00Z").toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    expect(naiveInLA).toBe("9/9/2026");

    expect(formatDueDate("2026-09-10T00:00:00Z")).toBe("Sep 10, 2026");
    expect(formatDueDate("2026-09-10")).toBe("Sep 10, 2026");
    expect(formatDueDate("2026-09-10T00:00:00+00:00")).toBe("Sep 10, 2026");
  });

  it("returns null for missing or unparseable values", () => {
    expect(formatDueDate(null)).toBeNull();
    expect(formatDueDate("")).toBeNull();
    expect(formatLocalDate(undefined)).toBeNull();
    expect(formatLocalDateTime("not a date")).toBeNull();
  });

  it("localTodayISO returns a YYYY-MM-DD string", () => {
    expect(localTodayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("datetimeLocalToISO turns a naive local datetime into a UTC ISO string", () => {
    const iso = datetimeLocalToISO("2026-09-10T15:30");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
    // Round-trips back to the same wall-clock time in this runtime's zone.
    const back = new Date(iso);
    expect(back.getHours()).toBe(15);
    expect(back.getMinutes()).toBe(30);
    expect(datetimeLocalToISO("")).toBeNull();
  });
});
