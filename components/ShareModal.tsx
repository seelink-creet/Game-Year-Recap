
import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, LayoutGrid, Smartphone, Columns, Share2, Dices, Trophy } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Game, PlatformType } from '../types';
import { GENERIC_QUOTES } from '../data/quotes';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  year: number;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, games, year }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<'grid' | 'mobile' | 'poster'>('poster');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Group games by platform
  const groupedGames = useMemo(() => {
    const groups: Partial<Record<PlatformType, Game[]>> = {};
    const platformOrder = [
        PlatformType.PS5, 
        PlatformType.SWITCH, 
        PlatformType.XBOX, 
        PlatformType.STEAM, 
        PlatformType.BATTLENET, 
        PlatformType.PC
    ];

    platformOrder.forEach(p => {
        const platformGames = games.filter(g => g.platform === p);
        if (platformGames.length > 0) {
            groups[p] = platformGames;
        }
    });
    
    // Catch any leftovers (fallback)
    const accountedIds = new Set(Object.values(groups).flat().map(g => g.id));
    const leftovers = games.filter(g => !accountedIds.has(g.id));
    if (leftovers.length > 0) {
        groups[PlatformType.PC] = [...(groups[PlatformType.PC] || []), ...leftovers];
    }

    return groups;
  }, [games]);

  const randomizeQuote = () => {
    const randomIndex = Math.floor(Math.random() * GENERIC_QUOTES.length);
    setQuoteIndex(randomIndex);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    
    try {
      // Small delay to ensure render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        scale: 2, // Retina quality
        backgroundColor: '#0f172a',
        logging: false
      });
      
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `game-recap-${year}.jpg`;
      link.click();
    } catch (err) {
      console.error("Image generation failed", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Filter top 3 for poster podium, rest will be categorized
  const top3 = games.slice(0, 3);
  
  // Platform labels for headers
  const getPlatformLabel = (p: string) => {
    switch(p) {
        case PlatformType.PS5: return 'PlayStation 5';
        case PlatformType.SWITCH: return 'Nintendo Switch';
        case PlatformType.XBOX: return 'Xbox';
        case PlatformType.STEAM: return 'Steam';
        case PlatformType.BATTLENET: return 'Battle.net';
        case PlatformType.PC: return 'PC / Other';
        default: return p;
    }
  };

  // Helper to render platform section
  const renderPlatformGroup = (platform: string, groupGames: Game[], variant: 'list' | 'grid') => (
      <div key={platform} className="mb-4 break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700/50 pb-1">
              {getPlatformLabel(platform)}
          </h3>
          <div className={variant === 'grid' ? "grid grid-cols-4 gap-3" : "flex flex-col gap-2"}>
              {groupGames.map((game, i) => (
                  <div key={game.id} className={`
                     relative group
                     ${variant === 'list' 
                        ? 'flex items-center gap-3 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm' 
                        : 'aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-slate-800'}
                     ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}
                  `}>
                      {/* PS5 Platinum Badge */}
                      {game.isPlatinum && game.platform === PlatformType.PS5 && (
                          <div className="absolute -top-1 -left-1 z-20 bg-cyan-950 rounded-full p-1 border border-cyan-400 shadow-lg">
                              <Trophy size={10} className="text-cyan-400" fill="currentColor" />
                          </div>
                      )}

                      {variant === 'list' ? (
                          <>
                             {/* Mobile List Item Content */}
                            <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden shadow-sm flex-shrink-0 relative">
                                {game.imageUrl && <img src={game.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-sm truncate ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'text-cyan-200' : 'text-white'}`}>
                                    {game.name}
                                </div>
                            </div>
                          </>
                      ) : (
                          <>
                              {/* Grid Item Content */}
                              {game.imageUrl ? (
                                  <img src={game.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Image</div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4">
                                  <div className={`text-[10px] font-bold truncate text-center ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'text-cyan-200' : 'text-white'}`}>
                                    {game.name}
                                  </div>
                              </div>
                          </>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden relative z-10 shadow-2xl"
      >
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-800 p-6 flex flex-col gap-6 border-r border-slate-700 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Share2 className="text-indigo-400" /> Share Recap
            </h2>
            <button onClick={onClose} className="md:hidden text-slate-400"><X /></button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select Layout</h3>
            
            <button 
              onClick={() => setLayout('poster')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${layout === 'poster' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <LayoutGrid size={18} />
              <div className="text-left">
                <div className="font-medium">Poster</div>
                <div className="text-xs opacity-70">Top 3 + Categories</div>
              </div>
            </button>

            <button 
              onClick={() => setLayout('mobile')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${layout === 'mobile' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Smartphone size={18} />
              <div className="text-left">
                <div className="font-medium">Mobile Story</div>
                <div className="text-xs opacity-70">Tall format (9:16)</div>
              </div>
            </button>

            <button 
              onClick={() => setLayout('grid')}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${layout === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <Columns size={18} />
              <div className="text-left">
                <div className="font-medium">Grid Card</div>
                <div className="text-xs opacity-70">Square grid</div>
              </div>
            </button>
          </div>
          
           <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 mb-2">Current Quote</h4>
                <p className="text-xs text-slate-300 italic mb-2">"{GENERIC_QUOTES[quoteIndex]}"</p>
                <button onClick={randomizeQuote} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                    <Dices size={12} /> Randomize
                </button>
            </div>

          <div className="mt-auto">
             <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>Loading...</>
              ) : (
                <>
                  <Download size={20} />
                  Download Image
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">Best for Social Media</p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-8 relative">
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white hidden md:block z-50 bg-slate-800/50 p-2 rounded-full"><X /></button>
           
           {/* The Capture Container */}
           <div 
             ref={previewRef}
             className={`bg-slate-900 text-white shadow-2xl transform transition-all duration-300 origin-center flex-shrink-0 relative overflow-hidden
               ${layout === 'poster' ? 'w-[600px] min-h-[800px]' : ''}
               ${layout === 'mobile' ? 'w-[400px] min-h-[700px]' : ''}
               ${layout === 'grid' ? 'w-[800px] min-h-[600px]' : ''}
             `}
           >
             {/* Background Pattern */}
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 z-0"></div>
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
             
             {/* Content */}
             <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 pixel-font tracking-tighter mb-2">
                        2025 GAME RECAP
                    </h1>
                     <h2 className="text-xl font-bold text-white mb-2">2025 游戏总结</h2>
                     <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic relative group cursor-pointer" onClick={randomizeQuote}>
                         <span>"{GENERIC_QUOTES[quoteIndex]}"</span>
                         <Dices size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                     </div>
                </div>
                
                 <div className="flex justify-between items-end border-b border-slate-700/50 pb-4 mb-6">
                     <div className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.3em]">COLLECTION</div>
                     <div className="text-right">
                        <div className="text-3xl font-black text-white">{games.length}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Games Played</div>
                    </div>
                 </div>

                {/* --- Poster Layout --- */}
                {layout === 'poster' && (
                  <div className="flex flex-col gap-6 flex-1">
                     {/* Top 3 Podium (Overall) */}
                     {top3.length > 0 && (
                         <div className="grid grid-cols-3 gap-3 mb-2 items-end">
                            {top3.map((game, i) => (
                               <div key={game.id} className={`flex flex-col gap-2 ${i === 0 ? 'order-2 -mt-6' : i === 1 ? 'order-1' : 'order-3'}`}>
                                  <div className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-2xl
                                    ${i === 0 ? 'border-yellow-400 shadow-yellow-900/40 scale-110 z-10' : ''}
                                    ${i === 1 ? 'border-slate-300 shadow-slate-900/40' : ''}
                                    ${i === 2 ? 'border-orange-400 shadow-orange-900/40' : ''}
                                  `}>
                                     {game.imageUrl ? (
                                        <img src={game.imageUrl} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                     ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-slate-600">No Art</div>
                                     )}
                                     <div className="absolute top-2 left-2">
                                        {i === 0 && <span className="text-2xl filter drop-shadow-md">👑</span>}
                                     </div>
                                      {/* Platinum Badge on Top 3 */}
                                      {game.isPlatinum && game.platform === PlatformType.PS5 && (
                                          <div className="absolute top-2 right-2 bg-cyan-950/80 backdrop-blur-sm rounded-full p-1 border border-cyan-400 shadow-lg">
                                              <Trophy size={14} className="text-cyan-400" fill="currentColor" />
                                          </div>
                                      )}
                                  </div>
                                  <div className="text-center">
                                     <div className={`text-xs font-bold truncate px-1 ${i === 0 ? 'text-yellow-400' : 'text-slate-300'}`}>{game.name}</div>
                                  </div>
                               </div>
                            ))}
                         </div>
                     )}
                     
                     {/* Categorized Lists */}
                     <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {Object.entries(groupedGames).map(([platform, pGames]) => {
                             // Don't show games already in Top 3 if you want to avoid duplicates? 
                             // Usually "Top 3" are special, but listing them again in categories is fine for completeness.
                             // Let's list everything in categories to show platform breakdown clearly.
                             const listGames = pGames || [];
                             if (listGames.length === 0) return null;
                             
                             return (
                                 <div key={platform} className="break-inside-avoid">
                                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 border-b border-slate-700/50 pb-0.5">
                                         {getPlatformLabel(platform)}
                                     </h3>
                                     <div className="space-y-1">
                                         {listGames.map(game => (
                                             <div key={game.id} className="flex items-center gap-2 group">
                                                 <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'bg-slate-600'}`}></div>
                                                 <span className={`text-[10px] truncate ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'text-cyan-200 font-medium' : 'text-slate-300'}`}>
                                                     {game.name}
                                                 </span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             );
                        })}
                     </div>
                  </div>
                )}

                {/* --- Mobile Layout --- */}
                {layout === 'mobile' && (
                   <div className="flex-1 flex flex-col gap-6">
                       {Object.entries(groupedGames).map(([platform, pGames]) => {
                            if (!pGames || pGames.length === 0) return null;
                            return renderPlatformGroup(platform, pGames, 'list');
                       })}
                   </div>
                )}

                {/* --- Grid Layout --- */}
                {layout === 'grid' && (
                    <div className="flex-1 space-y-6">
                        {Object.entries(groupedGames).map(([platform, pGames]) => {
                             if (!pGames || pGames.length === 0) return null;
                             return renderPlatformGroup(platform, pGames, 'grid');
                        })}
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center opacity-60">
                    <div className="text-[10px] text-slate-400">Generated by Game Year Recap</div>
                    <div className="flex gap-2">
                        {['PS5', 'PC', 'NS', 'XB'].map(p => (
                            <span key={p} className="text-[8px] border border-slate-600 px-1 rounded text-slate-500">{p}</span>
                        ))}
                    </div>
                </div>
             </div>
           </div>

        </div>
      </motion.div>
    </div>
  );
};

export default ShareModal;
