"use client";

import { Check } from "lucide-react";

export default function Box({
  boxId,
  text,
  checked,
  onToggle,
  isExpanded = false,
  anyExpanded = false,
  onRequestExpand,
  onRequestCollapse,
}) {

  function handleClick(e) {
    e.stopPropagation(); // 👈 prevent the card's onClick from firing

    // No box expanded yet → first tap expands this one
    if (!isExpanded && !anyExpanded) {
      onRequestExpand?.(boxId);
      return;
    }

    // This box is already expanded → second tap checks it + collapses
    if (isExpanded) {
      onToggle?.(boxId);
      onRequestCollapse?.();
      return;
    }

    // Another box is expanded → collapse that one, expand this one
    if (!isExpanded && anyExpanded) {
      onRequestCollapse?.();
      onRequestExpand?.(boxId);
    }
  }


  const collapsedClampClasses =
    "overflow-hidden [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical] [text-overflow:ellipsis]";

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-full h-full
        p-2 sm:p-3 md:p-4
        select-none transition-colors
        ${checked ? "bg-green-500 text-white" : "bg-white text-gray-900"}
        ${isExpanded ? "ring-2 ring-emerald-500 shadow-lg z-10" : ""}
      `}
    >
      {checked && (
        <Check className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 opacity-90" />
      )}

      {/* This wrapper anchors text to the TOP so it's never cut off from above */}
      <div className="h-full w-full flex items-start justify-center">
        <span
          className={`
            mt-0.5
            px-1
            ${isExpanded ? "pb-2 sm:pb-3" : ""}
            text-center
            whitespace-normal break-words
            leading-snug
            text-[clamp(0.6rem,1.6vw,0.85rem)]
            ${isExpanded ? "" : collapsedClampClasses}
          `}
        >
          {text}
        </span>
      </div>
    </button>
  );
}
