// File: src/components/HowToPlay.tsx (Updated)
import React from 'react';
import { useQuickAuth } from '@/hooks/useQuickAuth'; // Assume hook path, adjust if different

const HowToPlay: React.FC<{ onTryLuck: () => void }> = ({ onTryLuck }) => {
  const { authenticatedUser, status, signIn } = useQuickAuth(); // Removed signOut as it's unused
  const fid = authenticatedUser?.fid; // Get fid from authenticatedUser

  const handleTryLuck = async () => {
    if (status !== 'authenticated' || !fid) {
      try {
        const success = await signIn();
        if (success) {
          onTryLuck(); // Proceed to board after successful sign-in
        } else {
          console.error('Sign-in failed');
          // Optionally show error message in UI
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        // Handle error, e.g., show toast or alert
      }
    } else {
      onTryLuck(); // Already signed in, proceed directly
    }
  };

  return (
    <div 
      className="container py-4 text-center relative"
      style={{
        backgroundImage: `url('/htp.png')`,
        backgroundSize: 'contain', // Use 'contain' to show full image without cropping
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', // Keep full height
      }}
    >
      {/* Add semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Content with relative z-index and text shadow */}
      <div className="relative z-10 text-white"> {/* Change text to white for contrast */}
        <h1 className="text-2xl font-bold mb-4 text-shadow-lg">How it works</h1>
        <p className="mb-4 text-shadow-md">
          1️⃣ You pick numbers & engage.<br />
          2️⃣ Farcaster rewards the MiNiIS3 for activity.<br />
          3️⃣ Rewards go back into daily lottery draws.
        </p>
        <p className="mb-4 text-shadow-md">
          🔁 Full circle: Community → MiNiIS3 → Community<br />
          ✅ Transparent – ✅ Fair – ✅ No farming<br />
          🎲 Just vibes, numbers, and a bit of luck 🍀
        </p>
        <p className="mb-4 text-shadow-md">
          📢 MAKE SURE YOU’VE READ AND UNDERSTOOD THE RULES HERE<br />
          🎉 Guess a number, win real rewards!<br />
          💜 A fun, fair – right on Farcaster!
        </p>
        <p className="mb-4 text-shadow-md">
          🔢 How to play:<br />
          • Pick a number (00–99) in the game<br />
		  •	One person can buy multiple numbers<br />
          ⚠️ Only 100 numbers for 100 players each round<br />
          • Share a your ticket to spread the fun! 
        </p>
        <p className="mb-4 text-shadow-md">
          🏆 Round Prizes:<br />
          • Players whose number matches any of the 5 red numbers on the result board will be considered winners<br />
          • If your number hits, you’ll receive 0.20 USDC
        </p>
        <button onClick={handleTryLuck} className="btn btn-primary mt-4">
          TRY YOUR LUCK
        </button>
      </div>
    </div>
  );
};

export default HowToPlay;