import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Prompt from "@/lib/models/Prompt";

export const dynamic = "force-dynamic";

const FIXED_PROMPTS = [
  "Asked a question during a panel or session",
  "Corrected a mistake while doing a major based project",
  "Asked a professional how they prepared for their career",
  "Found a professional who is an alumni CSUF",
  "Met someone with a different major",
  "Find someone graduating or an alumni",
  "Follow someone new on LinkedIn",
  "Met someone who has/had an internship",
  "Follow @CSUFECS SUMMIT on Instagram",
  "Cried about an exam",
  "Discover a shared hobby outside of school",
  "Find someone who did an all nighter for a test/project",
  "Free Space",
  "Talked about a personal project based on their studies",
  "Met someone who has attended a prior summit",
  "Met a professional who was involved in student club/org as a student",
  "Follow @SHPE_CSUF on Isntagram",
  "Found someone with the same major as you",
  "Discussed the importance of soft skills in CS or Engineering",
  "Learned about an internship opportunity",
  "Find a mentor or gave mentorship advice",
  "Met someone with their same career interests as you",
  "Took a group photo with new connections",
  "Asked a professional about their career journey",
  "Met professional, student, or intern working in your major"
];

export async function POST() {
  await dbConnect();
  const ops = FIXED_PROMPTS.map(text => ({
    updateOne: {
      filter: { text },
      update: { $setOnInsert: { text, active: true, checkCount: 0 } },
      upsert: true
    }
  }));
  const r = ops.length ? await Prompt.bulkWrite(ops, { ordered: false }) : { upsertedCount: 0 };
  return NextResponse.json({ ok: true, upserted: r.upsertedCount ?? 0 });
}
