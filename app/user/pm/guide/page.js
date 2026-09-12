import styles from "../../dashboard.module.css";

export const metadata = { title: "PM Guide" };

export default function PMGuidePage() {
  return <main className={styles.container}>
    <div className={styles.header}><h1>PM Guide</h1><p>The practical workflow for running your group in CS 124H.</p></div>
    <section className={styles.panel} style={{ maxWidth: 820, lineHeight: 1.65 }}>
      <h2>Weekly workflow</h2>
      <ol>
        <li>Open <strong>My Students</strong> and confirm your group roster.</li>
        <li>Review <strong>Action Items</strong>. Assign new work with a clear title, owner, due date, and description.</li>
        <li>Open the group’s <strong>Sprint</strong> understanding check during the meeting. Close it when everyone has had time to submit.</li>
        <li>Create an <strong>Event</strong> for the meeting when attendance is needed. Select the intended audience before opening check-in.</li>
        <li>Use <strong>Attendees</strong> to verify check-ins. Manually add a student only when you have confirmed they attended; remove mistakes immediately.</li>
        <li>Open <strong>Gradebook</strong> after work is complete. Grade only completed gradable items and leave specific feedback when a student can improve.</li>
      </ol>
      <h2>Understanding checks</h2>
      <p>Choose any shared question-bank questions for the week. You may add a custom question. Shared questions cannot be removed by PMs; ask a course lead to change the bank. Students can only see questions while your group’s check is open, or afterward if they submitted.</p>
      <h2>Grading rules</h2>
      <ul><li>Scores must be from 0 through the assignment maximum.</li><li>Zero is a valid score; do not leave a blank when the work earned no points.</li><li>Only the person who assigned an item can grade it.</li><li>Reopening completed work clears its existing grade so it can be reviewed again.</li></ul>
      <h2>When something goes wrong</h2>
      <p>Read the message shown in the red alert, correct the requested field, and retry once. Refresh if the page is stale. If a save still fails, record the page, student or sprint, and the support code shown in the message, then send it to a course lead.</p>
    </section>
  </main>;
}
