import { describe, it, expect } from "vitest";
import { averagePct, groupAveragePct, buildAssignments, pivotColumns } from "../../lib/grading";
import { escapeCsvValue } from "../../lib/csvExport";

describe("gradebook calculations and exports", () => {
  it("includes zero grades and excludes ungraded assignments", () => {
    expect(averagePct([{ grade: 0, max_score: 50 }, { grade: 45, max_score: 50 }, { grade: null, max_score: 100 }])).toBe(45);
    expect(averagePct([])).toBeNull();
  });
  it("weights students equally despite different assignment counts", () => {
    const items = [{ net_id: "a", grade: 100, max_score: 100 }, { net_id: "a", grade: 50, max_score: 50 }, { net_id: "b", grade: 0, max_score: 100 }];
    expect(groupAveragePct([{ net_id: "a" }, { net_id: "b" }, { net_id: "c" }], items)).toBe(50);
  });
  it("preserves separate recurring assignments and zero grades in CSV columns", () => {
    const items = [
      { id: "1", title: "Weekly", is_gradable: true, net_id: "a", grade: 0, max_score: 100, batch_id: "batch" },
      { id: "2", title: "Weekly", is_gradable: true, net_id: "b", grade: 50, max_score: 100, batch_id: "batch" },
      { id: "3", title: "Weekly", is_gradable: true, net_id: "a", grade: 100, max_score: 100 },
    ];
    const assignments = buildAssignments(items);
    expect(assignments).toHaveLength(2);
    const columns = pivotColumns(assignments);
    expect(columns.find((c) => c.key === "batch").value({ net_id: "a" })).toBe(0);
    expect(columns.find((c) => c.key === "average").value({ net_id: "a" })).toBe("50.0");
  });
  it.each([
    ["a,b", '"a,b"'], ['a"b', '"a""b"'], ["a\rb", '"a\rb"'],
    ["=SUM(A1:A2)", "'=SUM(A1:A2)"], [" @SUM(1)", "' @SUM(1)"], [0, "0"], [null, ""],
  ])("safely exports %j", (input, expected) => expect(escapeCsvValue(input)).toBe(expected));
});
