import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlatformType, Game } from './types';
import { searchGameImage } from './services/imageService';
import Banner from './components/Banner';
import GameList from './components/GameList';
import CustomCursor from './components/CustomCursor';
import { Gamepad2, Monitor, Tv, Disc, Settings, Download, Upload, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORMS = [
  { id: PlatformType.PS5, label: 'PS5', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-blue-600 to-blue-800' },
  { id: PlatformType.SWITCH, label: 'Switch 1/2', icon: <Disc className="w-5 h-5" />, color: 'from-red-500 to-red-700' },
  { id: PlatformType.XBOX, label: 'Xbox', icon: <Tv className="w-5 h-5" />, color: 'from-green-600 to-green-800' },
  { id: PlatformType.STEAM, label: 'Steam', icon: <Monitor className="w-5 h-5" />, color: 'from-slate-600 to-slate-800' },
];

function App() {
  // Initialize from LocalStorage or Default
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gyr_platforms');
      return saved ? JSON.parse(saved) : [PlatformType.PS5, PlatformType.STEAM];
    }
    return [PlatformType.PS5, PlatformType.STEAM];
  });

  const [games, setGames] = useState<Game[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gyr_games');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [viewModes, setViewModes] = useState<Record<string, 'single' | 'dual'>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gyr_viewmodes');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('gyr_platforms', JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  useEffect(() => {
    try {
      localStorage.setItem('gyr_games', JSON.stringify(games));
    } catch (e) {
      console.warn("Local Storage quota exceeded. Some images might not be saved.", e);
    }
  }, [games]);

  useEffect(() => {
    localStorage.setItem('gyr_viewmodes', JSON.stringify(viewModes));
  }, [viewModes]);

  // Handlers
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
    
    // Auto search icon on add
    handleSearchImages([newGame.id], name.trim());
  };

  const handleSearchImages = useCallback(async (gameIds: string[], overrideName?: string) => {
    setGames(prev => prev.map(g => gameIds.includes(g.id) ? { ...g, isLoadingImage: true } : g));

    for (const id of gameIds) {
      setGames(currentGames => {
        const game = currentGames.find(g => g.id === id);
        if (!game) return currentGames;
        
        const nameToUse = overrideName || game.name;
        
        // Fire and forget the async search
        searchGameImage(nameToUse).then(imageUrl => {
            setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, imageUrl: imageUrl || undefined, isLoadingImage: false } : g));
        }).catch(() => {
            setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, isLoadingImage: false } : g));
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

  // Data Management
  const exportData = () => {
    const data = {
      version: 1,
      date: new Date().toISOString(),
      selectedPlatforms,
      games,
      viewModes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-year-recap-${new Date().getFullYear()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.selectedPlatforms) setSelectedPlatforms(json.selectedPlatforms);
        if (json.games) setGames(json.games);
        if (json.viewModes) setViewModes(json.viewModes);
        alert("Data loaded successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to parse data file. Please ensure it is a valid JSON backup.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowSettings(false);
    };
    reader.readAsText(file);
  };

  const clearData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      setGames([]);
      setSelectedPlatforms([PlatformType.PS5, PlatformType.STEAM]);
      setViewModes({});
      localStorage.clear();
      setShowSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500 selection:text-white relative">
      <CustomCursor />
      
      {/* Settings Menu */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border ${showSettings ? 'bg-indigo-600 border-indigo-500 text-white rotate-90' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
            title="Data Settings"
          >
            <Settings size={20} />
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                className="absolute top-14 right-0 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden flex flex-col"
              >
                <button onClick={exportData} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm text-left">
                  <Download size={16} />
                  <span>Export Backup</span>
                </button>
                
                <label className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm text-left cursor-pointer">
                  <Upload size={16} />
                  <span>Import Backup</span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={importData} 
                  />
                </label>
                
                <div className="h-px bg-slate-700 my-1"></div>
                
                <button onClick={clearData} className="flex items-center gap-3 px-4 py-3 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors text-sm text-left">
                  <Trash2 size={16} />
                  <span>Clear All Data</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                  onGenerate={handleSearchImages}
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
        <p>Game data provided by CheapShark & Custom Library</p>
      </footer>
    </div>
  );
}

export default App;