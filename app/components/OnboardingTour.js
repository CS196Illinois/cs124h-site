"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./OnboardingTour.module.css";

const ROLE_LABELS = {
  course_lead: "Course Lead", head_pm: "Head PM", lead_web_dev: "Lead Web Dev",
  pm: "Project Manager", web_dev: "Web Developer", student: "Student",
};

const TOUR_STEPS = {
  course_lead: [
    ["Your course command center", "This dashboard is the home for people, sprints, action items, events, attendance, gradebook, and course settings. The sidebar is organized by the work you need to do."],
    ["People and permissions", "People is the source of truth for names, roles, groups, and login access. Keep role and group assignments current before assigning work or opening a group check."],
    ["Plan each sprint", "Create a sprint with a goal, start date, and end date. Sprints stay hidden from staff and students until the start date, so you can prepare future weeks safely."],
    ["Manage the question bank", "Course Leads maintain shared understanding-check questions. Select one or more questions for each sprint, add new questions when needed, and remove outdated shared questions."],
    ["Coordinate action items", "Use Action Items for owned work, deadlines, completion, grading, and feedback. Assign the right person or audience and use a clear description so the result is unambiguous."],
    ["Create scoped events", "Events can target everyone, one or more roles, groups, or selected individuals. The audience controls who sees the event and who can check in."],
    ["Run attendance", "Open check-in only when the event starts, display the rotating code or QR code, then review attendees. Correct mistaken check-ins and close the window when the event ends."],
    ["Use Gradebook as the record", "Review course, group, and student progress; open assignment details for feedback and grading; and export a CSV when the teaching team needs a snapshot."],
    ["Finish with a health check", "Before each week closes, confirm the sprint is visible at the right time, all intended groups have access, action items have owners, and attendance or grades do not need correction."],
  ],
  head_pm: [
    ["Your PM leadership workspace", "Use the dashboard to support every group, monitor weekly progress, manage PMs and students within your permissions, and keep course operations moving."],
    ["Start with People", "Confirm PM roles and group assignments before the week begins. A correct group is what limits PM views and keeps assignments and sprint checks scoped correctly."],
    ["Coordinate the weekly plan", "Review future sprints, goals, and understanding checks. Future sprints remain hidden from staff and students until their start date."],
    ["Support PM work", "Use Action Items for follow-ups and gradebook for completed gradable work. Check ownership and feedback when a student or PM needs help."],
    ["Run scoped events", "Create events for everyone, roles, groups, or individuals. Open check-in only for the intended audience and review attendance after the event."],
    ["Review progress", "Use Gradebook to compare groups, inspect assignment history, and export a CSV for course-lead review. Treat the database record as the source of truth."],
    ["Handle exceptions", "When a PM reports an error, read the full alert, confirm the sprint, group, owner, or audience, and retry only after correcting the underlying data."],
  ],
  lead_web_dev: [
    ["Your web team workspace", "You have course visibility plus tools for web roles, role-view requests, events, and safe dashboard previews. Use the sidebar to switch between operational and developer work."],
    ["Manage access carefully", "People maintains web roles and groups. Role Requests controls which dashboards a Web Dev may preview; approve only what is needed and revoke access when it expires."],
    ["Use sandbox mode first", "Sandbox keeps event, sprint, action-item, and roster experiments private to you. The banner shows the active mode; reset the sandbox when the experiment is complete."],
    ["Check production boundaries", "Sandbox changes never update course data. When you intentionally work in production, verify the role, audience, group, and record before saving."],
    ["Support events and attendance", "Events can target roles, groups, or people. Check the audience and open-window behavior when debugging visibility or check-in reports."],
    ["Leave a clear handoff", "Record what changed, which role or audience was affected, and how to reproduce the result. Use the visible error text and support code when escalating."],
  ],
  pm: [
    ["Your PM workspace", "You operate one assigned group. The sidebar links to My Students, Action Items, Gradebook, Events, Sprints, Attendance, and this PM Guide."],
    ["Confirm your roster", "Open My Students at the start of the week. Verify every student, group number, NetID, and name. Ask a course lead to fix role or group data; do not work around an incorrect roster."],
    ["Know your scope", "Your student, action-item, gradebook, and sprint-check views are limited to your assigned group. Course Leads and authorized managers can work across groups."],
    ["Assign an action item", "Choose the recipient, write a specific title and description, set a due date, and enable grading only when a score is required. Review the final audience before saving."],
    ["Track completion", "Use To Do and Completed views to see what is outstanding. A student must mark work complete before a gradable item can be graded. Reopening work clears its grade for a fresh review."],
    ["Open a sprint check", "Open the current sprint’s understanding check for your group during the meeting. Students can answer only while the window is open; close it when the response period ends."],
    ["Choose questions", "Select one or more shared bank questions for that week. You may add a custom question. PMs can add questions but cannot remove shared bank questions; ask a Course Lead to edit the bank."],
    ["Respect sprint timing", "Sprints before their start date are hidden from PMs and students. If a sprint is missing, check the date and ask a Course Lead rather than creating a duplicate."],
    ["Create the right event", "Use Events for meetings or activities that need attendance. Choose everyone, one or more roles, groups, or selected people; the audience determines visibility and check-in access."],
    ["Open and close attendance", "Open check-in when the event begins and share the rotating code or QR code. Review Attendees afterward, manually add only confirmed attendees, remove mistakes, and close check-in when finished."],
    ["Grade completed work", "Grade only completed gradable items assigned by you. Scores must be from 0 through the item maximum; zero is valid. Add concise, actionable feedback and clear a grade only when a re-review is needed."],
    ["Use Gradebook views", "Filter by group or assignment, open a student for history, and export when you need a copy. If an item is missing, confirm its owner, recipient, completion state, and gradable setting."],
    ["Handle errors safely", "Read the complete alert, correct the named field, and retry once. Refresh if the page is stale. Do not duplicate a sprint, event, or action item while a save is still processing."],
    ["Escalate with useful details", "If the problem remains, send a Course Lead the page, student or sprint, action you attempted, timestamp, and any support code from the alert. Never include a student password or private login information."],
    ["Your weekly closeout", "Before moving on, confirm every intended student saw the sprint check, outstanding work has an owner, completed gradable work is reviewed, event attendance is correct, and no error banner remains."],
    ["Keep the guide handy", "The PM Guide in the sidebar is the complete reference for permissions, weekly operations, question selection, events, attendance, gradebook, and troubleshooting."],
  ],
  web_dev: [
    ["Your web developer workspace", "Your dashboard combines web-team access with group tools when a group is assigned. The sidebar changes with the role you are currently viewing."],
    ["Preview safely", "Use sandbox mode before changing events, sprints, action items, or people. Sandbox work is private and can be reset without changing real course data."],
    ["Understand the weekly flow", "Action Items track owned work, Sprints track progress and checks, Events handle meetings, and Attendance records check-ins."],
    ["Respect visibility", "Sprints before their start date are hidden from PMs and students. Events are visible only to their selected audience, and only that audience can check in."],
    ["Ask before changing production", "When a fix is ready, verify the affected role, group, audience, and record. Leave a clear handoff with the error text and reproduction steps."],
  ],
  student: [
    ["Welcome to CS 124H", "This is your personal course workspace. The sidebar leads to your action items, sprint checks, events, attendance, and progress."],
    ["Start with Action Items", "To Do shows work waiting for you. Read the full description and due date, then mark an item complete only after the work is ready for review."],
    ["Understand grading", "Completed gradable work moves to your PM’s grading queue. Review feedback in the item history; a reopened item may need to be completed again before it can be graded."],
    ["Complete sprint checks", "Your sprint goal and questions appear when your PM opens your group’s check. Answer every question and submit once; after submission, your saved response remains available."],
    ["Join the right events", "Events shared with you appear in Attendance. Enter the rotating code shown by staff or scan the QR code while check-in is open."],
    ["Protect your account", "Use only your own login and report a wrong name, group, or event audience to staff. Do not share check-in codes outside the event."],
    ["Find help", "If a save fails, read the alert and retry after checking the requested field. Contact your PM or a Course Lead with the page and exact message if it continues."],
  ],
};

