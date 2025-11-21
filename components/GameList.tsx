
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Reorder, AnimatePresence, motion, useDragControls } from 'framer-motion';
import { 
  GripVertical, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  RefreshCcw, 
  Link as LinkIcon, 
  Plus, 
  Trophy
} from 'lucide-react';
import { Game, PlatformType } from '../types';
import { POPULAR_GAMES } from '../data/gameDatabase';

interface GameListProps {
  platform: PlatformType;
  title: string;
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
  onGenerate: (ids: string[], randomize?: boolean) => void;
  onDelete: (ids: string[]) => void;
  onUpload: (id: string, file: File) => void;
  onAddGame: (name: string, category: 'single' | 'multi') => void;
  onToggleCategory: (id: string) => void;
  onTogglePlatinum: (id: string) => void;
  onRequestUrlInput: (id: string) => void;
}

// Diamond Particle Component for Platinum Effect
const DiamondParticle = ({ delay, x }: { delay: number; x: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0, rotate: 0 }}
    animate={{ 
      opacity: [0, 1, 0], 
      y: -40, 
      scale: [0, 1.2, 0], 
      rotate: [0, 45, 90] 
    }}
    transition={{ 
      duration: 2.5, 
      repeat: Infinity, 
      delay: delay, 
      ease: "easeOut" 
    }}
    className="absolute bottom-0 w-1.5 h-1.5 bg-cyan-200 rotate-45 shadow-[0_0_5px_rgba(165,243,252,0.8)] z-0 pointer-events-none"
    style={{ left: x }}
  />
);

// Rank Crown Component
const RankCrown = ({ rank, category }: { rank: number; category: 'single' | 'multi' }) => {
  if (rank > 3) return null;

  // Crown Colors
  const styles = {
    1: { 
      fill: "url(#gradGold)", 
      stroke: "#b45309", 
      shadow: "drop-shadow-[0_2px_4px_rgba(234,179,8,0.6)]" 
    },
    2: { 
      fill: "url(#gradSilver)", 
      stroke: "#475569", 
      shadow: "drop-shadow-[0_2px_4px_rgba(148,163,184,0.6)]" 
    },
    3: { 
      fill: "url(#gradBronze)", 
      stroke: "#7c2d12", 
      shadow: "drop-shadow-[0_2px_4px_rgba(249,115,22,0.6)]" 
    }
  };

  const currentStyle = styles[rank as 1|2|3];

  const CrownSVG = ({ className }: { className?: string }) => (
    <svg 
      viewBox="0 0 24 24" 
      width="22" 
      height="22" 
      className={`overflow-visible ${currentStyle.shadow} ${className}`}
    >
      <defs>
        <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" /> 
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="gradSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="gradBronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        
        {/* Shine Gradient */}
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Crown Shape */}
      <path 
        d="M2 4L5 16H19L22 4L15 11L12 4L9 11L2 4Z" 
        fill={currentStyle.fill} 
        stroke={currentStyle.stroke} 
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Animated Shine Overlay using Mask */}
      <mask id={`mask-${rank}-${category}`}>
         <path d="M2 4L5 16H19L22 4L15 11L12 4L9 11L2 4Z" fill="white" />
      </mask>
      <rect 
        x="-100%" 
        y="0" 
        width="50%" 
        height="100%" 
        fill="url(#shine)" 
        mask={`url(#mask-${rank}-${category})`}
        style={{ mixBlendMode: 'overlay' }}
      >
        <animate attributeName="x" from="-100%" to="200%" dur="2.5s" repeatCount="indefinite" />
      </rect>
    </svg>
  );

  return (
    <div className="absolute -top-3 -left-2 z-50 flex pointer-events-none">
       <div className="relative">
         {/* Double Crown for Multi */}
         {category === 'multi' && (
            <div className="absolute -right-2.5 -top-1 transform rotate-12 opacity-90 scale-90 origin-bottom-left">
              <CrownSVG />
            </div>
         )}
         {/* Main Crown */}
         <div className="relative z-10">
           <CrownSVG />
         </div>
       </div>
    </div>
  );
};

interface GameItemProps {
  game: Game;
  index: number;
  onGenerate: (ids: string[], randomize?: boolean) => void;
  onRequestUrlInput: (id: string) => void;
  onUpload: (id: string, file: File) => void;
  onDelete: (ids: string[]) => void;
  onToggleCategory: (id: string) => void;
  onTogglePlatinum: (id: string) => void;
}

