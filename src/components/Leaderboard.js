'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleArrowLeft, ChevronDown } from 'lucide-react';

export default function Leaderboard({ limit = 25 }) {
  const router = useRouter();
  const [current, setCurrent] = useState({ day: '', rows: [] });
  const [past, setPast] = useState({ day: '', rows: [] });
  const [err, setErr] = useState('');
  const [currentOpen, setCurrentOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1) Current day leaderboard (auto/override)
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;

        const currentDay = data?.day || 'day1';
        const rows = Array.isArray(data?.items) ? data.items.slice(0, limit) : [];
        setCurrent({ day: currentDay, rows });

        // 2) If we are on day2, also fetch day1 as "previous day"
        if (currentDay === 'day2') {
          const res2 = await fetch('/api/leaderboard?day=day1', { cache: 'no-store' });
          const data2 = await res2.json();
          if (cancelled) return;

          const rows2 = Array.isArray(data2?.items) ? data2.items.slice(0, limit) : [];
          setPast({ day: data2?.day || 'day1', rows: rows2 });
        } else {
          // On day1, don't spam day1 twice
          setPast({ day: '', rows: [] });
        }

        setErr('');
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load');
      }
    }

    load();
    // 🔹 Poll every 15s instead of 5s
    const id = setInterval(load, 15000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [limit]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  const List = ({ label, rows, isOpen, onToggle }) => (
    <div className="rounded-lg border p-4">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold">{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.boxId} className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">
                  {i + 1}. {r.text}
                </div>
              </div>
              <div className="ml-2 shrink-0 tabular-nums font-semibold">
                Counts: {r.count}
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-gray-500">No data yet.</li>}
        </ol>
      )}
    </div>
  );

  return (
    <>
      {/* Header row (outside the bordered box) */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          aria-label="Go back"
        >
          <CircleArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      {err && <div className="text-red-600 mb-2 text-sm">{err}</div>}

      {/* CURRENT DAY */}
      {current.day && (
        <List
          label={current.day.toUpperCase()}
          rows={current.rows}
          isOpen={currentOpen}
          onToggle={() => setCurrentOpen(open => !open)}
        />
      )}

      {/* PREVIOUS DAY – only once we're in day2 */}
      {current.day === 'day2' && past.day && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Previous Day
          </h2>
          <List
            label={past.day.toUpperCase()}
            rows={past.rows}
            isOpen={pastOpen}
            onToggle={() => setPastOpen(open => !open)}
          />
        </div>
      )}
    </>
  );
}
