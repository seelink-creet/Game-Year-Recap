
import React, { useState, useRef, useEffect } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { Game, PlatformType } from '../types';
import { Crown, Trash2, Image as ImageIcon, GripVertical, Upload, Plus, User, Users, Gamepad2, Search, ImageDown, RefreshCw, Trophy, Sparkles, Link as LinkIcon } from 'lucide-react';
import { POPULAR_GAMES } from '../data/gameDatabase';

interface GameListProps {
  platform: PlatformType;
  games: Game[];
  onUpdateGames: (games: Game[]) => void; 
  onGenerate: (gameIds: string[], randomize?: boolean) => void;
  onDelete: (gameIds: string[]) => void;
  onUpload: (gameId: string, file: File) => void;
  onAddGame: (name: string, category: 'single' | 'multi') => void;
  viewMode: 'single' | 'dual';
  onToggleViewMode: () => void;
  title?: string;
  onRequestUrlInput: (gameId: string) => void;
}

// Helper for rank icons
const getCrownColor = (index: number) => {
  if (index === 0) return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"; // Gold
  if (index === 1) return "text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]"; // Silver
  if (index === 2) return "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]"; // Bronze
  return "hidden";
};

const renderRankIcon = (index: number, category: 'single' | 'multi') => {
  if (index > 2) {
    return <span className="text-slate-600 font-mono text-sm">#{index + 1}</span>;
  }

  const colorClass = getCrownColor(index);

  if (category === 'multi') {
    // Double Crown for "Played Together"
    return (
      <div className="relative w-8 h-6 flex items-center justify-center">
         <Crown size={18} className={`absolute left-0 ${colorClass} z-10`} fill="currentColor" />
         <Crown size={18} className={`absolute left-3 top-[-2px] ${colorClass} opacity-80`} fill="currentColor" />
      </div>
    );
  }

  // Single Crown for "Played Alone"
  return <Crown size={20} className={colorClass} fill="currentColor" />;
};

