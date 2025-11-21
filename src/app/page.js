'use client';
import { useRef, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Rules from '@/components/Rules';
import WinButton from "@/components/ui/WinButton";
import LeaderboardButton from '@/components/ui/LeaderboardButton';

function HomePage() {
  const [hasEverWon, setHasEverWon] = useState(false);
  const [showWinProof, setShowWinProof] = useState(false);
  const [autoOpenedForThisWin, setAutoOpenedForThisWin] = useState(false); // NEW
  const cardRef = useRef(null);

  return (
    <main>
      <Header />

      <Card
        ref={cardRef}
        onFirstWin={() => setHasEverWon(true)}
        onWinChange={(isWinner) => {
          // Auto-open only on the *transition* to winner.
          if (isWinner && !autoOpenedForThisWin) {
            setShowWinProof(true);
            setAutoOpenedForThisWin(true);
          }
          // If the board is reset / no longer a win, allow auto-open next time.
          if (!isWinner && autoOpenedForThisWin) {
            setAutoOpenedForThisWin(false);
          }
        }}
      />

      <LeaderboardButton />

      {hasEverWon && (
        <WinButton
          open={showWinProof}
          onOpenChange={setShowWinProof}
          buttonText="Winner!"
          proofText={"I've won Bingo!"}
          onReset={() => {
            cardRef.current?.resetCard();
            setShowWinProof(false);
            setAutoOpenedForThisWin(false); // ensure next win can auto-open again
          }}
        />
      )}

      <Rules />
    </main>
  );
}

export default HomePage;
