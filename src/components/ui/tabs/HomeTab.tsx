"use client";

import { useState } from 'react';
import Results from '@/components/Results';
import Board from '@/components/Board';
import HowToPlay from '@/components/HowToPlay';

export function HomeTab() {
  const [showBoard, setShowBoard] = useState(false); // State to toggle HowToPlay and main board

  if (!showBoard) {
    return <HowToPlay onTryLuck={() => setShowBoard(true)} />;
  }

  return (
    <div className="container py-4">
      <Results />
      <Board />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
        Powered by Neynar 🪐
      </p>
    </div>
  );
}