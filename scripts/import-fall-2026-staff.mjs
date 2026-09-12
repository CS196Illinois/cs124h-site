import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const records = JSON.parse(fs.readFileSync(path.join(root, "data/fall_2026_staff.json"))).staff;
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const storageBase = `${process.env.SUPABASE_URL}/storage/v1/object/public`;
const sourceDir = process.env.STAFF_IMAGE_SOURCE || "/tmp/cs124h-staff-images";
const mime = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

for (const record of records) {
  const ext = path.extname(record.image);
  const netID = record.email.split("@")[0];
  const localPath = record.image.includes("/fall-2026/")
    ? path.join(sourceDir, `${netID}${ext}`)
    : null;
  if (localPath && fs.existsSync(localPath)) {
    const storagePath = `fall-2026/${netID}${ext}`;
    const { error } = await client.storage.from("staff-images").upload(
      storagePath,
      fs.readFileSync(localPath),
      { contentType: mime[ext] || "application/octet-stream", upsert: true, cacheControl: "3600" },
    );
    if (error) throw new Error(`Uploading ${record.name}: ${error.message}`);
    record.imageUrl = `${storageBase}/staff-images/${storagePath}`;
  } else if (record.image.startsWith("/images/staff-images/")) {
    record.imageUrl = `${storageBase}/staff-images/${record.image.replace("/images/staff-images/", "")}`;
  } else {
    record.imageUrl = null;
  }
}

const { error: deleteError } = await client.from("staff").delete().eq("semester", "Fall 2026");
if (deleteError) throw new Error(`Removing old Fall 2026 staff: ${deleteError.message}`);
for (let index = 0; index < records.length; index += 1) {
  const record = records[index];
  const { error } = await client.from("staff").insert({
    semester: "Fall 2026", semester_order: 0, member_order: index,
    name: record.name, role: record.role, image_url: record.imageUrl,
    year: record.year, major: record.major, semesters_count: record.semesters,
    bio: record.bio, email: record.email,
  });
  if (error) throw new Error(`Saving ${record.name}: ${error.message}`);
}
for (const record of records) {
  const role = { "Course Lead": "LEAD", "Lead Web Developer": "LEAD_WEB", "Web Developer": "WEB", "Project Manager": "PM" }[record.role];
  const { error } = await client.from("user-testing").update({ name: record.name, role }).eq("net_id", record.email.split("@")[0]);
  if (error) throw new Error(`Updating roster ${record.email}: ${error.message}`);
}
console.log(`Imported ${records.length} Fall 2026 staff records and updated matching roster names.`);
