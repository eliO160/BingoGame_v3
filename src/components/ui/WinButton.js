"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function WinButton({
  buttonText = "Winner!",
  proofText = "I've won Bingo!",
  open,                 // controlled optional
  onOpenChange,         // controlled optional
  onReset,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : uncontrolledOpen;

  const triggerRef = useRef(null);

  const setOpen = useCallback(
    (next) => {
      if (isControlled) onOpenChange?.(next);
      else setUncontrolledOpen(next);
    },
    [isControlled, onOpenChange]
  );

  // Close on ESC + return focus to trigger
  useEffect(() => {
    if (!isOpen) return;
    const onKeydown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setTimeout(() => triggerRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen, setOpen]);

  return (
    <>
      <div className="relative flex justify-center my-4">
        <button
          ref={triggerRef}
          className="px-4 py-2 rounded bg-green-500 text-white shadow"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="winner-popover"
        >
          {buttonText}
        </button>
      </div>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/20"
              onClick={() => {
                setOpen(false);
                setTimeout(() => triggerRef.current?.focus(), 0);
              }}
              aria-hidden="true"
            />
            {/* Centered Popover */}
            <div
              id="winner-popover"
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-[min(92vw,380px)] rounded border bg-white shadow-xl p-4 text-center">
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                  {proofText}
                </div>

                <p className="mt-2 text-sm">
                  Show this screen to the entry table to claim your prize.
                </p>

                <div className="mt-3 flex gap-2 justify-center">
                  <button
                    className="px-3 py-1.5 rounded border"
                    onClick={() => {
                      setOpen(false);
                      setTimeout(() => triggerRef.current?.focus(), 0);
                    }}
                  >
                    Close
                  </button>

                  <button
                    className="px-3 py-1.5 rounded bg-gray-900 text-white"
                    onClick={() => {
                      onReset?.();
                      setOpen(false);
                      setTimeout(() => triggerRef.current?.focus(), 0);
                    }}
                  >
                    Reset Card
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
