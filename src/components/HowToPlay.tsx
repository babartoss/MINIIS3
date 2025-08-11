import React from 'react';

const HowToPlay: React.FC<{ onTryLuck: () => void }> = ({ onTryLuck }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center p-6 text-center relative overflow-auto"
      style={{
        backgroundImage: `url('/htp.png')`,  // Updated to .png as per your description
        backgroundSize: 'contain',  // Keeps full image visible without cropping, scales to fit container
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',  // Maintains full viewport height for mobile/Farcaster
        maxWidth: '384px',  // Matches tailwind max-w-sm (24rem) for compact mobile view
        margin: '0 auto',  // Centers on wider screens
      }}
    >
      {/* Semi-transparent overlay for better text readability, adjusted opacity for clarity */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
      
      {/* Content wrapper: relative z-index, white text, compact spacing */}
      <div className="relative z-10 text-white space-y-4 max-w-sm w-full">  {/* Used max-w-sm from tailwind.config for consistency */}
        <h1 className="text-xl font-bold text-shadow-lg">How it works</h1>  {/* Reduced size for better fit on mobile */}
        
        <p className="text-sm text-shadow-md leading-relaxed">
          1️⃣ You pick numbers & engage.<br />
          2️⃣ Farcaster rewards the MiNiIS3 for activity.<br />
          3️⃣ Rewards go back into daily lottery draws.
        </p>
        
        <p className="text-sm text-shadow-md leading-relaxed">
          🔁 Full circle: Community → MiNiIS3 → Community<br />
          ✅ Transparent – ✅ Fair – ✅ No farming<br />
          🎲 Just vibes, numbers, and a bit of luck 🍀
        </p>
        
        <p className="text-sm text-shadow-md leading-relaxed">
          📢 MAKE SURE YOU’VE READ AND UNDERSTOOD THE RULES HERE<br />
          🎉 Guess a number, win real rewards!<br />
          💜 A fun, fair – right on Farcaster!
        </p>
        
        <p className="text-sm text-shadow-md leading-relaxed">
          🔢 How to play:<br />
          • Pick a number (00–99) in the game<br />
          • One person can buy multiple numbers<br />
          ⚠️ Only 100 numbers for 100 players each round<br />
          • Share your ticket to spread the fun! 
        </p>
        
        <p className="text-sm text-shadow-md leading-relaxed">
          🏆 Round Prizes:<br />
          • Players whose number matches any of the 5 red numbers on the result board will be considered winners<br />
          • If your number hits, you’ll receive 0.20 USDC<br />
          • Note: Future reward values may vary depending on community support—more engagement with MINIIS3 could mean bigger rewards.
        </p>
        
        <button onClick={onTryLuck} className="btn btn-primary w-full max-w-xs mt-4 rounded-full shadow-md transition-all duration-300">
          TRY YOUR LUCK
        </button>
      </div>
    </div>
  );
};

export default HowToPlay;