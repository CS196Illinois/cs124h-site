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
    ["Your course command center", "Welcome! This tour highlights the tools you will use to coordinate people, assignments, events, sprints, and grades across the course."],
    ["Build a clear course rhythm", "Use Sprints to publish weekly goals and understanding checks. Use Action Items for work that needs an owner, due date, or grade."],
    ["Keep events focused", "Create events for everyone, selected roles, groups, or individual people. Open check-in when your meeting begins and review attendance afterward."],
    ["Review with confidence", "Gradebook gives course and group averages, assignment drill-downs, feedback, and CSV exports. The People page is where roster roles and groups are maintained."],
  ],
  head_pm: [
    ["Your PM leadership workspace", "Welcome! You can coordinate PMs and students, review progress, and keep weekly work moving across groups."],
    ["Support the groups", "Use Action Items to assign work and grade completed items. Sprints let you track completion and open understanding checks for groups."],
    ["Run focused events", "Events can target everyone, specific roles, groups, or people. Open check-in only for the intended audience and review attendance from the event row."],
    ["Spot what needs attention", "Gradebook shows group-by-group averages and assignment progress. Use exports when you need to share a snapshot with the teaching team."],
  ],
  lead_web_dev: [
    ["Your web team workspace", "Welcome! You have broad course visibility plus web-team tools for people, role requests, events, and safe dashboard previews."],
    ["Manage access carefully", "People lets you maintain web roles. Role Requests controls which dashboards a Web Dev may preview; revoke access when it is no longer needed."],
    ["Use sandbox mode", "Sandbox keeps event, sprint, action-item, and roster experiments private. The banner always shows when it is active; reset it when your experiment is finished."],
    ["Share the right event", "When creating an event, choose everyone, roles, groups, or specific people. The audience controls both visibility and check-in access."],
  ],
  pm: [
    ["Your group workspace", "This dashboard is centered on your assigned group. The sidebar gives you one place to reach students, action items, gradebook, events, sprints, and attendance."],
    ["Start with My Students", "Use My Students to confirm your roster and group. Student names and NetIDs are the source of truth when assigning work or correcting attendance."],
    ["Assign work clearly", "Use Action Items for work with an owner and due date. Choose one student or your group, explain the expected result, and enable grading only when a score is needed."],
    ["Run the weekly check", "In Sprints, open your group’s understanding check during the meeting and close it afterward. You can choose shared questions and add a custom question, but shared bank questions stay in place."],
    ["Run events safely", "Create an event for everyone, a role, a group, or selected people. Open check-in when ready, then use Attendees to review or correct the roster."],
    ["Grade consistently", "Gradebook shows completed gradable work. Open a student for history and feedback, use zero for work that earns no points, and export when you need a copy."],
    ["Need a quick reference?", "The PM Guide in the sidebar explains the weekly workflow, permissions, grading rules, attendance corrections, and what to do when something fails."],
  ],
  web_dev: [
    ["Your web developer workspace", "Welcome! Your dashboard combines web-team access with group tools when you have a group assigned."],
    ["Preview safely", "Use sandbox mode before trying changes to events, sprints, action items, or people. Nothing in the sandbox reaches real course data."],
    ["Follow the weekly flow", "Action Items track owned work, Sprints track group progress, and Events handle meetings and attendance. Your navigation keeps these together."],
    ["Respect audience boundaries", "Events can be targeted to roles, groups, or individuals. Only people in the selected audience can see the event and check in."],
  ],
  student: [
    ["Welcome to CS 124H", "This is your personal course workspace. You will find your action items, sprint checks, event check-in, and progress here."],
    ["Start with Action Items", "To Do shows work waiting for you. Mark an item complete when finished; completed gradable work moves to the grading queue for your PM."],
    ["Join the right events", "Events shared with you appear in Attendance. Enter the rotating code shown by staff, or scan the event QR code, while check-in is open."],
    ["See your progress", "Your sprint page shows weekly goals and checks when your PM opens them. Use the sidebar to return to your dashboard anytime."],
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
