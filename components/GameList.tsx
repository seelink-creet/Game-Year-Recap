
import React, { useState } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { Game, PlatformType } from '../types';
import { Crown, Trash2, Image as ImageIcon, GripVertical, Upload, Plus, User, Users, Gamepad2 } from 'lucide-react';

interface GameListProps {
  platform: PlatformType;
  games: Game[];
  onUpdateGames: (games: Game[]) => void; 
  onGenerate: (gameIds: string[]) => void;
  onDelete: (gameIds: string[]) => void;
  onUpload: (gameId: string, file: File) => void;
  onAddGame: (name: string, category: 'single' | 'multi') => void;
  viewMode: 'single' | 'dual';
  onToggleViewMode: () => void;
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

interface SubListProps {
  category: 'single' | 'multi';
  list: Game[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onAdd: () => void;
  onReorder: (newOrder: Game[]) => void;
  toggleSelect: (id: string) => void;
  onUpload: (id: string, file: File) => void;
  isEditMode: boolean;
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
  isEditMode 
}) => {
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
          {list.map((game, index) => (
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
                className={`relative flex items-center gap-2 md:gap-3 p-2 rounded-lg bg-slate-800 border border-slate-700 group hover:border-slate-500 transition-all ${game.selected && isEditMode ? 'ring-2 ring-indigo-500 bg-slate-750' : ''}`}
              >
                {/* Checkbox (Edit Mode Only) - Moved to far left and enlarged */}
                {isEditMode && (
                   <div 
                      className="flex items-center justify-center cursor-pointer p-1 hover:bg-slate-700 rounded"
                      onClick={() => toggleSelect(game.id)}
                   >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${game.selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-slate-900'}`}>
                         {game.selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                      </div>
                   </div>
                )}

                {/* Rank/Crown */}
                <div className="w-6 md:w-8 flex items-center justify-center shrink-0">
                  {renderRankIcon(index, category)}
                </div>

                {/* Image Area */}
                <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-700 shadow-sm group-hover:shadow-indigo-500/20 transition-shadow">
                  {game.isGenerating ? (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                  ) : game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                       <ImageIcon size={14} />
                    </div>
                  )}
                  
                  {/* Hover Actions for Image */}
                  {isEditMode && (
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <label className="cursor-pointer p-1 bg-slate-700 rounded hover:bg-slate-600 text-white">
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
                     </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="text-[10px] md:text-xs font-bold text-slate-200 truncate leading-tight">{game.name}</h3>
                </div>

                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 md:p-2">
                  <GripVertical size={14} />
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
        {list.length === 0 && (
           <div className="text-center py-4 border-2 border-dashed border-slate-800/50 rounded-lg text-slate-700 text-[10px]">
              Empty List
           </div>
        )}
      </Reorder.Group>

      {/* Input Area for this list */}
      <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800 focus-within:border-indigo-500/50 transition-colors mt-auto">
        <input
          type="text"
          placeholder="Game Name..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 w-full px-2"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        />
        <button 
          onClick={onAdd}
          className="p-1.5 bg-slate-700 rounded hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
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
  onToggleViewMode
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [inputs, setInputs] = useState({ single: '', multi: '' });

  // Filter games by category
  const singleGames = games.filter(g => g.category === 'single');
  const multiGames = games.filter(g => g.category === 'multi');

  const handleReorder = (newCategoryOrder: Game[], category: 'single' | 'multi') => {
    const otherGames = games.filter(g => g.category !== category);
    onUpdateGames([...otherGames, ...newCategoryOrder]);
  };

  const toggleSelect = (id: string) => {
    const updated = games.map(g => g.id === id ? { ...g, selected: !g.selected } : g);
    onUpdateGames(updated);
  };

  const handleGenerateSelected = () => {
    const selectedIds = games.filter(g => g.selected).map(g => g.id);
    if (selectedIds.length > 0) onGenerate(selectedIds);
  };

  const handleDeleteSelected = () => {
    const selectedIds = games.filter(g => g.selected).map(g => g.id);
    if (selectedIds.length > 0) onDelete(selectedIds);
  };

  const handleAdd = (category: 'single' | 'multi') => {
    const val = inputs[category];
    if (val.trim()) {
      onAddGame(val, category);
      setInputs(prev => ({ ...prev, [category]: '' }));
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm border border-slate-700 flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate">
          {platform}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* View Toggle */}
          <button
            onClick={onToggleViewMode}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${viewMode === 'dual' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
            title={viewMode === 'single' ? "Switch to Multiplayer View" : "Switch to Single Player View"}
          >
             {viewMode === 'single' ? (
                // Icon for Single mode (shows 1 gamepad)
                <Gamepad2 size={16} />
             ) : (
                // Icon for Dual mode (shows 2 gamepads)
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
              <ImageIcon size={14} /> Gen Art
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
          isEditMode={isEditMode}
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
            isEditMode={isEditMode}
          />
        )}
      </div>
    </div>
  );
};

export default GameList;
