import React from 'react';
import { motion } from 'framer-motion';
import { X, Globe, Trophy, Users } from 'lucide-react';
import { GLOBAL_TOP_GAMES } from '../data/mockData';

interface GlobalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalStatsModal: React.FC<GlobalStatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Globe className="text-pink-400" size={24} />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-white">Everyone's Favorites</h2>
                  <p className="text-xs text-slate-400">Top 10 games played by the community this year</p>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
           <div className="flex flex-col gap-3">
              {GLOBAL_TOP_GAMES.map((game, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={index} 
                    className="flex items-center gap-4 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-pink-500/30 transition-all group"
                  >
                     {/* Rank Badge */}
                     <div className={`
                        w-10 h-10 flex items-center justify-center rounded-lg font-black text-lg shadow-inner
                        ${index === 0 ? 'bg-yellow-500 text-yellow-950' : ''}
                        ${index === 1 ? 'bg-slate-300 text-slate-800' : ''}
                        ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                        ${index > 2 ? 'bg-slate-800 text-slate-500' : ''}
                     `}>
                        {index + 1}
                     </div>

                     {/* Info */}
                     <div className="flex-1">
                        <h3 className={`font-bold text-sm md:text-base ${index < 3 ? 'text-white' : 'text-slate-300'} group-hover:text-pink-300 transition-colors`}>{game.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(game.count / GLOBAL_TOP_GAMES[0].count) * 100}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full rounded-full ${index < 3 ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-slate-600'}`}
                                />
                            </div>
                        </div>
                     </div>

                     {/* Stats */}
                     <div className="text-right min-w-[80px]">
                        <div className="flex items-center justify-end gap-1 text-slate-300 font-mono text-sm">
                            <Users size={12} />
                            {game.count.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">Players</div>
                     </div>
                  </motion.div>
              ))}
           </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/30 text-center text-xs text-slate-500">
            Stats updated daily based on global user submissions.
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalStatsModal;
