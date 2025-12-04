import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { resolveActiveDay } from '@/lib/day';

function requireAuth(request) {
  const hdr = request.headers.get('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request) {
  try {
    const { day, source } = await resolveActiveDay(redis, undefined);
    const override = await redis.get('day:override');
    return NextResponse.json({ day, source, override: override || null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;
  try {
    const { day } = await request.json();
    if (day !== 'day1' && day !== 'day2') {
      return NextResponse.json({ error: 'day must be "day1" or "day2"' }, { status: 400 });
    }
    await redis.set('day:override', day);
    return NextResponse.json({ ok: true, override: day });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authErr = requireAuth(request);
  if (authErr) return authErr;
  try {
    await redis.del('day:override');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