export default function OnboardingTour() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const steps = useMemo(() => TOUR_STEPS[role] || [], [role]);
  const storageKey = role && session?.user?.netID ? `cs124h-onboarding:${session.user.netID}:${role}` : null;

  useEffect(() => {
    if (status !== "authenticated" || !storageKey || process.env.NEXT_PUBLIC_E2E === "true") return;
    // The auth callback determines first-login status from the roster's
    // Supabase `sub` field before it claims the row. Existing users should
    // never be interrupted by a new-user tour, even on a new browser.
    if (session?.user?.isNewUser !== true) {
      setDismissed(true);
      setReady(true);
      return;
    }
    setDismissed(window.localStorage.getItem(storageKey) === "complete");
    setReady(true);
  }, [status, storageKey]);

  if (!ready || dismissed || !steps.length || pathname === "/signin" || pathname === "/unauthorized") return null;
  const last = step === steps.length - 1;
  const finish = () => { if (storageKey) window.localStorage.setItem(storageKey, "complete"); setDismissed(true); };
  const [title, copy] = steps[step];

  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className={styles.progress}><span>Getting started · {ROLE_LABELS[role]}</span><span>{step + 1}/{steps.length}</span></div>
        <div className={styles.progressBar}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <div className={styles.illustration} aria-hidden="true">{last ? "✓" : "✦"}</div>
        <h2 id="onboarding-title">{title}</h2>
        <p>{copy}</p>
        <div className={styles.actions}>
          <button className={styles.skip} onClick={finish}>Skip tour</button>
          {step > 0 && <button className={styles.secondary} onClick={() => setStep(step - 1)}>Back</button>}
          <button className={styles.primary} onClick={() => last ? finish() : setStep(step + 1)}>{last ? "Go to my dashboard" : "Next"}</button>
        </div>
      </section>
    </div>
  );
}
