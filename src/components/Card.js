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
        checked: i === 12 && text === 'Free Space', // center prechecked if Free Space
        row: r + 1,
        col: c + 1,
      });
      n++;
    }
  }
  return boxes;
}

export default function Card({ onFirstWin, disablePopover = false }) {
  const size = 5;

  // Start with placeholders; we'll replace after fetch:
  const [boxes, setBoxes] = useState(() => makeBoxes(size));
  const [winner, setWinner] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const hasShownPopoverRef = useRef(false);
  const notifiedFirstWinRef = useRef(false);

  // 🔑 Fetch /public/prompts.json and build the 25 texts (24 + "Free Space" at center)
  useEffect(() => {
    let alive = true;

    fetch('/prompts.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;

        // pick the set you want (day1 here)
        const day = 'day1'; // change to 'day2' or derive elsewhere

        const src = Array.isArray(data?.[day]) ? data[day] : [];
        const first24 = src.slice(0, 24);

        // build exactly 25 entries with center = "Free Space"
        const full25 = [
          ...first24.slice(0, 12),
          'Free Space',
          ...first24.slice(12),
        ];

        // sanity checks (helps debug)
        // console.log('full25 length:', full25.length, full25);

        setBoxes(makeBoxes(size, full25));
      })
      .catch((err) => {
        // console.error('Failed to load prompts.json', err);
        // leave placeholders
      });

    return () => { alive = false; };
  }, [size]);

  function onToggle(boxId) {
    setBoxes(prev =>
      prev.map(b => (b.boxId === boxId ? { ...b, checked: !b.checked } : b))
    );
  }

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
