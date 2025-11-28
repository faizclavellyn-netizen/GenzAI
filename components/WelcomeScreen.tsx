import React from 'react';
import { LogoG } from './Icons';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    "Explain quantum physics simply",
    "Write a poem about rain",
    "Tips for React development",
    "Plan a trip to Bali"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
      <LogoG />
      <h1 className="text-3xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white mb-8 tracking-tight">
        I'm GenzAI, How Can I Help You?
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((text, idx) => (
          <button 
            key={idx}
            onClick={() => onSuggestionClick(text)}
            className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-800 transition-all duration-200 text-sm text-neutral-400 hover:text-white text-left"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;