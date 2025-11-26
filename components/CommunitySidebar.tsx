
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Gamepad2, Trophy, Flame } from 'lucide-react';
import { authService, CommunityGameStat } from '../services/authService';

interface CommunitySidebarProps {
  currentUser: string | null;
  refreshTrigger: number; // Prop to force refresh when local data changes
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ currentUser, refreshTrigger }) => {
  const [stats, setStats] = useState<CommunityGameStat[]>([]);

  useEffect(() => {
    const data = authService.getCommunityStats();
    setStats(data);
  }, [currentUser, refreshTrigger]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col h-full max-h-[calc(100vh-120px)] sticky top-24">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 bg-slate-900/80">
        <Sparkles className="text-pink-400" size={18} />
        <h3 className="font-bold text-slate-200 text-sm">其他人在玩 (Community)</h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
        {stats.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-xs">
            <p>暂无社区数据</p>
            <p className="mt-2">注册并保存你的游戏列表，即可在此显示！</p>
          </div>
        ) : (
          stats.map((game, index) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={game.name}
              className="group relative bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-200 text-sm line-clamp-2 group-hover:text-pink-300 transition-colors">
                  {game.name}
                </span>
                {index < 3 && (
                   <Flame size={14} className={`${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'}`} fill="currentColor" />
                )}
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                <div className="flex gap-1 flex-wrap max-w-[70%]">
                  {game.platforms.slice(0, 3).map(p => (
                    <span key={p} className="bg-slate-700/50 px-1 rounded border border-slate-700">{p}</span>
                  ))}
                  {game.platforms.length > 3 && <span>+</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Users size={10} />
                  <span>{game.count}</span>
                </div>
              </div>
              
              {/* Tooltip-ish info for latest player */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-700/30 text-[10px] text-slate-600 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                 最近游玩: {game.latestPlayer === currentUser ? '你 (You)' : game.latestPlayer}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-[10px] text-slate-500 text-center">
        实时汇聚 {stats.length} 款游戏数据
      </div>
    </div>
  );
};

export default CommunitySidebar;
