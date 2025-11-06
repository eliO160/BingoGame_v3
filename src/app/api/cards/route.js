import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Prompt from "@/lib/models/Prompt";
import Card from "@/lib/models/Card";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  await dbConnect();

  const size = 5, count = size * size;
  const prompts = await Prompt.find({ active: true }).sort({ _id: 1 }).limit(count).lean();
  if (prompts.length !== count) {
    return NextResponse.json({ error: `Need ${count} active prompts, found ${prompts.length}` }, { status: 400 });
  }

  const boxes = [];
  let n = 1;
  for (let r = 1; r <= size; r++) {
    for (let c = 1; c <= size; c++) {
      const i = (r - 1) * size + (c - 1);
      const p = prompts[i];
      boxes.push({
        n, row: r, col: c,
        promptId: p._id,
        promptTextSnapshot: p.text,
        checked: false,
        checkCount: 0
      });
      n++;
    }
  }

  const cardId = crypto.randomUUID();
  const card = await Card.create({ _id: cardId, size, boxes });
  return NextResponse.json({ card }, { status: 201 });
}
