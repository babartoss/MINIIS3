// src/components/Results.tsx
import React, { useEffect, useState } from 'react';

const Results: React.FC = () => {
  const [winningNumbers, setWinningNumbers] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<string>('');
  const [isAfterCompleteTime, setIsAfterCompleteTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New state for loading during 11:15-11:30

  const resultHour = parseInt(process.env.NEXT_PUBLIC_RESULT_HOUR || '11');
  const resultMinute = parseInt(process.env.NEXT_PUBLIC_RESULT_MINUTE || '15');

  useEffect(() => {
    // Load scripts for lottery results
    const script1 = document.createElement('script');
    script1.src = '//www.minhngoc.com.vn/jquery/jquery-1.7.2.js';
    document.body.appendChild(script1);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '//www.minhngoc.com.vn/style/bangketqua_mini.css';
    document.head.appendChild(link);

    const script2 = document.createElement('script');
    script2.innerHTML = 'bgcolor="#bfbfbf"; titlecolor="#730038"; dbcolor="#000000"; fsize="12px"; kqwidth="300px";';
    document.body.appendChild(script2);

    const script3 = document.createElement('script');
    script3.src = '//www.minhngoc.com.vn/getkqxs/mien-bac.js';
    script3.onload = () => {
      const dbElement = document.querySelector('#box_kqxs_minhngoc table tr:nth-child(2) td:nth-child(2)');
      const g7Element = document.querySelector('#box_kqxs_minhngoc table tr:nth-child(9) td:nth-child(2)');

      if (dbElement && g7Element) {
        const dbNumber = dbElement.textContent?.trim().slice(-2) || '';
        const g7Numbers = g7Element.textContent?.trim().split(' - ') || [];
        const numbers = [...g7Numbers, dbNumber].slice(0, 5);
        setWinningNumbers(numbers);
        const table = document.querySelector('#box_kqxs_minhngoc table') as HTMLElement;
	  if (table) table.style.display = 'none';
      }
      setIsLoading(false); // Stop loading after data is set
    };
    document.body.appendChild(script3);

    // Check time for labels and loading
    const checkTime = () => {
      const now = new Date();
      const targetStart = new Date(now);
      targetStart.setUTCHours(resultHour, resultMinute, 0, 0); // 11:15 UTC

      const targetComplete = new Date(now);
      targetComplete.setUTCHours(resultHour, resultMinute + 15, 0, 0); // 11:30 UTC

      if (now >= targetStart && now < targetComplete) {
        setIsLoading(true); // Show loading during 11:15-11:30
      } else {
        setIsLoading(false);
      }

      setIsAfterCompleteTime(now >= targetComplete);
    };
    checkTime();
    const timeInterval = setInterval(checkTime, 60000); // Check every minute

    // Countdown to result start time UTC
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(now);
      target.setUTCHours(resultHour, resultMinute, 0, 0);
      if (now > target) {
        target.setUTCDate(target.getUTCDate() + 1); // Next day if passed
      }
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      document.body.removeChild(script1);
      document.head.removeChild(link);
      document.body.removeChild(script2);
      document.body.removeChild(script3);
      clearInterval(countdownInterval);
      clearInterval(timeInterval);
    };
  }, [resultHour, resultMinute]);

  return (
    <div className="mb-4">
      <h2 className="text-center text-lg font-bold mb-2">Winning Numbers</h2>
      <p className="text-center mb-2">Countdown to results start: {countdown} ({resultHour}:{resultMinute} UTC)</p>
      <p className="text-center text-gray-500 mb-2">
        {isAfterCompleteTime ? "Today's Results" : "Previous Day's Results (new results available after 11:30 UTC)"}
      </p>
      <div className="flex justify-center gap-2 flex-wrap">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-md"
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ))
        ) : (
          winningNumbers.map((num, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl shadow-md"
            >
              {num}
            </div>
          ))
        )}
      </div>
      <div id="box_kqxs_minhngoc" style={{ display: 'none' }}></div>
    </div>
  );
};

export default Results;