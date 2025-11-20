import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request) {
  try {
    const { boxId, promptText, day = 'day1', action } = await request.json();
    if (!boxId) return NextResponse.json({ error: 'boxId required' }, { status: 400 });

    const boxKey = `clicks:box:${day}:${boxId}`;

    let boxCount;

    if (action === 'check') {
      // +1
      boxCount = await redis.incr(boxKey);
    } else if (action === 'uncheck') {
      // -1 but never below 0
      boxCount = await redis.incrby(boxKey, -1);
      if (boxCount < 0) {
        await redis.set(boxKey, 0);
        boxCount = 0;
      }
    } else {
      // unknown action: ignore
      return NextResponse.json({ ok: true, skipped: true });
    }

    return NextResponse.json({ ok: true, boxKey, boxCount });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
