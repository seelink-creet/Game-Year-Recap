
import React, { useState, useEffect, useMemo } from 'react';
import { Game } from '../types';

// Generic gaming quotes (Mix of EN/CN for style)
const GENERIC_QUOTES = [
  "人生如戏",
  "下一场更精彩",
  "胜败乃兵家常事",
  "Press Start to Continue",
  "Game Over? Continue?",
  "It's dangerous to go alone",
  "The cake is a lie",
  "War... War never changes",
  "万物皆虚，万事皆允", // Assassin's Creed
  "直到我的膝盖中了一箭", // Skyrim
  "犹豫就会败北", // Sekiro
  "赞美太阳!", // Dark Souls
  "Winner Winner Chicken Dinner",
  "A Hideo Kojima Game",
  "You Died",
  "Hey, you. You're finally awake.",
];

// Quotes triggered by specific game names (simple keyword matching)
const SPECIFIC_QUOTES: Record<string, string[]> = {
  "elden": ["Arise now, ye Tarnished", "前有绝景"],
  "ring": ["Arise now, ye Tarnished", "前有绝景"],
  "souls": ["Praise the Sun!", "赞美太阳"],
  "sekiro": ["犹豫就会败北", "果断就会白给"],
  "zelda": ["It's dangerous to go alone", "呀哈哈！"],
  "link": ["It's dangerous to go alone", "呀哈哈！"],
  "mario": ["It's a me, Mario!", "Thank you Mario!"],
  "portal": ["The cake is a lie"],
  "skyrim": ["Fus Ro Dah!", "膝盖中了一箭"],
  "scrolls": ["Fus Ro Dah!", "膝盖中了一箭"],
  "final fantasy": ["Not interested.", "水晶的序曲"],
  "persona": ["I am thou, thou art I", "Take Your Heart"],
  "wukong": ["直面天命", "踏上取经路"],
  "myth": ["直面天命"],
  "gta": ["Ah sh*t, here we go again"],
  "grand theft": ["Ah sh*t, here we go again"],
  "halo": ["I need a weapon."],
  "cyberpunk": ["Wake the f**k up, Samurai"],
  "2077": ["Wake the f**k up, Samurai"],
  "witcher": ["Hmm... Wind's howling."],
  "red dead": ["I have a plan.", "Arthur!"],
  "redemption": ["I have a plan.", "Arthur!"],
  "resident evil": ["Itchy. Tasty."],
  "biohazard": ["Itchy. Tasty."],
  "monster hunter": ["上车！", "猫饭时间"],
  "pokemon": ["Gotta catch 'em all!", "就决定是你了！"],
};

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
    
    // Add some random generic quotes
    const shuffledGeneric = [...GENERIC_QUOTES].sort(() => 0.5 - Math.random()).slice(0, 5);
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
    
    // Shuffle everything after the first title
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

      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); // Pause at end
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        // Move to next phrase
        setCurrentPhraseIndex(prev => prev + 1);
        setLoopNum(prev => prev + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed, phrases, currentPhraseIndex]);

  return (
    <div className="w-full py-16 flex flex-col items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 h-16 text-center z-10 pixel-font leading-normal px-4">
        <span className="mr-1">{text}</span>
        <span className="animate-pulse border-r-4 border-cyan-400 h-full inline-block align-middle">&nbsp;</span>
      </h1>
      <p className="mt-4 text-slate-400 text-sm font-mono z-10 uppercase tracking-widest">Create Your Collection</p>
    </div>
  );
};

export default Banner;
