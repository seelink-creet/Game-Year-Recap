
import React, { useState, useEffect, useMemo } from 'react';
import { Game } from '../types';
import { GENERIC_QUOTES, SPECIFIC_QUOTES } from '../data/quotes';

interface BannerProps {
  games: Game[];
}

const Banner: React.FC<BannerProps> = ({ games }) => {
  const year = new Date().getFullYear();
  
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Dynamic pool of phrases based on current games
  const phrases = useMemo(() => {
    const activePhrases = [`${year} 年度游戏回顾`]; // Always start with title
    
    // Add a random selection of generic quotes (15 random ones)
    const shuffledGeneric = [...GENERIC_QUOTES].sort(() => 0.5 - Math.random()).slice(0, 15);
    activePhrases.push(...shuffledGeneric);

    // Check for specific game quotes based on user input
    if (games.length > 0) {
      const gameNames = games.map(g => g.name.toLowerCase());
      
      gameNames.forEach(name => {
        Object.keys(SPECIFIC_QUOTES).forEach(keyword => {
          if (name.includes(keyword)) {
            // Add the specific quote if matches
            activePhrases.push(...SPECIFIC_QUOTES[keyword]);
          }
        });
      });
    }
    
    // Shuffle everything after the first title to keep it fresh
    const title = activePhrases[0];
    const others = activePhrases.slice(1).sort(() => 0.5 - Math.random());
    
    return [title, ...others];
  }, [games, year, loopNum]); // Re-evaluate when loop finishes to refresh randomness

  useEffect(() => {
    const handleTyping = () => {
      const i = currentPhraseIndex % phrases.length;
      const fullText = phrases[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 100);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2500); // Pause at end
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        // Move to next phrase
        setCurrentPhraseIndex(prev => prev + 1);
        if ((currentPhraseIndex + 1) % phrases.length === 0) {
           setLoopNum(prev => prev + 1); // Trigger re-shuffle on loop
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed, phrases, currentPhraseIndex]);

  return (
    <div className="w-full py-16 flex flex-col items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="h-20 flex items-center justify-center px-4 z-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-center pixel-font leading-relaxed drop-shadow-lg">
          <span className="mr-1">{text}</span>
          <span className="animate-pulse border-r-4 border-cyan-400 h-10 md:h-12 inline-block align-middle">&nbsp;</span>
        </h1>
      </div>
      <p className="mt-2 text-slate-400 text-xs md:text-sm font-mono z-10 uppercase tracking-[0.2em] opacity-70">Create Your Collection • Celebrate Your Journey</p>
    </div>
  );
};

export default Banner;
