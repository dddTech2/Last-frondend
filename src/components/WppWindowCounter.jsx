import React from 'react';
import { useWindowCounter } from '../hooks/useWindowCounter';

const WppWindowCounter = ({ lastClientMessageAt, isEvolution }) => {
  const counterText = useWindowCounter(lastClientMessageAt, isEvolution);

  if (!counterText) return null;

  return (
    <span className={`text-xs mt-1 px-2 py-1 rounded-full ${
      counterText === 'Expirado' ? 'bg-red-100 text-red-600' :
      counterText.includes('h') && parseInt(counterText) > 12 ? 'bg-green-100 text-green-600' :
      counterText.includes('h') && parseInt(counterText) > 6 ? 'bg-yellow-100 text-yellow-600' :
      'bg-red-100 text-red-600'
    }`}>
      {counterText}
    </span>
  );
};

export default WppWindowCounter;