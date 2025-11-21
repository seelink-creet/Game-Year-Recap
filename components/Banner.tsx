
import React, { useState, useEffect, useMemo } from 'react';
import { Game } from '../types';

// Massive list of gaming quotes
const GENERIC_QUOTES = [
  "人生如戏", "下一场更精彩", "胜败乃兵家常事", "Press Start to Continue", "Game Over? Continue?",
  "It's dangerous to go alone", "The cake is a lie", "War... War never changes", "万物皆虚，万事皆允",
  "直到我的膝盖中了一箭", "犹豫就会败北", "赞美太阳!", "Winner Winner Chicken Dinner",
  "A Hideo Kojima Game", "You Died", "Hey, you. You're finally awake.", "To the moon!",
  "Do a barrel roll!", "All your base are belong to us", "Finish Him!", "Get over here!",
  "Hadouken!", "Shoryuken!", "Kamehameha!", "It's a me, Mario!", "Thank you Mario! But our princess is in another castle!",
  "Snake? Snake? SNAKEEE!", "Kept you waiting, huh?", "Engravings... give you no tactical advantage whatsoever.",
  "Requiescat in pace", "Nothing is true, everything is permitted", "We work in the dark to serve the light",
  "Praise the Sun!", "Fear the Old Blood", "A hunter must hunt", "Tonight, Gehrman joins the hunt",
  "Hesitation is defeat", "Face me, Sekiro!", "Put these foolish ambitions to rest",
  "I am Malenia, Blade of Miquella", "Let me solo her", "Tarnished, are we?",
  "Foul Tarnished...", "Forefathers, one and all... Bear witness!", "Marika's tits!",
  "Wake the f**k up, Samurai. We have a city to burn.", "Construct additional pylons",
  "Nuclear launch detected", "For the Horde!", "For the Alliance!", "Lok'tar Ogar!",
  "Jobs done.", "Work, work.", "Frostmourne hungers", "No king rules forever",
  "Stay awhile and listen", "Not enough mana", "I need a weapon", "Cortana, all I need to know is did we lose them?",
  "Sir. Finishing this fight.", "Wort wort wort", "Protocol 3: Protect the Pilot",
  "Trust me.", "Standby for Titanfall", "The frontier is worth every part of this fight",
  "Would you kindly?", "A man chooses, a slave obeys", "There's always a lighthouse, always a man, always a city",
  "Protocol 1: Link to Pilot", "Endure and survive", "It can't be for nothing",
  "I swear", "Look for the light", "When you're lost in the darkness, look for the light",
  "Boy!", "Close your heart to it", "Do not be sorry, be better", "The cycle ends here",
  "Keep your expectations low and you will never be disappointed", "Chaos is a ladder... wait wrong franchise",
  "Wind's howling", "Damn you're ugly", "Place of power... gotta be", "How do you like that silver?",
  "I used to be an adventurer like you", "Let me guess, someone stole your sweetroll?", "Khajiit has wares, if you have coin",
  "Fus Ro Dah!", "Never should have come here!", "Stop right there criminal scum!",
  "War has changed", "Why are we still here? Just to suffer?", "La-li-lu-le-lo",
  "Nanomachines, son!", "Rules of Nature!", "Make it count", "Spartans never die",
  "Did I ever tell you the definition of insanity?", "Rook!", "Prepare for unforeseen consequences",
  "Rise and shine, Mr. Freeman", "The right man in the wrong place can make all the difference",
  "Glados is watching", "I'm making a note here: HUGE SUCCESS", "Space!",
  "Eyes up, Guardian", "Whether we wanted it or not...", "Transmat firing!",
  "Rock and Stone!", "For Karl!", "Leave no dwarf behind!", "Save the cheerleader, save the... wait",
  "Objection!", "Hold it!", "Take that!", "Cornered!",
  "Gotta catch 'em all!", "It's super effective!", "A wild Snorlax appears!",
  "Pika Pika!", "Preparation is key", "99% chance to hit... Missed!",
  "X-COM baby!", "Commander, the aliens continue to make progress",
  "Welcome to Dark Souls", "Git Gud", "Try finger but hole", "Amazing chest ahead",
  "Don't give up, skeleton!", "Victory Achieved", "Heir of Fire Destroyed",
  "God Slain", "Legend Felled", "Duty Fulfilled", "Shinobi Execution",
  "Immortal Severance", "NIGHTMARE SLAIN", "PREY SLAUGHTERED"
];

// Quotes triggered by specific game names (simple keyword matching)
const SPECIFIC_QUOTES: Record<string, string[]> = {
  "elden": ["Arise now, ye Tarnished", "前有绝景", "I am Malenia, Blade of Miquella"],
  "ring": ["Arise now, ye Tarnished", "前有绝景"],
  "souls": ["Praise the Sun!", "赞美太阳", "Try finger but hole"],
  "sekiro": ["犹豫就会败北", "果断就会白给", "死"],
  "zelda": ["It's dangerous to go alone", "呀哈哈！", "Excuuuuse me, Princess!"],
  "link": ["It's dangerous to go alone", "呀哈哈！"],
  "mario": ["It's a me, Mario!", "Thank you Mario!", "Yahoo!"],
  "portal": ["The cake is a lie", "This was a triumph"],
  "skyrim": ["Fus Ro Dah!", "膝盖中了一箭", "Hey you, you're finally awake"],
  "scrolls": ["Fus Ro Dah!", "膝盖中了一箭"],
  "final fantasy": ["Not interested.", "水晶的序曲"],
  "persona": ["I am thou, thou art I", "Take Your Heart", "You'll never see it coming"],
  "wukong": ["直面天命", "踏上取经路", "广智救我！"],
  "myth": ["直面天命"],
  "gta": ["Ah sh*t, here we go again", "Wasted"],
  "halo": ["I need a weapon.", "Sir, finishing this fight."],
  "cyberpunk": ["Wake the f**k up, Samurai", "Preem", "Nova"],
  "2077": ["Wake the f**k up, Samurai"],
  "witcher": ["Hmm... Wind's howling.", "How about a round of Gwent?"],
  "red dead": ["I have a plan.", "Arthur!", "Tahiti!"],
  "resident evil": ["Itchy. Tasty.", "Jill Sandwich"],
  "monster hunter": ["上车！", "猫饭时间", "Proof of a Hero"],
  "pokemon": ["Gotta catch 'em all!", "It's super effective!"],
  "minecraft": ["Creeper? Aww man", "Oof"],
  "cod": ["Press F to pay respects"],
  "call of duty": ["Press F to pay respects", "Bravo Six, going dark"],
  "metal gear": ["Snake? Snake?!", "!"]
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
