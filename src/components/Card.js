'use client';
import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import Box from '@/components/Box';
import { checkWin } from '@/utils/checkWin';

function makeBoxes(size = 5, texts = []) {
  const boxes = [];
  let n = 1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const text =
        Array.isArray(texts) && texts[i] != null ? texts[i] : `Prompt ${i + 1}`;
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
  { onFirstWin, onWinChange },
  ref
) {
  const size = 5;

  const [day, setDay] = useState('day1');
  const [dayResolved, setDayResolved] = useState(false);

  const { STORAGE_KEY, TEXTS_KEY } = useMemo(
    () => ({
      STORAGE_KEY: `bingo:${day}:checked`,
      TEXTS_KEY: `bingo:${day}:textsHash`,
    }),
    [day]
  );

  const [boxes, setBoxes] = useState(() => makeBoxes(size));
  const [winner, setWinner] = useState(false);
  const [expandedBoxId, setExpandedBoxId] = useState(null); 
  
  const cardRef = useRef(null);

  const notifiedFirstWinRef = useRef(false);
  const promptsReadyRef = useRef(false);

  // 🔹 1) POLL the active day (same as leaderboard) so overrides + midnight switches are seen
  useEffect(() => {
    let alive = true;
    let lastDay = null;

    async function fetchDay() {
      try {
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;

        const d = data?.day;
        const resolved =
          d === 'day1' || d === 'day2' ? d : 'day1';

        if (resolved !== lastDay) {
          lastDay = resolved;
          setDay(resolved);
          setDayResolved(true);
        }
      } catch {
        if (!alive) return;
        // On first failure, still mark resolved so UI doesn't hang forever
        if (!dayResolved) {
          setDay('day1');
          setDayResolved(true);
        }
      }
    }

    fetchDay();                   // initial
    const id = setInterval(fetchDay, 60000); // every 60s

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [dayResolved]);

  useImperativeHandle(
    ref,
    () => ({
      resetCard() {
        setBoxes(prev =>
          prev.map(b => ({
            ...b,
            checked: b.boxId === 'r3c3' && b.text === 'Free Space',
          }))
        );
        setWinner(false);
        localStorage.removeItem(STORAGE_KEY);
        onWinChange?.(false);
        notifiedFirstWinRef.current = false;
        setExpandedBoxId(null); //collapse any expanded prompt
      },
    }),
    [STORAGE_KEY, onWinChange]
  );

  // 🔹 2) Load prompts for the current day whenever `day` changes
  useEffect(() => {
    if (!dayResolved) return;
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

        const savedHash =
          typeof window !== 'undefined'
            ? localStorage.getItem(TEXTS_KEY)
            : null;
        const savedChecked =
          typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
            : [];

        if (savedHash && savedHash !== textsHash) {
          localStorage.removeItem(STORAGE_KEY);
        }

        const fresh = makeBoxes(size, full25);
        const savedSet = new Set(savedChecked);
        const restored = fresh.map(b =>
          savedSet.has(b.boxId) ? { ...b, checked: true } : b
        );

        setBoxes(restored);
        promptsReadyRef.current = true;
        localStorage.setItem(TEXTS_KEY, textsHash);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [size, day, STORAGE_KEY, TEXTS_KEY, dayResolved]);

  // 3) Persist checks per day
  useEffect(() => {
    if (!promptsReadyRef.current) return;
    const checkedIds = boxes.filter(b => b.checked).map(b => b.boxId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
  }, [boxes, STORAGE_KEY]);

  // 4) Win detection
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

  // 5) click outside bocx to deselect expanded box handler
  useEffect(() => {
    function handleDocumentClick(e) {
      if (!cardRef.current) return;

      // If click is OUTSIDE the card and something is expanded, collapse it
      if (expandedBoxId !== null && !cardRef.current.contains(e.target)) {
        setExpandedBoxId(null);
      }
    }

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [expandedBoxId]);


  function onToggle(boxId) {
    // 🔹 Always update UI so they can keep playing locally
    const next = boxes.map(b =>
      b.boxId === boxId ? { ...b, checked: !b.checked } : b
    );
    setBoxes(next);

    // 🔹 If this user has already achieved at least one Bingo for this day,
    // stop logging any further clicks to the leaderboard.
    if (notifiedFirstWinRef.current) {
      return;
    }

    // Only log clicks before the first win
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


  if (!dayResolved) {
    return (
      <div className="mx-auto max-w-[min(92vw,720px)] text-center py-8">
        Loading bingo board…
      </div>
    );
  }

  return (
    <div
      ref={cardRef} 
      className="mx-auto max-w-[min(92vw,720px)]"
    >
      <div className="pl-2 sm:pl-4">
        <div     
          className="grid grid-cols-5 grid-rows-5 gap-px bg-gray-300 p-px rounded"
          onClick={() => {
            if (expandedBoxId !== null) {
              setExpandedBoxId(null);   // 👈 tapping background collapses expanded box
            }
          }}
        >
          {boxes.map(b => (
            <div
              key={b.boxId}
              style={{ gridRowStart: b.row, gridColumnStart: b.col }}
              className="bg-white aspect-[4/5] sm:aspect-square"
            >
              <Box
                boxId={b.boxId}
                text={b.text}
                checked={b.checked}
                onToggle={onToggle}
                isExpanded={expandedBoxId === b.boxId}
                anyExpanded={expandedBoxId != null}
                onRequestExpand={id => setExpandedBoxId(id)}
                onRequestCollapse={() => setExpandedBoxId(null)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Card;
