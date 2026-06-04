import { useState, useEffect } from 'react';

export const useWindowCounter = (lastClientMessageAt, isEvolution = false) => {
  const [counterText, setCounterText] = useState('');

  useEffect(() => {
    if (!lastClientMessageAt || isEvolution) {
      setCounterText('');
      return;
    }

    const updateCounter = () => {
      let timestamp;
      if (isNaN(new Date(lastClientMessageAt).getTime())) {
        // Try as Unix seconds
        timestamp = Number(lastClientMessageAt) * 1000;
      } else {
        timestamp = new Date(lastClientMessageAt).getTime();
      }

      const now = Date.now();
      const elapsed = now - timestamp;
      const windowMs = 24 * 60 * 60 * 1000; // 24 hours in ms

      if (elapsed >= windowMs) {
        setCounterText('Expirado');
        return;
      }

      const remainingMs = windowMs - elapsed;
      const hours = Math.floor(remainingMs / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

      setCounterText(`${hours}h ${minutes}m`);
    };

    updateCounter();
    const interval = setInterval(updateCounter, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastClientMessageAt]);

  return counterText;
};