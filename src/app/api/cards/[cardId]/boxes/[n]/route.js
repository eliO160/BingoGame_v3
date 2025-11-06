import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Card from "@/lib/models/Card";
import Prompt from "@/lib/models/Prompt";

export const dynamic = "force-dynamic";

export async function PATCH(_req, { params }) {
  const { cardId, n } = await params;
  const nNum = Number(n);
  if (!Number.isInteger(nNum) || nNum < 1 || nNum > 25) {
    return NextResponse.json({ error: "n must be 1..25" }, { status: 400 });
    }

  await dbConnect();
  const card = await Card.findById(cardId);
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const idx = card.boxes.findIndex(b => b.n === nNum);
  if (idx === -1) return NextResponse.json({ error: "Box not found" }, { status: 404 });

  const box = card.boxes[idx];
  const goingChecked = !box.checked;
  box.checked = goingChecked;

  if (goingChecked) {
    box.checkCount += 1;
    await Prompt.updateOne({ _id: box.promptId }, { $inc: { checkCount: 1 } });
  }

  await card.save();
  return NextResponse.json({ card });
}