// Sub-component for individual list item to handle drag controls
const GameItem: React.FC<GameItemProps> = ({ 
  game, 
  index,
  onGenerate, 
  onRequestUrlInput, 
  onUpload, 
  onDelete, 
  onToggleCategory,
  onTogglePlatinum
}) => {
  const dragControls = useDragControls();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(game.id, e.target.files[0]);
    }
  };
  
  return (
    <Reorder.Item
      value={game}
      id={game.id}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      {/* Platinum Glow Container */}
      <div className={`relative rounded-lg transition-all duration-500 ${game.isPlatinum ? 'p-[1px]' : 'p-0'}`}>
        
        {/* Animated Border for Platinum */}
        {game.isPlatinum && (
           <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 via-white/60 to-cyan-500/30 blur-[2px] animate-pulse" />
        )}
        
        {/* Particles for Platinum */}
        {game.isPlatinum && (
          <div className="absolute inset-0 overflow-visible pointer-events-none">
             <DiamondParticle delay={0} x="10%" />
             <DiamondParticle delay={0.8} x="30%" />
             <DiamondParticle delay={1.5} x="60%" />
             <DiamondParticle delay={0.4} x="85%" />
          </div>
        )}

        <motion.div
          layoutId={game.id}
          className={`
            relative z-10
            bg-slate-800/90 hover:bg-slate-800 border 
            ${game.isPlatinum 
              ? 'border-cyan-300/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
              : 'border-slate-700/50 hover:border-indigo-500/30'
            } 
            rounded-lg transition-all duration-200 flex items-center gap-3 p-2 pr-1 overflow-hidden group
            ${game.selected ? 'ring-1 ring-indigo-500 bg-indigo-900/10' : ''}
          `}
        >
          {/* Diamond Shine Overlay */}
          {game.isPlatinum && (
            <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-30" style={{
                background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)",
                backgroundSize: "200% 100%",
                animation: "shine 3s infinite linear"
            }}></div>
          )}

          {/* Image Area */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-slate-950 rounded-md overflow-visible border border-slate-700 shadow-inner group/img">
            {/* Rank Badge (Crown) */}
            <RankCrown rank={index + 1} category={game.category} />
            
            <div className="w-full h-full overflow-hidden rounded-md">
                {game.isLoadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : game.imageUrl ? (
                  <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900">
                    <ImageIcon size={20} />
                  </div>
                )}
            </div>

            {/* Image Hover Controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 backdrop-blur-[1px] z-30 rounded-md">
              <div className="flex gap-1 w-full px-1 h-1/2">
                 <label className="flex-1 cursor-pointer text-white hover:text-indigo-300 bg-slate-700/80 hover:bg-slate-600 rounded-[2px] transition-colors flex items-center justify-center" title="Upload">
                  <Upload size={10} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} onClick={(e) => e.stopPropagation()} />
                </label>
                 <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRequestUrlInput(game.id)}
                  title="Link URL"
                  className="flex-1 text-white hover:text-indigo-300 bg-slate-700/80 hover:bg-slate-600 rounded-[2px] transition-colors flex items-center justify-center"
                >
                  <LinkIcon size={10} />
                </button>
              </div>
               <div className="flex w-full px-1 h-1/2 pb-0.5">
                 <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onGenerate([game.id], true)}
                  title="Regenerate Art (Random)"
                  className="w-full text-white hover:text-indigo-300 bg-slate-700/80 hover:bg-slate-600 rounded-[2px] transition-colors flex items-center justify-center"
                >
                  <RefreshCcw size={10} />
                </button>
               </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center h-full z-20">
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm truncate pr-2 select-none ${game.isPlatinum ? 'text-cyan-100 drop-shadow-md' : 'text-slate-200'}`} title={game.name}>{game.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <button 
                onClick={() => onToggleCategory(game.id)}
                className={`
                  text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wide cursor-pointer select-none transition-all active:scale-95
                  ${game.category === 'single' 
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
                    : 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20'}
                `}
                title="Click to toggle category"
              >
                {game.category === 'single' ? 'Single' : 'Multi'}
              </button>

              {/* PS5 Platinum Trophy Toggle */}
              {game.platform === PlatformType.PS5 && (
                 <button
                    onClick={() => onTogglePlatinum(game.id)}
                    className={`
                        p-0.5 rounded-full transition-all duration-300
                        ${game.isPlatinum 
                            ? 'text-cyan-200 drop-shadow-[0_0_8px_rgba(165,243,252,1)] scale-110' 
                            : 'text-slate-600 hover:text-slate-400 grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}
                    `}
                    title={game.isPlatinum ? "Platinum Achieved!" : "Mark as Platinum"}
                 >
                    <Trophy size={14} fill={game.isPlatinum ? "currentColor" : "none"} strokeWidth={game.isPlatinum ? 1.5 : 2} />
                 </button>
              )}

              {/* Actions visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2">
                <button
                  onClick={() => onDelete([game.id])}
                  className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Drag Handle */}
          <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 md:p-2 z-30 flex-shrink-0 touch-none"
          >
            <GripVertical size={14} />
          </div>
        </motion.div>
      </div>
      <style>{`
        @keyframes shine {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
      `}</style>
    </Reorder.Item>
  );
};

