'use client';
import Link from 'next/link';

export default function LeaderboardButton() {
  return (
    <div className="relative flex justify-center my-4">
      <Link
        href="/leaderboard"
        className="px-4 py-2 rounded bg-emerald-600 text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        View Leaderboard
      </Link>
    </div>

  );
}