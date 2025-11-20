// components/Leaderboard.js
'use client';
import { useEffect, useState } from 'react';

export default function Leaderboard({ day = 'day1', limit = 25 }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/leaderboard?day=${day}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.items)) {
          // items are already sorted desc by count; trim to limit on the client
          setRows(data.items.slice(0, limit));
        } else {
          setRows([]);
        }
      })
      .catch(e => setErr(e?.message || 'Failed to load'));
  }, [day, limit]);

  return (
    <div className="mt-6 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3">Most-Clicked Prompts ({day})</h3>

      {err && <div className="text-red-600 mb-2 text-sm">{err}</div>}

      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.boxId} className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500">{i + 1} • {r.boxId}</div>
              <div className="font-medium">{r.text}</div>
            </div>
            <div className="ml-2 shrink-0 tabular-nums font-semibold">{r.count}</div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-gray-500">No data yet.</li>}
      </ol>
    </div>
  );
}
