
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlatformType, Game } from './types';
import { searchGameImage } from './services/imageService';
import Banner from './components/Banner';
import GameList from './components/GameList';
import CustomCursor from './components/CustomCursor';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import CommunitySidebar from './components/CommunitySidebar';
import { Gamepad2, Monitor, Tv, Disc, Settings, Download, Upload, Trash2, Laptop, Link as LinkIcon, AlertTriangle, Swords, Share2, UserCircle, LogOut, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORMS = [
  { id: PlatformType.PS5, label: 'PS5', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-blue-600 to-blue-800' },
  { id: PlatformType.SWITCH, label: 'Switch 1/2', icon: <Disc className="w-5 h-5" />, color: 'from-red-500 to-red-700' },
  { id: PlatformType.XBOX, label: 'Xbox', icon: <Tv className="w-5 h-5" />, color: 'from-green-600 to-green-800' },
  { id: PlatformType.STEAM, label: 'Steam', icon: <Monitor className="w-5 h-5" />, color: 'from-slate-600 to-slate-800' },
  { id: PlatformType.BATTLENET, label: 'Battle.net', icon: <Swords className="w-5 h-5" />, color: 'from-sky-600 to-cyan-800' },
  { id: PlatformType.PC, label: '其他平台', icon: <Laptop className="w-5 h-5" />, color: 'from-purple-600 to-indigo-800' },
];

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('gyr_current_user');
  });

  const getStorageKey = (key: string) => currentUser ? `${key}_${currentUser}` : key;

  // Initialize from LocalStorage or Default
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getStorageKey('gyr_platforms'));
      return saved ? JSON.parse(saved) : [PlatformType.PS5, PlatformType.STEAM];
    }
    return [PlatformType.PS5, PlatformType.STEAM];
  });

  const [games, setGames] = useState<Game[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getStorageKey('gyr_games'));
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Reload data when user changes
  useEffect(() => {
    const loadedPlatforms = localStorage.getItem(getStorageKey('gyr_platforms'));
    const loadedGames = localStorage.getItem(getStorageKey('gyr_games'));
    
    setSelectedPlatforms(loadedPlatforms ? JSON.parse(loadedPlatforms) : [PlatformType.PS5, PlatformType.STEAM]);
    setGames(loadedGames ? JSON.parse(loadedGames) : []);
    
    // Persist current user
    if (currentUser) {
      localStorage.setItem('gyr_current_user', currentUser);
    } else {
      localStorage.removeItem('gyr_current_user');
    }
  }, [currentUser]);

  const [showSettings, setShowSettings] = useState(false);
  const [cursorPlatform, setCursorPlatform] = useState<PlatformType | null>(null);
  
  // Modals State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'change_password'>('login');
  
  // URL Input Dialog State
  const [urlDialog, setUrlDialog] = useState<{open: boolean, gameId: string | null}>({open: false, gameId: null});
  const [tempUrl, setTempUrl] = useState('');
  
  // Clear Data Confirmation Dialog State
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Trigger for sidebar refresh
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref to keep track of games for async operations without stale closures
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(getStorageKey('gyr_platforms'), JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey('gyr_games'), JSON.stringify(games));
      // Increment trigger to notify community sidebar of changes (if current user adds games)
      setDataRefreshTrigger(prev => prev + 1);
    } catch (e) {
      console.warn("Local Storage quota exceeded. Some images might not be saved.", e);
    }
  }, [games, currentUser]);

  // Handlers
  const handleAuthOpen = (mode: 'login' | 'register' | 'change_password' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setShowSettings(false);
  };

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const handleToggleCategory = (gameId: string) => {
    setGames(prev => prev.map(g => 
      g.id === gameId ? { ...g, category: g.category === 'single' ? 'multi' : 'single' } : g
    ));
  };

  const handleTogglePlatinum = (gameId: string) => {
    setGames(prev => prev.map(g => 
      g.id === gameId ? { ...g, isPlatinum: !g.isPlatinum } : g
    ));
  };

  const handleSearchImages = useCallback(async (gameIds: string[], overrideName?: string, overridePlatform?: PlatformType, randomize: boolean = false) => {
    setGames(prev => prev.map(g => gameIds.includes(g.id) ? { ...g, isLoadingImage: true } : g));

    for (const id of gameIds) {
      const currentGame = gamesRef.current.find(g => g.id === id);
      const nameToSearch = overrideName || currentGame?.name;
      
      if (!nameToSearch) {
        setGames(prev => prev.map(g => g.id === id ? { ...g, isLoadingImage: false } : g));
        continue;
      }

      const previousImage = currentGame?.imageUrl;
      const platformToSearch = overridePlatform || currentGame?.platform;

      try {
          const newUrl = await searchGameImage(nameToSearch, platformToSearch, randomize);
          
          setGames(finalGames => finalGames.map(g => {
              if (g.id !== id) return g;
              return { 
                  ...g, 
                  imageUrl: newUrl || previousImage, 
                  isLoadingImage: false 
              };
          }));
      } catch (e) {
          console.error("Search failed for", nameToSearch, e);
          setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, isLoadingImage: false } : g));
      }
    }
  }, []);

  const handleGameListGenerate = useCallback((ids: string[], randomize?: boolean) => {
    handleSearchImages(ids, undefined, undefined, randomize);
  }, [handleSearchImages]);

  const handleAddGame = (name: string, category: 'single' | 'multi', platform: PlatformType) => {
    if (!name || !name.trim()) return;

    const newGame: Game = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      platform: platform,
      category: category,
      selected: false,
      isPlatinum: false
    };

    setGames(prev => [...prev, newGame]);
    handleSearchImages([newGame.id], name.trim(), platform, false);
  };

  const handleUpload = (gameId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, imageUrl: result } : g));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGameImage = (gameId: string, url: string) => {
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, imageUrl: url } : g));
  };
  
  const handleRequestUrlInput = (gameId: string) => {
      setTempUrl('');
      setUrlDialog({open: true, gameId});
  };
  
  const handleSubmitUrl = () => {
      if (urlDialog.gameId && tempUrl.trim()) {
          handleUpdateGameImage(urlDialog.gameId, tempUrl.trim());
      }
      setUrlDialog({open: false, gameId: null});
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

  const exportData = () => {
    const data = {
      version: 1,
      date: new Date().toISOString(),
      user: currentUser || 'guest',
      selectedPlatforms,
      games
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-recap-${currentUser || 'guest'}-${new Date().getFullYear()}.json`;
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
    setShowSettings(false);
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    setGames([]);
    localStorage.removeItem(getStorageKey('gyr_games')); 
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500 selection:text-white relative">
      <CustomCursor platform={cursorPlatform} />
      
      {/* Settings & Header Menu */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* User Profile */}
        <button 
          onClick={() => currentUser ? handleLogout() : handleAuthOpen('login')}
          className={`px-3 py-2 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border flex items-center gap-2 ${currentUser ? 'bg-indigo-900/80 border-indigo-500 text-indigo-100' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
          title={currentUser ? "Log Out" : "Login / Register"}
        >
          {currentUser ? (
              <>
                 <UserCircle size={18} />
                 <span className="text-xs font-bold max-w-[80px] truncate">{currentUser}</span>
                 <LogOut size={14} className="ml-1 opacity-50" />
              </>
          ) : (
              <>
                 <UserCircle size={18} />
                 <span className="text-xs font-bold hidden md:inline">Login</span>
              </>
          )}
        </button>

        {/* Share Button */}
        <button 
          onClick={() => setIsShareOpen(true)}
          className="p-3 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border bg-gradient-to-br from-indigo-600 to-purple-600 border-transparent text-white hover:scale-105"
          title="Share My Recap"
        >
          <Share2 size={20} />
        </button>

        {/* Settings Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border ${showSettings ? 'bg-slate-700 border-slate-500 text-white rotate-90' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
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
                <button onClick={exportData} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm text-left w-full">
                  <Download size={16} />
                  <span>Export Backup</span>
                </button>
                
                <label className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm text-left cursor-pointer w-full">
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
                
                {currentUser && (
                    <button 
                      onClick={() => handleAuthOpen('change_password')}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm text-left w-full"
                    >
                      <Lock size={16} />
                      <span>Change Password</span>
                    </button>
                )}

                <div className="h-px bg-slate-700 my-1"></div>
                
                <button 
                  onClick={clearData} 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors text-sm text-left w-full"
                >
                  <Trash2 size={16} />
                  <span>Clear All Data</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Modals */}
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        games={games} 
        year={new Date().getFullYear()} 
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={handleLogin}
        currentUser={currentUser}
        initialView={authMode}
      />

      {/* URL Input Modal */}
      <AnimatePresence>
        {urlDialog.open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setUrlDialog({...urlDialog, open: false})}
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-md relative z-10"
                >
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <LinkIcon size={20} /> 输入图片链接 (Input Image URL)
                    </h3>
                    <input 
                        autoFocus
                        type="text" 
                        value={tempUrl}
                        onChange={e => setTempUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-6 text-sm font-mono"
                        onKeyDown={e => e.key === 'Enter' && handleSubmitUrl()}
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setUrlDialog({...urlDialog, open: false})} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">取消 Cancel</button>
                        <button onClick={handleSubmitUrl} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">确认 Confirm</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowClearConfirm(false)}
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-md relative z-10"
                >
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-400">
                        <AlertTriangle size={20} /> 警告 Warning
                    </h3>
                    <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                        确定要清空所有游戏列表吗？此操作无法撤销。<br/>
                        Are you sure you want to clear all game data? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">取消 Cancel</button>
                        <button onClick={handleConfirmClear} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-900/20 text-sm">确认清空 Confirm Clear</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Pass games to banner for dynamic quotes */}
      <Banner games={games} />

      <main className="container mx-auto px-4 md:px-8 -mt-8 relative z-20 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Game Management */}
          <div className="flex-1 w-full min-w-0">
             {/* Platform Selector */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-12">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  onMouseEnter={() => setCursorPlatform(platform.id)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(platform => {
                const platformGames = games.filter(g => g.platform === platform.id);
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={platform.id} 
                    className="flex flex-col gap-4 col-span-1"
                  >
                    <GameList 
                      platform={platform.id}
                      title={platform.label}
                      games={platformGames}
                      onUpdateGames={(updated) => updateGamesForPlatform(platform.id, updated)}
                      onGenerate={handleGameListGenerate}
                      onDelete={handleDelete}
                      onUpload={handleUpload}
                      onAddGame={(name, category) => handleAddGame(name, category, platform.id)}
                      onToggleCategory={handleToggleCategory}
                      onTogglePlatinum={handleTogglePlatinum}
                      onRequestUrlInput={handleRequestUrlInput}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Community Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 mt-8 lg:mt-0">
             <CommunitySidebar currentUser={currentUser} refreshTrigger={dataRefreshTrigger} />
          </aside>
        </div>
      </main>
      
      <footer className="text-center text-slate-600 py-8 text-xs relative z-10">
        <p>Game data provided by CheapShark, Wikipedia, Libretro, & Custom Library</p>
      </footer>
    </div>
  );
}

export default App;
