import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Card from "@/lib/models/Card";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { cardId } = await params;

  await dbConnect();
  const card = await Card.findById(cardId).lean();
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
  return NextResponse.json({ card });
}
