import React from 'react';
import { X, Trophy, Heart, ArrowRight, MapPin, Tag } from 'lucide-react';
import { ContestantKrathong } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  krathongs: ContestantKrathong[];
  onSelectKrathong: (k: ContestantKrathong) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  krathongs,
  onSelectKrathong,
}) => {
  if (!isOpen) return null;

  const sorted = [...krathongs].sort((a, b) => b.votes - a.votes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#131d36] via-[#0d1627] to-[#070b15] border-2 border-yellow-400/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(255,215,0,0.25)] text-white max-h-[88vh] flex flex-col animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg font-bold">
            <Trophy className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              ตารางคะแนนโหวตยอดนิยม
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sarabun">
              กระทงวิจิตรที่ได้รับคะแนนโหวตสูงสุดในคืนวันเพ็ญ
            </p>
          </div>
        </div>

        {/* Podium Top 3 Highlights */}
        {sorted.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Rank 2 */}
            <div
              onClick={() => {
                onSelectKrathong(sorted[1]);
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-slate-800/70 border border-slate-600 flex flex-col items-center text-center cursor-pointer hover:bg-slate-800 transition"
            >
              <span className="text-2xl">🥈</span>
              <img
                src={sorted[1].photoUrl}
                alt={sorted[1].name}
                className="w-11 h-11 rounded-xl object-cover my-1 border-2 border-slate-400"
              />
              <span className="text-xs font-bold truncate w-full">{sorted[1].name.split(' (')[0]}</span>
              <span className="text-[11px] text-slate-300 font-semibold">{sorted[1].votes.toLocaleString()} โหวต</span>
            </div>

            {/* Rank 1 */}
            <div
              onClick={() => {
                onSelectKrathong(sorted[0]);
                onClose();
              }}
              className="p-3 rounded-2xl bg-gradient-to-b from-amber-500/30 to-yellow-500/10 border-2 border-yellow-400 flex flex-col items-center text-center cursor-pointer hover:bg-amber-500/40 transition shadow-lg relative -top-1"
            >
              <span className="text-3xl">🥇</span>
              <img
                src={sorted[0].photoUrl}
                alt={sorted[0].name}
                className="w-12 h-12 rounded-xl object-cover my-1 border-2 border-yellow-400 shadow-md"
              />
              <span className="text-xs font-black text-yellow-200 truncate w-full">{sorted[0].name.split(' (')[0]}</span>
              <span className="text-xs text-yellow-300 font-bold">{sorted[0].votes.toLocaleString()} โหวต</span>
            </div>

            {/* Rank 3 */}
            <div
              onClick={() => {
                onSelectKrathong(sorted[2]);
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-slate-800/70 border border-amber-700/60 flex flex-col items-center text-center cursor-pointer hover:bg-slate-800 transition"
            >
              <span className="text-2xl">🥉</span>
              <img
                src={sorted[2].photoUrl}
                alt={sorted[2].name}
                className="w-11 h-11 rounded-xl object-cover my-1 border-2 border-amber-600"
              />
              <span className="text-xs font-bold truncate w-full">{sorted[2].name.split(' (')[0]}</span>
              <span className="text-[11px] text-amber-200 font-semibold">{sorted[2].votes.toLocaleString()} โหวต</span>
            </div>
          </div>
        )}

        {/* Full Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sorted.map((item, index) => {
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectKrathong(item);
                  onClose();
                }}
                className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer group active:scale-98"
              >
                <div className="w-7 text-center shrink-0 font-bold text-sm text-amber-300">
                  #{index + 1}
                </div>

                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition">
                      {item.name}
                    </h4>
                    {item.isUserCreated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        กระทงของคุณ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-rose-400" />{item.location}</span>
                    <span>•</span>
                    <span className="text-blue-300">{item.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-2">
                  <div className="text-right">
                    <span className="text-sm font-bold text-yellow-300 block">
                      {item.votes.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">โหวต</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
