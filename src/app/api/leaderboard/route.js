// app/api/leaderboard/route.js
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { readFile } from 'fs/promises';
import path from 'path';
import { resolveActiveDay } from '@/lib/day';

// Note: Node runtime so we can read from the filesystem.
// (Do NOT set export const runtime = 'edge' here.)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientDay = searchParams.get('day');
    const { day, source } = await resolveActiveDay(redis, clientDay);

    // 1) Load prompts for the requested day
    const promptsPath = path.join(process.cwd(), 'public', 'prompts.json');
    const raw = await readFile(promptsPath, 'utf-8');
    const json = JSON.parse(raw);

    const src = Array.isArray(json?.[day]) ? json[day] : [];
    const first24 = src.slice(0, 24);
    const full25 = [
      ...first24.slice(0, 12),
      'Free Space',
      ...first24.slice(12),
    ];

    // 2) Build 25 boxes (same IDs as your Card)
    const size = 5;
    const boxes = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        boxes.push({
          boxId: `r${r + 1}c${c + 1}`,
          text: full25[i] ?? `Prompt ${i + 1}`,
        });
      }
    }

    // 3) Pull counts for all boxes in one call
    const keys = boxes.map(b => `clicks:box:${day}:${b.boxId}`);
    const counts = await redis.mget(...keys); // [string|null,...]

    // 4) Merge + sort (desc by count; stable by boxId)
    let items = boxes.map((b, i) => ({
      boxId: b.boxId,
      text: b.text,
      count: Number(counts?.[i] ?? 0),
    }));

    // Remove Free Space from leaderboard (center box r3c3)
    items = items.filter(item => item.boxId !== 'r3c3' && item.text !== 'Free Space');

    items.sort((a, b) => (b.count - a.count) || a.boxId.localeCompare(b.boxId));

    return NextResponse.json({ day, items });

  } catch (err) {
    return NextResponse.json(
      { error: err?.message || 'Failed to build prompt leaderboard' },
      { status: 500 }
    );
  }
}
