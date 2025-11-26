import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlatformType, Game } from './types';
import { searchGameImage } from './services/imageService';
import { authService, UserProfile } from './services/authService';
import { gameService } from './services/gameService';
import { isSupabaseConfigured } from './lib/supabase';
import Banner from './components/Banner';
import GameList from './components/GameList';
import CustomCursor from './components/CustomCursor';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import CommunitySidebar from './components/CommunitySidebar';
import { Gamepad2, Monitor, Tv, Disc, Settings, Download, Upload, Trash2, Laptop, Link as LinkIcon, AlertTriangle, Swords, Share2, UserCircle, LogOut, Lock, Database } from 'lucide-react';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDbConfigured, setIsDbConfigured] = useState(true);

  // Initialize from LocalStorage (Only for Platforms preference, not data)
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gyr_platforms_pref');
      return saved ? JSON.parse(saved) : [PlatformType.PS5, PlatformType.STEAM];
    }
    return [PlatformType.PS5, PlatformType.STEAM];
  });

  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check DB Config
  useEffect(() => {
    setIsDbConfigured(isSupabaseConfigured());
  }, []);

  // Check Session on Mount
  useEffect(() => {
    const checkUser = async () => {
        const user = await authService.getCurrentUser();
        setUserProfile(user);
    };
    if (isDbConfigured) checkUser();
  }, [isDbConfigured]);

  // Load Games when User Changes
  useEffect(() => {
    const loadGames = async () => {
        if (userProfile) {
            setIsLoadingData(true);
            const userGames = await gameService.fetchUserGames(userProfile.id);
            setGames(userGames);
            setIsLoadingData(false);
        } else {
            setGames([]); // Clear games on logout
        }
    };
    if (isDbConfigured) loadGames();
  }, [userProfile, isDbConfigured]);

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

  // Persistence for UI preferences only
  useEffect(() => {
    localStorage.setItem('gyr_platforms_pref', JSON.stringify(selectedPlatforms));
  }, [selectedPlatforms]);

  // Handlers
  const handleAuthOpen = (mode: 'login' | 'register' | 'change_password' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
    setShowSettings(false);
  };

  const handleLoginSuccess = async (username: string) => {
    // Re-fetch profile to ensure we have ID
    const user = await authService.getCurrentUser();
    setUserProfile(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUserProfile(null);
  };

  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  // --- CRUD Operations Wrapper ---

  const handleToggleCategory = async (gameId: string) => {
    // Optimistic Update
    setGames(prev => prev.map(g => 
      g.id === gameId ? { ...g, category: g.category === 'single' ? 'multi' : 'single' } : g
    ));

    // DB Update
    if (userProfile) {
        const game = gamesRef.current.find(g => g.id === gameId);
        if (game) {
            const newCat = game.category === 'single' ? 'multi' : 'single';
            await gameService.updateGame(gameId, { category: newCat });
            setDataRefreshTrigger(p => p + 1);
        }
    }
  };

  const handleTogglePlatinum = async (gameId: string) => {
    // Optimistic Update
    setGames(prev => prev.map(g => 
      g.id === gameId ? { ...g, isPlatinum: !g.isPlatinum } : g
    ));

    // DB Update
    if (userProfile) {
        const game = gamesRef.current.find(g => g.id === gameId);
        if (game) {
            await gameService.updateGame(gameId, { isPlatinum: !game.isPlatinum });
        }
    }
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

          // DB Update if successful and logged in
          if (userProfile && newUrl) {
              await gameService.updateGame(id, { imageUrl: newUrl });
          }

      } catch (e) {
          console.error("Search failed for", nameToSearch, e);
          setGames(finalGames => finalGames.map(g => g.id === id ? { ...g, isLoadingImage: false } : g));
      }
    }
  }, [userProfile]); // Add userProfile dependency

  const handleGameListGenerate = useCallback((ids: string[], randomize?: boolean) => {
    handleSearchImages(ids, undefined, undefined, randomize);
  }, [handleSearchImages]);

  const handleAddGame = async (name: string, category: 'single' | 'multi', platform: PlatformType) => {
    if (!name || !name.trim()) return;

    if (!userProfile) {
        alert("Please login to add games!");
        handleAuthOpen('login');
        return;
    }

    // Generate a UUID-like ID for immediate UI feedback
    const tempId = crypto.randomUUID();

    const newGame: Game = {
      id: tempId,
      name: name.trim(),
      platform: platform,
      category: category,
      selected: false,
      isPlatinum: false,
      isLoadingImage: true // Start loading immediately
    };

    // Optimistic Add
    setGames(prev => [...prev, newGame]);

    // DB Add
    const success = await gameService.addGame(userProfile.id, newGame);
    if (success) {
        setDataRefreshTrigger(p => p + 1);
        // Trigger Image Search
        handleSearchImages([newGame.id], name.trim(), platform, false);
    } else {
        // Revert on failure
        setGames(prev => prev.filter(g => g.id !== tempId));
        alert("Failed to save game to database.");
    }
  };

  const handleUpload = async (gameId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, imageUrl: result } : g));
      
      // DB Update
      if (userProfile) {
          await gameService.updateGame(gameId, { imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGameImage = async (gameId: string, url: string) => {
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, imageUrl: url } : g));
     // DB Update
     if (userProfile) {
        await gameService.updateGame(gameId, { imageUrl: url });
    }
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

  const handleDelete = async (gameIds: string[]) => {
    // Optimistic Delete
    setGames(prev => prev.filter(g => !gameIds.includes(g.id)));
    
    // DB Delete
    if (userProfile) {
        const success = await gameService.deleteGames(gameIds);
        if (success) setDataRefreshTrigger(p => p + 1);
    }
  };

  const updateGamesForPlatform = (platform: PlatformType, updatedPlatformGames: Game[]) => {
    // Reordering logic only affects UI list order temporarily unless we add an 'order' field to DB
    // For now, we update local state
    setGames(prev => {
      const otherGames = prev.filter(g => g.platform !== platform);
      return [...otherGames, ...updatedPlatformGames];
    });
  };

  // Export/Import still useful for backup
  const exportData = () => {
    const data = {
      version: 1,
      date: new Date().toISOString(),
      user: userProfile?.username || 'guest',
      games
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-recap-${userProfile?.username || 'guest'}-${new Date().getFullYear()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const clearData = () => {
    setShowSettings(false);
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    if (userProfile) {
        const success = await gameService.clearAllGames(userProfile.id);
        if (success) {
            setGames([]);
            setDataRefreshTrigger(p => p + 1);
        }
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 selection:bg-indigo-500 selection:text-white relative">
      <CustomCursor platform={cursorPlatform} />
      
      {/* Settings & Header Menu */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* User Profile */}
        <button 
          onClick={() => userProfile ? handleLogout() : handleAuthOpen('login')}
          className={`px-3 py-2 rounded-full transition-all duration-300 shadow-lg backdrop-blur-md border flex items-center gap-2 ${userProfile ? 'bg-indigo-900/80 border-indigo-500 text-indigo-100' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
          title={userProfile ? "Log Out" : "Login / Register"}
        >
          {userProfile ? (
              <>
                 <UserCircle size={18} />
                 <span className="text-xs font-bold max-w-[80px] truncate">{userProfile.username}</span>
                 <LogOut size={14} className="ml-1 opacity-50" />
              </>
          ) : (
              <>
                 <UserCircle size={18} />
                 <span className="text-xs font-bold hidden md:inline">Login / Register</span>
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
                
                {userProfile && (
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
                  <span>Clear All Games</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Database Warning Banner */}
      {!isDbConfigured && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600/90 text-white text-xs py-1 px-4 text-center font-bold backdrop-blur">
             DATABASE NOT CONFIGURED: Please edit lib/supabase.ts with your credentials.
          </div>
      )}

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
        onLogin={handleLoginSuccess}
        currentUser={userProfile?.username}
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
              {/* Not Logged In Empty State */}
              {!userProfile && !isLoadingData && (
                   <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                      <Database size={48} className="mx-auto text-slate-600 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Login to Manage Your Collection</h3>
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Connect to the cloud database to save your games across devices and share with the community.
                      </p>
                      <button 
                         onClick={() => handleAuthOpen('login')}
                         className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                      >
                         Login / Register
                      </button>
                   </div>
              )}

              {userProfile && PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(platform => {
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
             <CommunitySidebar currentUser={userProfile?.username || null} currentUserId={userProfile?.id} refreshTrigger={dataRefreshTrigger} />
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
