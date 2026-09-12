# Website audit — September 11, 2026

## Scope

Reviewed public pages, role navigation and permissions, gradebook calculations and exports, grading workflows, keyboard/mobile usability, and the existing attendance, sprint, sandbox, and people-management suites. Tests use dedicated Supabase `test_` tables. No production data was intentionally modified.

## Changes

- **Grade integrity:** reject blank/non-numeric scores and incompatible completion/grading edits; validate against the resulting maximum score; prevent lowering a maximum below an existing grade; clear stale feedback when clearing/reopening grades.
- **Concurrent grading:** batch saves update existing rows instead of upserting, preventing deleted items from being recreated. Single and batch grade saves recheck completion/gradable status and maximum score before writing. Batch feedback survives saves when no replacement feedback was entered, and partial saves are reported.
- **Permissions:** PM/head-PM action-item reads are scoped on the server; staff completion changes require recipient management authority or ownership. Non-lead-web roles cannot enter lead-web pages.
- **Authentication:** callback redirects require an exact same-origin match; roster claiming only succeeds when the atomic update actually claims the row.
- **Gradebook UX:** explicit request errors and retry controls, accurate loading text, accessible assignment labels, keyboard-operated group expansion, pressed-state view controls, an expandable explanation of averaging rules, visible/exported feedback, compact mobile summaries, and mobile layout constraints.
- **Dialogs/navigation:** dialog semantics, keyboard focus containment/restoration, Escape handling, correct overlay stacking, and closed mobile sidebars excluded from keyboard navigation.
- **Exports:** quote carriage returns correctly and neutralize spreadsheet formulas in text fields; student export filenames use the local date.
- **Public pages:** cards tolerate missing optional member/image data; failed images stop retrying an external placeholder; the calendar iframe has a title.
- **Scoped events:** non-student staff can target events to everyone, selected people, roles, or groups. Visibility and check-in are filtered server-side. Apply [scripts/migrate-event-audiences.sql](scripts/migrate-event-audiences.sql) before using this in production.
- **Onboarding:** each role gets a tailored four-step interactive tour with progress, skip/back/next controls, responsive styling, and per-user/per-role completion memory.
- **Dependencies/harness:** repaired an incomplete dependency installation, applied compatible security updates, overrode the vulnerable Next.js PostCSS pin, isolated browser test-server startup, and stopped the previous test page before replacing its session cookie.

## Verification

- **API/regression tests:** 212 passed in the complete expanded suite, including scoped audience matching and the concurrent roster-claim regression.
- **Production browser suite:** all 91 Chromium tests passed in one run (3.7 minutes), including all existing workflows, ten new gradebook UX/permission cases, and eight additional public-page checks.
- **Production build:** passed with the compatible dependency updates and patched PostCSS override. Browser tests also build and serve the production bundle with test-table flags.
- **Dependency audit:** `npm audit fix` completed with zero reported vulnerabilities, including development dependencies.
- **Final mobile gradebook refinement:** 12 focused gradebook tests passed after the compact mobile summary change.
- **Scoped event browser regression:** 9 focused production Chromium workflows passed, covering creation, rotating check-in codes, attendee management, permissions, deletion undo, and narrow-screen modal layout.

The initial development-server runs exposed timing failures during on-demand route compilation. Browser verification now builds the app first, uses a dedicated production-mode server, and allows 60 seconds for a complete multi-step workflow. Per-assertion checks remain 10 seconds. The final production run passed without retries.

Commands and test-environment requirements are in [TESTING.md](TESTING.md).

## Limits

Automated sessions bypass the real CILogon handshake. Live Google Sheets writes/access changes are disabled in test mode. The audit does not certify production data/configuration, external links/services, other browser engines, full accessibility compliance, or large-scale concurrent traffic. Passing tests cannot establish that the site has zero defects.
