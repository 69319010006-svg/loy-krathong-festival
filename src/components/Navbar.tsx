import React from 'react';
import { Trophy, Plus, HelpCircle, Sparkles, Flame, Eye, User, Layers } from 'lucide-react';

interface NavbarProps {
  totalKrathongs: number;
  totalVotes: number;
  currentFilter: 'all' | 'top' | 'mine' | 'solo';
  onChangeFilter: (f: 'all' | 'top' | 'mine') => void;
  onOpenAddModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
  myKrathongsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalKrathongs,
  totalVotes,
  currentFilter,
  onChangeFilter,
  onOpenAddModal,
  onOpenLeaderboard,
  onOpenHelp,
  myKrathongsCount,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none">
      {/* Brand & Festival Info */}
      <div className="pointer-events-auto flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-amber-400/50 shadow-[0_4px_25px_rgba(255,193,7,0.2)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 flex items-center justify-center text-2xl shadow-lg ring-2 ring-yellow-300/40 shrink-0">
          🪷
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              ลอยกระทงออนไลน์ 3D
            </h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm">
              Live
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-medium">
            <span>ในระบบ <strong className="text-amber-300 font-bold">{totalKrathongs}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <strong className="text-yellow-300 font-bold">{totalVotes.toLocaleString()}</strong> โหวต
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Easy Exploration */}
      <div className="pointer-events-auto flex items-center space-x-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700/70 shadow-md">
        <button
          onClick={() => onChangeFilter('mine')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            currentFilter === 'mine' || currentFilter === 'solo'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="แสดงเฉพาะกระทงของคุณในแม่น้ำเพื่อไม่ให้สับสน"
        >
          <User className="w-3.5 h-3.5" />
          <span>กระทงของฉัน ({myKrathongsCount})</span>
        </button>

        <button
          onClick={() => onChangeFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            currentFilter === 'all'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>แสดงทั้งหมด</span>
        </button>

        <button
          onClick={() => onChangeFilter('top')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            currentFilter === 'top'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          ⭐ ยอดนิยม
        </button>
      </div>

      {/* Action Buttons */}
      <div className="pointer-events-auto flex items-center space-x-2">
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900/90 hover:bg-slate-800 text-yellow-300 rounded-xl border border-yellow-400/50 backdrop-blur-md transition-all shadow-md active:scale-95 text-xs sm:text-sm font-bold"
          title="อันดับคะแนนโหวต"
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="hidden sm:inline">อันดับโหวต</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 sm:px-3 sm:py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 backdrop-blur-md transition-all shadow-md active:scale-95 text-xs sm:text-sm"
          title="วิธีใช้งานมุมกล้อง"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-xl shadow-[0_4px_20px_rgba(255,193,7,0.35)] transition-all active:scale-95 text-xs sm:text-sm glow-gold"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ลอยกระทง & ส่งประกวด</span>
        </button>
      </div>
    </header>
  );
};
