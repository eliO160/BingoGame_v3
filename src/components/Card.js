'use client';
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
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
        checked: i === 12 && text === 'Free Space',
        row: r + 1,
        col: c + 1,
      });
      n++;
    }
  }
  return boxes;
}

function hashTexts(arr) {
  const s = JSON.stringify(arr || []);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
}

const Card = forwardRef(function Card(
  { onFirstWin, onWinChange }, // onWinChange(boolean)
  ref
) {
  const size = 5;
  const day = 'day1';

  const { STORAGE_KEY, TEXTS_KEY } = useMemo(() => ({
    STORAGE_KEY: `bingo:${day}:checked`,
    TEXTS_KEY: `bingo:${day}:textsHash`,
  }), [day]);

  const [boxes, setBoxes] = useState(() => makeBoxes(size));
  const [winner, setWinner] = useState(false);

  const notifiedFirstWinRef = useRef(false);
  const promptsReadyRef = useRef(false);

  // Expose an imperative reset for parent to call from WinButton
  useImperativeHandle(ref, () => ({
    resetCard() {
      setBoxes(prev => prev.map(b => ({ ...b, checked: b.boxId === 'r3c3' && b.text === 'Free Space' })));
      setWinner(false);
      localStorage.removeItem(STORAGE_KEY);
      onWinChange?.(false);
      notifiedFirstWinRef.current = false; // allow first-win again (optional)
    }
  }), [STORAGE_KEY, onWinChange]);

  // load prompts + restore saved checks
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/prompts.json', { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;

        const src = Array.isArray(data?.[day]) ? data[day] : [];
        const first24 = src.slice(0, 24);
        const full25 = [...first24.slice(0, 12), 'Free Space', ...first24.slice(12)];

        const textsHash = hashTexts(full25);
        const savedHash = typeof window !== 'undefined' ? localStorage.getItem(TEXTS_KEY) : null;
        const savedChecked = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
          : [];

        if (savedHash && savedHash !== textsHash) {
          localStorage.removeItem(STORAGE_KEY);
        }

        const fresh = makeBoxes(size, full25);
        const savedSet = new Set(savedChecked);
        const restored = fresh.map(b => (savedSet.has(b.boxId) ? { ...b, checked: true } : b));

        setBoxes(restored);
        promptsReadyRef.current = true;
        localStorage.setItem(TEXTS_KEY, textsHash);
      } catch {
        // ignore
      }
    })();
    // ✅ include all referenced values
    return () => { alive = false; };
  }, [size, day, STORAGE_KEY, TEXTS_KEY]);

  // persist checked boxes
  useEffect(() => {
    if (!promptsReadyRef.current) return;
    const checkedIds = boxes.filter(b => b.checked).map(b => b.boxId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
  }, [boxes, STORAGE_KEY]);

  // Win detection
  useEffect(() => {
    const doneArr = boxes.filter(b => b.checked).map(b => b.n);
    const won = checkWin(doneArr);
    setWinner(won);
    onWinChange?.(won);

    if (won && !notifiedFirstWinRef.current) {
      onFirstWin?.();
      notifiedFirstWinRef.current = true;
    }
  }, [boxes, onFirstWin, onWinChange]);

  function onToggle(boxId) {
    const next = boxes.map(b => (b.boxId === boxId ? { ...b, checked: !b.checked } : b));
    setBoxes(next);

    // optional analytics
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
      {/* Removed the "Bingo achieved!" banner entirely */}
    </div>
  );
});

export default Card;
