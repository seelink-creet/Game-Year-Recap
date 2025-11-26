import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Smartphone, Columns, Share2, Dices, Trophy, Camera } from 'lucide-react';
import { Game, PlatformType } from '../types';
import { GENERIC_QUOTES } from '../data/quotes';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  year: number;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, games, year }) => {
  const [layout, setLayout] = useState<'grid' | 'mobile' | 'poster'>('mobile');
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Ref for the content container
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale to fit the preview container
  useEffect(() => {
    const updateScale = () => {
        if (!containerRef.current) return;
        const { width: contW, height: contH } = containerRef.current.getBoundingClientRect();
        
        // Target dimensions based on layout
        let targetW = 400;
        let targetH = 700; // Minimum height to assume for scaling logic

        if (layout === 'poster') { targetW = 600; targetH = 800; }
        if (layout === 'grid') { targetW = 800; targetH = 600; }
        if (layout === 'mobile') { targetW = 400; targetH = 700; }

        // Add some padding for visuals
        const padding = 20;
        const availableW = contW - padding * 2;
        const availableH = contH - padding * 2;

        const scaleX = availableW / targetW;
        const scaleY = availableH / targetH;
        
        // Fit both width and height, capping at 1.0 to avoid pixelation
        const fitScale = Math.min(scaleX, scaleY, 1); 
        setScale(fitScale);
    };

    if (isOpen) {
        // Delay to allow flex layout to settle
        setTimeout(updateScale, 100);
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }
  }, [isOpen, layout]);

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
    
    // Catch leftovers
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

  if (!isOpen) return null;

  const top3 = games.slice(0, 3);
  
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

  const renderPlatformGroup = (platform: string, groupGames: Game[], variant: 'list' | 'grid') => (
      <div key={platform} className="mb-4 break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700/50 pb-1">
              {getPlatformLabel(platform)}
          </h3>
          <div className={variant === 'grid' ? "grid grid-cols-4 gap-3" : "flex flex-col gap-2"}>
              {groupGames.map((game) => (
                  <div key={game.id} className={`
                     relative group
                     ${variant === 'list' 
                        ? 'flex items-center gap-3 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm' 
                        : 'aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-slate-800'}
                     ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'ring-1 ring-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : ''}
                  `}>
                      {game.isPlatinum && game.platform === PlatformType.PS5 && (
                          <div className="absolute -top-1 -left-1 z-20 bg-cyan-950 rounded-full p-1 border border-cyan-400 shadow-lg">
                              <Trophy size={10} className="text-cyan-400" fill="currentColor" />
                          </div>
                      )}

                      {variant === 'list' ? (
                          <>
                            <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden shadow-sm flex-shrink-0 relative">
                                {game.imageUrl && <img src={game.imageUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-sm truncate ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'text-cyan-200' : 'text-white'}`}>
                                    {game.name}
                                </div>
                            </div>
                          </>
                      ) : (
                          <>
                              {game.imageUrl ? (
                                  <img src={game.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Image</div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4">
                                  <div className={`text-[10px] font-bold truncate text-center px-1 ${game.isPlatinum && game.platform === PlatformType.PS5 ? 'text-cyan-200' : 'text-white'}`}>
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md sm:p-4 sm:items-center sm:justify-center overflow-hidden">
      
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 w-full max-w-6xl sm:rounded-t-2xl z-20">
         <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                 <Share2 className="text-indigo-400" size={20} />
             </div>
             <div>
                 <h2 className="text-base font-bold text-white leading-tight">Share Recap</h2>
                 <p className="text-[10px] text-slate-400 hidden sm:block">Choose a layout</p>
             </div>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
             <X size={24} />
         </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-6xl bg-slate-950 sm:border-x border-slate-800 overflow-hidden">
          
          {/* Preview Area - Takes max space, centers content */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center" ref={containerRef}>
                {/* Background Dots */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                
                {/* Scaled Content Wrapper */}
                <div style={{ transform: `scale(${scale})` }} className="shadow-2xl origin-center transition-transform duration-200 ease-out">
                    {/* Source of Truth DOM */}
                    <div 
                        ref={contentRef}
                        className={`bg-slate-900 text-white relative overflow-hidden flex-shrink-0
                            ${layout === 'poster' ? 'w-[600px] min-h-[800px]' : ''}
                            ${layout === 'mobile' ? 'w-[400px] min-h-[700px]' : ''}
                            ${layout === 'grid' ? 'w-[800px] min-h-[600px]' : ''}
                        `}
                    >
                        {/* Decorative BG Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 z-0"></div>
                        <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        <div className="relative z-10 p-8 flex flex-col h-full">
                            <div className="text-center mb-6">
                                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 pixel-font tracking-tighter mb-2">
                                    2025 RECAP
                                </h1>
                                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic relative group cursor-pointer" onClick={randomizeQuote}>
                                    <span>"{GENERIC_QUOTES[quoteIndex]}"</span>
                                    <Dices size={14} className="opacity-50 group-hover:opacity-100 transition-opacity exclude-from-capture" />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end border-b border-slate-700/50 pb-4 mb-6">
                                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.3em]">COLLECTION</div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-white">{games.length}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">Games Played</div>
                                </div>
                            </div>

                            {/* Content Logic */}
                            {(layout === 'poster') && (
                                <div className="flex flex-col gap-6 flex-1">
                                    {top3.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3 mb-2 items-end">
                                            {top3.map((game, i) => (
                                                <div key={game.id} className={`flex flex-col gap-2 ${i === 0 ? 'order-2 -mt-6' : i === 1 ? 'order-1' : 'order-3'}`}>
                                                    <div className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-2xl
                                                        ${i === 0 ? 'border-yellow-400 shadow-yellow-900/40 scale-110 z-10' : ''}
                                                        ${i === 1 ? 'border-slate-300 shadow-slate-900/40' : ''}
                                                        ${i === 2 ? 'border-orange-400 shadow-orange-900/40' : ''}
                                                    `}>
                                                        {game.imageUrl ? <img src={game.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800"></div>}
                                                        <div className="absolute top-2 left-2">{i === 0 && <span className="text-2xl">👑</span>}</div>
                                                    </div>
                                                    <div className="text-center text-xs font-bold truncate px-1 text-slate-300">{game.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        {Object.entries(groupedGames).map(([platform, pGames]) => pGames && pGames.length > 0 && (
                                            <div key={platform} className="break-inside-avoid">
                                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 border-b border-slate-700/50">{getPlatformLabel(platform)}</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {pGames.map(g => (
                                                        <span key={g.id} className={`text-[9px] px-1.5 py-0.5 rounded ${g.isPlatinum ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-800' : 'bg-slate-800 text-slate-400'}`}>{g.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(layout === 'mobile' || layout === 'grid') && (
                                <div className={`flex-1 ${layout === 'grid' ? 'space-y-4' : 'flex flex-col gap-4'}`}>
                                    {Object.entries(groupedGames).map(([platform, pGames]) => {
                                        if (!pGames || pGames.length === 0) return null;
                                        return renderPlatformGroup(platform, pGames, layout === 'grid' ? 'grid' : 'list');
                                    })}
                                </div>
                            )}

                            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center opacity-50">
                                <div className="text-[10px] text-slate-400">Generated by Game Year Recap</div>
                                <div className="text-[10px] text-slate-500">{year}</div>
                            </div>
                        </div>
                    </div>
                </div>
          </div>

          {/* Controls - Fixed at bottom on mobile */}
          <div className="flex-none bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 md:w-72 flex flex-row md:flex-col gap-4 items-center md:items-stretch z-30 sm:rounded-br-2xl">
                
                {/* Layout Tabs */}
                <div className="flex-1 md:flex-none flex md:flex-col gap-2 justify-center w-full">
                    {[
                        { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                        { id: 'poster', icon: LayoutGrid, label: 'Poster' },
                        { id: 'grid', icon: Columns, label: 'Grid' }
                    ].map((opt) => (
                        <button 
                            key={opt.id}
                            onClick={() => setLayout(opt.id as any)}
                            className={`flex-1 flex flex-col md:flex-row items-center md:gap-3 p-2 md:p-3 rounded-lg transition-all text-center md:text-left
                                ${layout === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            <opt.icon size={20} className="mb-1 md:mb-0" />
                            <span className="text-[10px] md:text-sm font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>

                {/* Refresh Quote (Hidden on small mobile to save space, or icon only) */}
                <button onClick={randomizeQuote} className="p-3 bg-slate-800 rounded-lg text-cyan-400 md:hidden">
                    <Dices size={20} />
                </button>
                
                <div className="hidden md:block p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 mt-auto mb-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-2">Quote</h4>
                    <p className="text-xs text-slate-300 italic mb-2 line-clamp-3">"{GENERIC_QUOTES[quoteIndex]}"</p>
                    <button onClick={randomizeQuote} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                        <Dices size={12} /> Refresh
                    </button>
                </div>

                {/* Replaced Save Button with Instruction */}
                <div className="w-full md:w-auto px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-center flex items-center justify-center gap-2 text-slate-400">
                    <Camera size={20} />
                    <span className="text-sm">Screenshot to Share</span>
                </div>
          </div>
      </div>
    </div>
  );
};

export default ShareModal;