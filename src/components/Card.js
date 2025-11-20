// Card.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import Box from '@/components/Box';
import { checkWin } from '@/utils/checkWin';

function makeBoxes(size = 5, texts = []) {
  const boxes = [];
  let n = 1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const text = (Array.isArray(texts) && texts[i] != null) ? texts[i] : `Prompt ${i + 1}`;
      boxes.push({
        n,
        boxId: `r${r + 1}c${c + 1}`,
        text,
        checked: i === 12 && text === 'Free Space', // center pre-checked if Free Space
        row: r + 1,
        col: c + 1,
      });
      n++;
    }
  }
  return boxes;
}

function hashTexts(arr) {
  // cheap hash to invalidate stale saved state when prompts change
  const s = JSON.stringify(arr || []);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
}

export default function Card({ onFirstWin, disablePopover = false }) {
  const size = 5;
  const day = 'day1'; // keep consistent across routes
  const STORAGE_KEY = `bingo:${day}:checked`;
  const TEXTS_KEY = `bingo:${day}:textsHash`;

  const [boxes, setBoxes] = useState(() => makeBoxes(size));
  const [winner, setWinner] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const hasShownPopoverRef = useRef(false);
  const notifiedFirstWinRef = useRef(false);
  const promptsReadyRef = useRef(false); // don't persist until prompts loaded

  // Load prompts.json and restore saved checks
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/prompts.json', { cache: 'no-store' });
        const data = await res.json();

        if (!alive) return;

        const src = Array.isArray(data?.[day]) ? data[day] : [];
        const first24 = src.slice(0, 24);
        const full25 = [
          ...first24.slice(0, 12),
          'Free Space',
          ...first24.slice(12),
        ];

        const textsHash = hashTexts(full25);
        const savedHash = typeof window !== 'undefined' ? localStorage.getItem(TEXTS_KEY) : null;
        const savedChecked = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
          : [];

        // If prompts changed, clear saved checks to avoid mismatches
        if (savedHash && savedHash !== textsHash) {
          localStorage.removeItem(STORAGE_KEY);
        }

        // Build boxes, then overlay saved checked state
        const fresh = makeBoxes(size, full25);
        const savedSet = new Set(savedChecked);
        const restored = fresh.map(b =>
          savedSet.has(b.boxId) ? { ...b, checked: true } : b
        );

        setBoxes(restored);
        promptsReadyRef.current = true;

        // Save prompts hash so future loads can validate
        localStorage.setItem(TEXTS_KEY, textsHash);
      } catch {
        // leave placeholders if fetch fails
      }
    })();

    return () => { alive = false; };
  }, [size, day]);

  // Persist checked boxes whenever they change (after prompts are ready)
  useEffect(() => {
    if (!promptsReadyRef.current) return;
    const checkedIds = boxes.filter(b => b.checked).map(b => b.boxId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
  }, [boxes]);

  // Recompute winner and optionally show the popover
  useEffect(() => {
    const doneArr = boxes.filter(b => b.checked).map(b => b.n);
    const won = checkWin(doneArr);
    setWinner(won);

    if (won) {
      if (!notifiedFirstWinRef.current) {
        onFirstWin?.();
        notifiedFirstWinRef.current = true;
      }
      if (!hasShownPopoverRef.current && !disablePopover) {
        setShowPopover(true);
        hasShownPopoverRef.current = true;
      }
    }
  }, [boxes, onFirstWin, disablePopover]);

  function onToggle(boxId) {
    // compute next state first (no side-effects here)
    const next = boxes.map(b => (b.boxId === boxId ? { ...b, checked: !b.checked } : b));
    setBoxes(next);

    // OPTIONAL: if you still log to Redis, send exactly one event per toggle
    const before = boxes.find(b => b.boxId === boxId)?.checked;
    const after = !before;
    const toggled = next.find(b => b.boxId === boxId);
    fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        boxId,
        promptText: toggled?.text,
        day,
        action: after ? 'check' : 'uncheck',
      }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-[min(92vw,720px)]">
      <div className="pl-2 sm:pl-4">
        <div className="grid grid-cols-5 grid-rows-5 gap-px bg-gray-300 p-px rounded">
          {boxes.map(b => (
            <div
              key={b.boxId}
              style={{ gridRowStart: b.row, gridColumnStart: b.col }}
              className="bg-white aspect-square"
            >
              <Box
                boxId={b.boxId}
                text={b.text}
                checked={b.checked}
                onToggle={onToggle}
              />
            </div>
          ))}
        </div>
      </div>

      {winner && (
        <div className="mt-4 text-center">
          {/* A small persistent banner/button so it's visible after navigation */}
          <span className="inline-block rounded bg-green-100 text-green-800 px-3 py-1">
            Bingo achieved! 🎉
          </span>
        </div>
      )}

      {showPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl px-6 py-4 text-center">
            <h2 className="text-2xl font-semibold mb-2">Bingo 🎉</h2>
            <h2 className="text-xl font-semibold mb-2">
              Proceed to the table outside the entrance to claim your prize!
            </h2>
            <div className="mt-3 flex gap-2 justify-center">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => setShowPopover(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 rounded border"
                onClick={() => {
                  setBoxes(prev => prev.map(b => ({ ...b, checked: false })));
                  setShowPopover(false);
                  setWinner(false);
                  // also clear saved checks
                  localStorage.removeItem(STORAGE_KEY);
                }}
              >
                Reset Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
