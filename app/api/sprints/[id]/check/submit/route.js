import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { supabaseServer } from "../../../../../../lib/supabaseServer";
import { table } from "../../../../../../lib/tables";
import { resolveMaxScore, formatCheckAnswers } from "../../../../../../lib/sprintChecks";

// Student only - web_dev/lead_web_dev sandbox previews never reach here,
// since neither role can itself be "student".
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;
  if (userRole !== "student") {
    return NextResponse.json({ error: "Only students can submit an understanding check" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const answers = Array.isArray(body?.answers) ? body.answers : null;

  const { data: sprint } = await supabaseServer.from(table("sprints")).select("*").eq("id", id).maybeSingle();
  const questions = Array.isArray(sprint?.check_questions) ? sprint.check_questions : [];
  if (!questions.length) {
    return NextResponse.json({ error: "This sprint has no understanding check" }, { status: 400 });
  }
  if (!answers || answers.length !== questions.length || answers.some((a) => !String(a ?? "").trim())) {
    return NextResponse.json({ error: "Answer every question" }, { status: 400 });
  }

  const { data: me } = await supabaseServer.from(table("users")).select("group_number").eq("net_id", netID).maybeSingle();
  const { data: window } = await supabaseServer
    .from(table("sprintCheckWindows"))
    .select("*")
    .eq("sprint_id", id)
    .eq("group_number", me?.group_number ?? -1)
    .maybeSingle();
  if (!window?.is_open) {
    return NextResponse.json({ error: "This check isn't open right now" }, { status: 403 });
  }

  const now = new Date().toISOString();
  // The production action_items constraint requires completion_date to be
  // strictly after created_at, so leave a small margin instead of using the
  // same timestamp for both fields.
  const createdAt = new Date(Date.now() - 1000).toISOString();
  const row = {
    net_id: netID,
    title: `Sprint ${sprint.number} Understanding Check`,
    description: formatCheckAnswers(questions, answers),
    // Set created_at explicitly. Relying on Postgres' default can put it a
    // few milliseconds after this completion timestamp and reject the row.
    created_at: createdAt,
    is_done: true,
    completion_date: now,
    assigned_by: window.opened_by,
    is_gradable: true,
    max_score: resolveMaxScore(sprint),
    batch_id: sprint.id,
    sprint_id: id,
    additional_info: { kind: "sprint_check", sprint_id: id, questions, answers },
  };

  const { data, error } = await supabaseServer.from(table("actionItems")).insert(row).select().single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already submitted this understanding check. Refresh the page to view your saved answers." }, { status: 409 });
    }
    if (error.code === "23514") {
      return NextResponse.json({
        error: "Your answers are valid, but the submission could not be saved because the action-item database rule rejected it. Please refresh and try again. If it still fails, contact a course lead and include code SPRINT_CHECK_SAVE.",
        code: "SPRINT_CHECK_SAVE",
      }, { status: 500 });
    }
    return NextResponse.json({ error: "We couldn't save your understanding check right now. Please try again. If the problem continues, contact a course lead.", code: "SPRINT_CHECK_SAVE_UNKNOWN" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