// Platinum Particle Effect Component
const PlatinumParticles = () => {
  // Create random particles
  const particles = Array.from({ length: 6 });
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-20">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.9)]"
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: Math.random() * 100 + "%", // Initial vague position
            y: Math.random() * 100 + "%"
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            // Move slightly
            top: [
              `${Math.random() * 100}%`, 
              `${Math.random() * 100}%`
            ],
            left: [
              `${Math.random() * 100}%`, 
              `${Math.random() * 100}%`
            ],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
      {/* Moving sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite_linear]" />
    </div>
  );
};

interface SubListProps {
  category: 'single' | 'multi';
  list: Game[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onAdd: () => void;
  onReorder: (newOrder: Game[]) => void;
  toggleSelect: (id: string) => void;
  onUpload: (id: string, file: File) => void;
  onRefresh: (id: string) => void;
  isEditMode: boolean;
  suggestions: string[];
  onSelectSuggestion: (name: string) => void;
  togglePlatinum: (id: string) => void;
  onRequestUrlInput: (gameId: string) => void;
}

const SubList: React.FC<SubListProps> = ({ 
  category, 
  list, 
  inputValue, 
  onInputChange, 
  onAdd, 
  onReorder, 
  toggleSelect, 
  onUpload,
  onRefresh,
  isEditMode,
  suggestions,
  onSelectSuggestion,
  togglePlatinum,
  onRequestUrlInput
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    // Reset selection when input changes
    setSelectedIndex(-1);
    // Show suggestions only if there is input and matches
    if (inputValue.trim().length > 0 && suggestions.length > 0) {
        setShowSuggestions(true);
    } else {
        setShowSuggestions(false);
    }
  }, [inputValue, suggestions]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
        const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
        }
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Cycle down: Loop back to top if at bottom
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Cycle up: Loop to bottom if at top or at input (-1)
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelectSuggestion(suggestions[selectedIndex]);
            setShowSuggestions(false);
        } else {
            onAdd();
        }
    } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-700/50 pb-1">
        {category === 'single' ? <User size={14} className="text-indigo-400"/> : <Users size={14} className="text-pink-400"/>}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {category === 'single' ? '单独玩的' : '一起玩的'}
        </span>
      </div>

      <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-3 min-h-[50px]">
        <AnimatePresence mode='popLayout'>
          {list.map((game, index) => {
             const isPS5 = game.platform === PlatformType.PS5;
             const isPlatinum = !!game.isPlatinum;
             
             return (
            <Reorder.Item
              key={game.id}
              value={game}
              whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 50 }}
              className="relative"
            >
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`
                  relative flex items-center gap-2 md:gap-3 p-2 rounded-lg border transition-all overflow-hidden
                  ${game.selected && isEditMode ? 'ring-2 ring-indigo-500 bg-slate-750' : ''}
                  ${isPlatinum 
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                `}
                style={isPlatinum ? {
                    border: '1px solid transparent',
                    backgroundImage: 'linear-gradient(#0f172a, #0f172a), linear-gradient(135deg, #94a3b8 0%, #e2e8f0 50%, #94a3b8 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'content-box, border-box',
                    boxShadow: '0 0 15px rgba(226, 232, 240, 0.15), inset 0 0 20px rgba(226, 232, 240, 0.05)'
                } : {}}
              >
                {/* Platinum Special Effects */}
                {isPlatinum && (
                  <>
                     <PlatinumParticles />
                     {/* Ambient glow */}
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg blur-sm opacity-50" />
                  </>
                )}

                {/* Checkbox (Edit Mode Only) */}
                {isEditMode && (
                   <div 
                      className="flex items-center justify-center cursor-pointer p-1 hover:bg-slate-700 rounded z-30"
                      onClick={() => toggleSelect(game.id)}
                      onPointerDown={(e) => e.stopPropagation()}
                   >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${game.selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-slate-900'}`}>
                         {game.selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                   </div>
                )}

                {/* Rank/Crown */}
                <div className="w-6 md:w-8 flex items-center justify-center shrink-0 relative z-30">
                  {renderRankIcon(index, category)}
                </div>

                {/* Image Area */}
                <div 
                    className={`
                        relative w-10 h-10 md:w-14 md:h-14 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-700 shadow-sm 
                        group transition-all z-30
                        ${!isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400/50' : ''}
                    `}
                    onClick={(e) => {
                        if (!isEditMode) {
                            e.stopPropagation();
                            onRefresh(game.id);
                        }
                    }}
                    onPointerDown={(e) => {
                        // Prevent drag when clicking image in non-edit mode
                        if(!isEditMode) e.stopPropagation();
                    }}
                >
                  {game.isLoadingImage ? (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                  ) : game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                       <ImageIcon size={14} />
                    </div>
                  )}
                  
                  {/* Default Mode: Hover Refresh Button */}
                  {!isEditMode && !game.isLoadingImage && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <RefreshCw size={16} className="text-white drop-shadow-md" />
                     </div>
                  )}

                  {/* Edit Mode: Actions - Always visible in Edit Mode */}
                  {isEditMode && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-0.5 gap-0.5 z-20"
                     >
                        <div className="flex gap-0.5 w-full h-1/2 min-h-0">
                            {/* Upload Button */}
                            <label 
                               className="flex-1 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-sm cursor-pointer transition-colors" 
                               title="Upload Image"
                               onClick={(e) => e.stopPropagation()}
                               onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Upload size={12} />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      onUpload(game.id, e.target.files[0]);
                                    }
                                  }}
                                />
                            </label>
                            
                            {/* Link URL Button */}
                            <button
                                type="button"
                                className="flex-1 flex items-center justify-center bg-slate-700 hover:bg-blue-600 text-white rounded-sm transition-colors"
                                title="Paste Image URL"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRequestUrlInput(game.id);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                               <LinkIcon size={12} />
                            </button>
                        </div>

                        {/* Refresh Button */}
                        <button 
                            className="w-full h-1/2 min-h-0 flex items-center justify-center bg-slate-700 hover:bg-indigo-600 text-white rounded-sm transition-colors"
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onRefresh(game.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Refresh Image"
                        >
                            <RefreshCw size={12} />
                        </button>
                     </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 overflow-hidden z-30 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                      <h3 className={`text-[10px] md:text-xs font-bold truncate leading-tight ${isPlatinum ? 'text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-200'}`}>
                        {game.name}
                      </h3>
                      {/* PS5 Platinum Badge (Visual) */}
                      {isPS5 && isPlatinum && (
                          <Sparkles size={10} className="text-blue-200 fill-blue-100 shrink-0 animate-pulse" />
                      )}
                  </div>
                  {/* Hint text */}
                  {isPS5 && isEditMode && (
                      <div className="text-[9px] text-slate-500 mt-0.5">{isPlatinum ? "Platinum Achieved!" : "Click trophy to platinum"}</div>
                  )}
                </div>

                {/* Platinum Toggle Button (PS5 Only) */}
                {isPS5 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); togglePlatinum(game.id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`
                            p-1.5 rounded-full transition-all z-30 ml-1
                            ${isPlatinum 
                                ? 'bg-slate-200 text-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.6)] ring-2 ring-white' 
                                : 'text-slate-700 hover:text-slate-400 hover:bg-slate-700/50'}
                        `}
                        title={isPlatinum ? "Remove Platinum Status" : "Mark as Platinum"}
                    >
                        <Trophy size={14} className={isPlatinum ? "fill-slate-900" : ""} />
                    </button>
                )}

                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 md:p-2 z-30">
                  <GripVertical size={14} />
                </div>
              </motion.div>
            </Reorder.Item>
          )}})
        </AnimatePresence>
        {list.length === 0 && (
           <div className="text-center py-4 border-2 border-dashed border-slate-800/50 rounded-lg text-slate-700 text-[10px]">
              Empty List
           </div>
        )}
      </Reorder.Group>

      {/* Input Area for this list */}
      <div className="mt-auto relative" ref={wrapperRef}>
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800 focus-within:border-indigo-500/50 transition-colors">
          <input
            type="text"
            placeholder="Game Name..."
            className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 w-full px-2"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
                if(inputValue.trim().length > 0 && suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          <button 
            onClick={onAdd}
            className="p-1.5 bg-slate-700 rounded hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
            {showSuggestions && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50"
                    ref={suggestionsRef}
                >
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${idx === selectedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-indigo-600 hover:text-white'}`}
                            onClick={() => {
                                onSelectSuggestion(suggestion);
                                setShowSuggestions(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <Search size={10} className="opacity-50" />
                            {suggestion}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const GameList: React.FC<GameListProps> = ({ 
  platform, 
  games, 
  onUpdateGames, 
  onGenerate, 
  onDelete, 
  onUpload, 
  onAddGame,
  viewMode, 
  onToggleViewMode,
  title,
  onRequestUrlInput
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [inputs, setInputs] = useState({ single: '', multi: '' });

  // Filter games by category
  const singleGames = games.filter(g => g.category === 'single');
  const multiGames = games.filter(g => g.category === 'multi');

  // Helper to filter suggestions with smart matching
  const getSuggestions = (input: string) => {
      if (!input.trim()) return [];
      const lowerInput = input.toLowerCase();
      return POPULAR_GAMES.filter(game => 
          game.toLowerCase().includes(lowerInput)
      ).slice(0, 8); // Limit to 8 suggestions
  };

  const handleReorder = (newCategoryOrder: Game[], category: 'single' | 'multi') => {
    const otherGames = games.filter(g => g.category !== category);
    onUpdateGames([...otherGames, ...newCategoryOrder]);
  };

  const toggleSelect = (id: string) => {
    const updated = games.map(g => g.id === id ? { ...g, selected: !g.selected } : g);
    onUpdateGames(updated);
  };
  
  const togglePlatinum = (id: string) => {
      const updated = games.map(g => g.id === id ? { ...g, isPlatinum: !g.isPlatinum } : g);
      onUpdateGames(updated);
  };

  const handleGenerateSelected = () => {
    const selectedIds = games.filter(g => g.selected).map(g => g.id);
    if (selectedIds.length > 0) onGenerate(selectedIds, false); // Bulk search uses default (best match)
  };

  const handleDeleteSelected = () => {
    const selectedIds = games.filter(g => g.selected).map(g => g.id);
    if (selectedIds.length > 0) onDelete(selectedIds);
  };

  const handleAdd = (category: 'single' | 'multi', overrideName?: string) => {
    const val = overrideName || inputs[category];
    if (val.trim()) {
      onAddGame(val, category);
      setInputs(prev => ({ ...prev, [category]: '' }));
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-700 flex flex-col h-full transition-all duration-300 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate">
          {title || platform}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* View Toggle */}
          <button
            onClick={onToggleViewMode}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'dual' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
            title={viewMode === 'single' ? "Switch to Multiplayer View" : "Switch to Single Player View"}
          >
             {viewMode === 'single' ? (
                <Gamepad2 size={16} />
             ) : (
                <div className="flex items-center">
                  <Gamepad2 size={16} />
                  <Gamepad2 size={16} className="-ml-1.5 opacity-80" />
                </div>
             )}
          </button>

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isEditMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:text-white'}`}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            <button 
              onClick={handleGenerateSelected}
              className="flex items-center gap-1 text-xs bg-emerald-900/50 text-emerald-400 px-3 py-2 rounded hover:bg-emerald-900 border border-emerald-800 transition flex-1 justify-center whitespace-nowrap"
            >
              <ImageDown size={14} /> Search Cover
            </button>
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 text-xs bg-red-900/50 text-red-400 px-3 py-2 rounded hover:bg-red-900 border border-red-800 transition flex-1 justify-center whitespace-nowrap"
            >
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists Container */}
      <div className={`transition-all duration-300 ${viewMode === 'dual' ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}`}>
        <SubList 
          category="single" 
          list={singleGames} 
          inputValue={inputs.single}
          onInputChange={(val) => setInputs(prev => ({...prev, single: val}))}
          onAdd={() => handleAdd('single')}
          onReorder={(order) => handleReorder(order, 'single')}
          toggleSelect={toggleSelect}
          onUpload={onUpload}
          onRefresh={(id) => onGenerate([id], true)}
          isEditMode={isEditMode}
          suggestions={getSuggestions(inputs.single)}
          onSelectSuggestion={(name) => handleAdd('single', name)}
          togglePlatinum={togglePlatinum}
          onRequestUrlInput={onRequestUrlInput}
        />
        
        {viewMode === 'dual' && (
          <SubList 
            category="multi" 
            list={multiGames} 
            inputValue={inputs.multi}
            onInputChange={(val) => setInputs(prev => ({...prev, multi: val}))}
            onAdd={() => handleAdd('multi')}
            onReorder={(order) => handleReorder(order, 'multi')}
            toggleSelect={toggleSelect}
            onUpload={onUpload}
            onRefresh={(id) => onGenerate([id], true)}
            isEditMode={isEditMode}
            suggestions={getSuggestions(inputs.multi)}
            onSelectSuggestion={(name) => handleAdd('multi', name)}
            togglePlatinum={togglePlatinum}
            onRequestUrlInput={onRequestUrlInput}
          />
        )}
      </div>
    </div>
  );
};

export default GameList;
