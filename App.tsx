
import React, { useState, useCallback } from 'react';
import { PlatformType, Game } from './types';
import { generateGameImage } from './services/geminiService';
import Banner from './components/Banner';
import GameList from './components/GameList';
import CustomCursor from './components/CustomCursor';
import { Gamepad2, Monitor, Tv, Disc } from 'lucide-react';
import { motion } from 'framer-motion';

const PLATFORMS = [
  { id: PlatformType.PS5, label: 'PS5', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-blue-600 to-blue-800' },
  { id: PlatformType.SWITCH, label: 'Switch 1/2', icon: <Disc className="w-5 h-5" />, color: 'from-red-500 to-red-700' },
  { id: PlatformType.XBOX, label: 'Xbox', icon: <Tv className="w-5 h-5" />, color: 'from-green-600 to-green-800' },
  { id: PlatformType.STEAM, label: 'Steam', icon: <Monitor className="w-5 h-5" />, color: 'from-slate-600 to-slate-800' },
];

function App() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([PlatformType.PS5, PlatformType.STEAM]);
  const [games, setGames] = useState<Game[]>([]);
  const [viewModes, setViewModes] = useState<Record<string, 'single' | 'dual'>>({});
  
  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const handleToggleViewMode = (platformId: string) => {
    setViewModes(prev => ({
      ...prev,
      [platformId]: prev[platformId] === 'dual' ? 'single' : 'dual'
    }));
  };

  const handleAddGame = (name: string, category: 'single' | 'multi', platform: PlatformType) => {
    if (!name || !name.trim()) return;

    const newGame: Game = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      platform: platform,
      category: category,
      selected: false
    };

    setGames(prev => [...prev, newGame]);
    
    // Auto generate icon on add
    handleGenerate([newGame.id], name.trim());
  };

  const handleGenerate = useCallback(async (gameIds: string[], overrideName?: string) => {
    setGames(prev => prev.map(g => gameIds.includes(g.id) ? { ...g, isGenerating: true } : g));

    for (const id of gameIds) {
      setGames(currentGames => {
        const game = currentGames.find(g => g.id === id);
        if (!game) return currentGames;
        
        const nameToUse = overrideName || game.name;
        
        // Fire and forget the async generation
        generateGameImage(nameToUse).then(imageUrl => {
            setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, imageUrl: imageUrl || undefined, isGenerating: false } : g));
        }).catch(() => {
            setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, isGenerating: false } : g));
        });

        return currentGames;
      });
    }
  }, []);

  const handleUpload = (gameId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, imageUrl: result } : g));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (gameIds: string[]) => {
    setGames(prev => prev.filter(g => !gameIds.includes(g.id)));
  };

  const updateGamesForPlatform = (platform: PlatformType, updatedPlatformGames: Game[]) => {
    setGames(prev => {
      const otherGames = prev.filter(g => g.platform !== platform);
      return [...otherGames, ...updatedPlatformGames];
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500 selection:text-white">
      <CustomCursor />
      {/* Pass games to banner for dynamic quotes */}
      <Banner games={games} />

      <main className="container mx-auto px-4 md:px-8 -mt-8 relative z-20">
        
        {/* Platform Selector */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`
                group relative flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300
                ${selectedPlatforms.includes(platform.id) 
                  ? `bg-gradient-to-br ${platform.color} border-transparent shadow-lg shadow-indigo-500/20` 
                  : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-400'}
              `}
            >
              <span className={`${selectedPlatforms.includes(platform.id) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {platform.icon}
              </span>
              <span className={`font-medium ${selectedPlatforms.includes(platform.id) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {platform.label}
              </span>
              {selectedPlatforms.includes(platform.id) && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Game Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(platform => {
            const platformGames = games.filter(g => g.platform === platform.id);
            const isDual = viewModes[platform.id] === 'dual';
            
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={platform.id} 
                className={`flex flex-col gap-4 ${isDual ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}
              >
                <GameList 
                  platform={platform.id}
                  games={platformGames}
                  onUpdateGames={(updated) => updateGamesForPlatform(platform.id, updated)}
                  onGenerate={handleGenerate}
                  onDelete={handleDelete}
                  onUpload={handleUpload}
                  onAddGame={(name, category) => handleAddGame(name, category, platform.id)}
                  viewMode={isDual ? 'dual' : 'single'}
                  onToggleViewMode={() => handleToggleViewMode(platform.id)}
                />
              </motion.div>
            );
          })}
        </div>
      </main>
      
      <footer className="text-center text-slate-600 py-8 text-xs relative z-10">
        <p>Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
}

export default App;