const GameList: React.FC<GameListProps> = ({
  platform,
  title,
  games,
  onUpdateGames,
  onGenerate,
  onDelete,
  onUpload,
  onAddGame,
  onToggleCategory,
  onTogglePlatinum,
  onRequestUrlInput
}) => {
  const [inputName, setInputName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const isComposing = useRef(false);
  const suggestionsListRef = useRef<HTMLDivElement>(null);

  // Filtering suggestions
  const suggestions = useMemo(() => {
    if (!inputName.trim()) return [];
    const term = inputName.toLowerCase();
    return POPULAR_GAMES
      .filter(g => g.toLowerCase().includes(term));
  }, [inputName]);

  // Auto-scroll to selected suggestion
  useEffect(() => {
    if (showSuggestions && selectedIndex >= 0 && suggestionsListRef.current) {
      const listElement = suggestionsListRef.current;
      const selectedItem = listElement.children[selectedIndex] as HTMLElement;
      
      if (selectedItem) {
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.offsetHeight;
        const containerTop = listElement.scrollTop;
        const containerBottom = containerTop + listElement.clientHeight;

        if (itemTop < containerTop) {
          listElement.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          listElement.scrollTop = itemBottom - listElement.clientHeight;
        }
      }
    }
  }, [selectedIndex, showSuggestions]);

  const handleAdd = () => {
    if (inputName.trim()) {
      onAddGame(inputName, 'single'); // Default to Single, user can toggle later
      setInputName('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (s: string) => {
      setInputName(s);
      setShowSuggestions(false);
      setSelectedIndex(-1);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        // Prevent add if IME composition is active (User pressing enter to confirm Chinese characters)
        if (isComposing.current || e.nativeEvent.isComposing) {
            return;
        }

        e.preventDefault();
        
        // If a suggestion is selected via Arrow keys, add it DIRECTLY to list
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onAddGame(suggestions[selectedIndex], 'single');
            setInputName('');
            setShowSuggestions(false);
            setSelectedIndex(-1);
        } else {
            // Otherwise add whatever is typed
            handleAdd();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!showSuggestions) return;
        setSelectedIndex(prev => {
            if (prev >= suggestions.length - 1) return 0; // Cycle to top
            return prev + 1;
        });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!showSuggestions) {
             return;
        }
        setSelectedIndex(prev => {
            if (prev <= 0) return suggestions.length - 1; // Cycle to bottom
            return prev - 1;
        });
    } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-20">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          {title}
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{games.length}</span>
        </h3>
      </div>

      {/* Add Game Input */}
      <div className="p-3 border-b border-slate-800/50 bg-slate-900/30 relative z-30">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onCompositionStart={() => { isComposing.current = true; }}
              onCompositionEnd={() => { isComposing.current = false; }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Add game..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            {/* Autocomplete Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                    ref={suggestionsListRef}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar"
                >
                    {suggestions.map((s, i) => (
                    <div
                        key={i}
                        className={`px-3 py-2 text-sm cursor-pointer truncate transition-colors border-b border-slate-700/50 last:border-0
                            ${i === selectedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-indigo-600 hover:text-white'}
                        `}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            handleSuggestionClick(s);
                        }}
                        onMouseEnter={() => setSelectedIndex(i)}
                    >
                        {s}
                    </div>
                    ))}
                </motion.div>
                )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={handleAdd}
            disabled={!inputName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors shadow-lg shadow-indigo-500/20 flex-shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative min-h-[200px]">
        <Reorder.Group
          axis="y"
          values={games}
          onReorder={onUpdateGames}
          className="flex flex-col gap-2"
        >
          <AnimatePresence mode='popLayout'>
            {games.map((game, index) => (
              <GameItem
                key={game.id}
                index={index}
                game={game}
                onGenerate={onGenerate}
                onRequestUrlInput={onRequestUrlInput}
                onUpload={onUpload}
                onDelete={onDelete}
                onToggleCategory={onToggleCategory}
                onTogglePlatinum={onTogglePlatinum}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {games.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-800/50 rounded-lg text-slate-700 text-xs flex flex-col items-center gap-2 mt-4">
            <div className="p-3 bg-slate-800/30 rounded-full">
              <ImageIcon size={24} className="opacity-40" />
            </div>
            <span className="opacity-60">List is empty</span>
            <span className="text-[10px] opacity-40">Add games to start collection</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameList;
