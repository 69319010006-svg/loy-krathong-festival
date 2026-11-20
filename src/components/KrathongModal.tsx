import React, { useState } from 'react';
import { X, Heart, Sparkles, Share2, Calendar, MapPin, Tag, Award, Info, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ContestantKrathong } from '../types';
import { KRATHONG_STYLES } from '../services/storage';

interface KrathongModalProps {
  krathong: ContestantKrathong | null;
  allKrathongs: ContestantKrathong[];
  onClose: () => void;
  onVote: (id: string) => void;
  hasVoted: boolean;
}

export const KrathongModal: React.FC<KrathongModalProps> = ({
  krathong,
  allKrathongs,
  onClose,
  onVote,
  hasVoted,
}) => {
  const [isVoting, setIsVoting] = useState(false);

  if (!krathong) return null;

  const styleInfo = KRATHONG_STYLES.find((s) => s.id === krathong.styleId) || KRATHONG_STYLES[0];

  // Calculate rank
  const sorted = [...allKrathongs].sort((a, b) => b.votes - a.votes);
  const currentRank = sorted.findIndex((k) => k.id === krathong.id) + 1;

  const handleVoteClick = () => {
    setIsVoting(true);
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#ffd700', '#ff69b4', '#4cc9f0', '#ffaa00', '#ffffff'],
    });

    onVote(krathong.id);
    setTimeout(() => setIsVoting(false), 600);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `ร่วมโหวตกระทงของ ${krathong.name}`,
        text: `มาร่วมโหวตกระทงของ ${krathong.name} (${krathong.location}) ในงานลอยกระทงออนไลน์ 3D! "${krathong.wish}"`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('คัดลอกลิงก์เรียบร้อยแล้ว ชวนเพื่อนมาร่วมโหวตได้เลย!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#131d36] via-[#0d1527] to-[#070b15] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(255,193,7,0.25)] text-white overflow-hidden my-auto max-h-[92vh] overflow-y-auto animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ornate Gold Background Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition border border-slate-700/60 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Badges & Rank */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-yellow-300 border border-yellow-400/40 flex items-center gap-1.5 shadow-sm">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            อันดับที่ {currentRank} ในการประกวด
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/70 text-slate-300 border border-slate-700 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            {krathong.location}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-400" />
            {krathong.category}
          </span>
        </div>

        {/* Contestant Hero Section (Large clear photo & profile) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-amber-500/30 shadow-inner mb-5">
          <div className="relative shrink-0">
            <img
              src={krathong.photoUrl}
              alt={krathong.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-yellow-400 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
              }}
            />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-yellow-400 text-slate-950 font-black text-[11px] shadow">
              #{currentRank}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              {krathong.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-amber-300/90 mt-0.5">
              {styleInfo.thaiName}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 text-xs sm:text-sm font-bold border border-amber-400/40 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                {krathong.votes.toLocaleString()} คะแนนโหวต
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(krathong.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Wish / Sacred Prayer (คำอธิษฐานจิต) */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/40 border-l-4 border-amber-400 border border-slate-700/50 shadow-md">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>คำอธิษฐานวันลอยกระทง</span>
          </div>
          <p className="text-sm sm:text-base text-amber-50 font-sarabun italic leading-relaxed">
            "{krathong.wish}"
          </p>
        </div>

        {/* Krathong Artistry & Symbolism (รายละเอียดเชิงลึกของกระทง) */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>เอกลักษณ์และการประดิษฐ์กระทง</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sarabun">
            {styleInfo.description}
          </p>
          <div className="pt-1 text-[11px] text-amber-200/80 flex items-center gap-1">
            <strong className="text-amber-400 font-semibold">ความหมายมงคล:</strong>
            <span>{styleInfo.symbolism}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-1">
          <button
            onClick={handleShare}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 rounded-2xl border border-slate-600/70 text-slate-200 transition active:scale-95 shadow-md"
            title="แชร์กระทงนี้"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleVoteClick}
            disabled={isVoting}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold flex items-center justify-center space-x-2.5 shadow-xl transition-all active:scale-98 text-sm sm:text-base ${
              hasVoted
                ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 hover:from-pink-700 hover:to-rose-600 text-white shadow-pink-600/30'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-amber-500/30 glow-gold'
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                hasVoted ? 'fill-current' : 'fill-slate-950 stroke-none'
              } ${isVoting ? 'scale-125 transition-transform' : ''}`}
            />
            <span className="font-extrabold tracking-wide">
              {isVoting ? 'กำลังบันทึกคะแนน...' : hasVoted ? 'โหวตเพิ่มกำลังใจให้กระทงนี้ (+1)' : 'โหวตให้กระทงนี้ (+1)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
