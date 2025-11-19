"use client";

import { Check } from 'lucide-react';

export default function Box({ boxId, text, checked, onToggle }) {
  return (
    <button
      onClick={() => onToggle(boxId)}
      className={`relative w-full h-full flex items-center justify-center text-center
                  p-2 sm:p-3 md:p-4 select-none transition-colors
                  ${checked ? "bg-green-500 text-white" : "bg-white text-gray-900"}`}
    >
      {checked && (
        <Check 
          className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 opacity-90"
        />
      )}
      <span
        className="
          block text-center
          whitespace-normal break-words
          leading-snug
          px-1
          text-[11px]        /* very small phones */
          sm:text-xs         /* ≥640px */
          md:text-sm         /* ≥768px */
          lg:text-base       /* ≥1024px */
        "
      >
        {text}
      </span>
    </button>
  );
}
