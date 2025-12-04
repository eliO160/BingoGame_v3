// src/lib/day.js
// Single source of truth for "what day is active?"

const PT_TZ = 'America/Los_Angeles';

// Configure your event "Friday" start in PT.
// Example: Nov 21, 2025 00:00 PT
const FALLBACK_START_ISO = '2025-11-21T00:00:00-08:00';

function nowInPT() {
  // Convert "now" to PT by round-tripping through a locale string
  return new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));
}

function parseStart() {
  const iso = process.env.NEXT_PUBLIC_EVENT_START || FALLBACK_START_ISO;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid NEXT_PUBLIC_EVENT_START ISO string');
  }
  return d;
}

// clamp to [day1, day2]
function dayForInstant(instant, start) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = instant.getTime() - start.getTime();
  if (diff < 0) return 'day1';
  if (diff < msPerDay) return 'day1';      // Friday 00:00–23:59 PT
  if (diff < 2 * msPerDay) return 'day2';  // Saturday 00:00–23:59 PT
  return 'day2';                            // Never advance beyond day2
}

export async function resolveActiveDay(redis, hintDay) {
  // 1) If the caller explicitly passed a valid day, honor it
  if (hintDay === 'day1' || hintDay === 'day2') return { day: hintDay, source: 'hint' };

  // 2) Manual override stored in Redis (set via admin API below)
  //    Value should be 'day1' or 'day2'
  try {
    const override = await redis.get('day:override');
    if (override === 'day1' || override === 'day2') {
      return { day: override, source: 'override' };
    }
  } catch (_) {}

  // 3) Automatic window based on PT midnight boundaries
  const start = parseStart();
  const nowPT = nowInPT();
  const autoDay = dayForInstant(nowPT, start);
  return { day: autoDay, source: 'auto' };
}
