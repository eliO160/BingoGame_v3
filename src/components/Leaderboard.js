'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleArrowLeft } from 'lucide-react';

export default function Leaderboard({ day = 'day1', limit = 25 }) {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/leaderboard?day=${day}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setRows(Array.isArray(data?.items) ? data.items.slice(0, limit) : []))
      .catch(e => setErr(e?.message || 'Failed to load'));
  }, [day, limit]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

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
        
        <h3 className="text-lg font-semibold">
          Most Popular Prompts
        </h3>
      </div>

      {/* Bordered content box */}
      <div className="rounded-lg border p-4">
        {err && <div className="text-red-600 mb-2 text-sm">{err}</div>}
        <h3 className="text-lg">{(day)}</h3>
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.boxId} className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">{i + 1}. {r.text}</div>
              </div>
              <div className="ml-2 shrink-0 tabular-nums font-semibold">Counts: {r.count}</div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-gray-500">No data yet.</li>}
        </ol>
      </div>
    </>
  );
}
