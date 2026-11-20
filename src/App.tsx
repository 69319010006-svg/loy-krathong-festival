import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  getStoredKrathongs,
  addKrathongAsync,
  voteForKrathongAsync,
  hasUserVoted,
} from './services/storage';
import { subscribeToKrathongs } from './services/firebase';
import { ContestantKrathong, KrathongStyleId, WishCategory } from './types';
import { LoyKrathongCanvas } from './components/LoyKrathongCanvas';
import { Navbar } from './components/Navbar';
import { KrathongModal } from './components/KrathongModal';
import { AddKrathongModal } from './components/AddKrathongModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CameraControlsGuide } from './components/CameraControlsGuide';
import { AudioPlayer } from './components/AudioPlayer';
import { Sparkles, Trophy, Plus, HelpCircle, Eye, EyeOff, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [allKrathongs, setAllKrathongs] = useState<ContestantKrathong[]>([]);
  const [selectedKrathong, setSelectedKrathong] = useState<ContestantKrathong | null>(null);
  const [focusedKrathongId, setFocusedKrathongId] = useState<string | null>(null);
  const [soloKrathongId, setSoloKrathongId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'top' | 'mine' | 'solo'>('mine');
  const [isFirestoreSynced, setIsFirestoreSynced] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load locally cached real krathongs first
    const cached = getStoredKrathongs();
    setAllKrathongs(cached);

    // If user has created krathongs, default to showing their own krathongs (no confusion!)
    const myItems = cached.filter(k => k.isUserCreated);
    if (myItems.length > 0) {
      setCurrentFilter('mine');
    } else if (cached.length > 0) {
      setCurrentFilter('all');
    }

    // 2. Real-time subscription to Firestore
    const unsubscribe = subscribeToKrathongs((remoteKrathongs) => {
      if (remoteKrathongs) {
        setAllKrathongs(remoteKrathongs);
        setIsFirestoreSynced(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add a new krathong
  const handleAddKrathong = async (data: {
    name: string;
    wish: string;
    photoUrl: string;
    styleId: KrathongStyleId;
    category: WishCategory;
    location: string;
  }) => {
    try {
      const created = await addKrathongAsync(data);
      setIsAddModalOpen(false);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ff69b4', '#4cc9f0', '#ffaa00', '#ffffff'],
      });

      // ISOLATE & FOCUS: Set solo mode to this specific newly added krathong!
      // In the river, there will be NO other krathongs to cause confusion!
      setSoloKrathongId(created.id);
      setCurrentFilter('solo');
      setFocusedKrathongId(created.id);
      setSelectedKrathong(created);

      showToast(`กระทงของคุณ "${created.name}" ถูกปล่อยสู่แม่น้ำเรียบร้อยแล้ว (ซ่อนกระทงอื่นเพื่อไม่ให้สับสน) 🪷`);
    } catch (err) {
      console.error('Error adding krathong:', err);
      showToast('เกิดข้อผิดพลาดในการปล่อยกระทง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleVote = async (id: string) => {
    try {
      const res = await voteForKrathongAsync(id);
      if (selectedKrathong && selectedKrathong.id === id) {
        setSelectedKrathong({ ...selectedKrathong, votes: res.newVotes });
      }
      showToast(`โหวตสำเร็จ! ข้อมูลคะแนนซิงก์สู่ Firestore เรียบร้อย ⭐`);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  // Calculate displayed krathongs in the 3D river
  let displayedKrathongs: ContestantKrathong[] = [];

  if (currentFilter === 'solo' && soloKrathongId) {
    // Solo Focus Mode: Show ONLY the user's newly created krathong in the river!
    displayedKrathongs = allKrathongs.filter(k => k.id === soloKrathongId);
  } else if (currentFilter === 'mine') {
    // Show ONLY user-created krathongs in the river!
    displayedKrathongs = allKrathongs.filter(k => k.isUserCreated);
  } else if (currentFilter === 'top') {
    displayedKrathongs = [...allKrathongs].sort((a, b) => b.votes - a.votes).slice(0, 10);
  } else {
    // 'all'
    displayedKrathongs = allKrathongs;
  }

  const myKrathongs = allKrathongs.filter(k => k.isUserCreated);
  const totalVotes = allKrathongs.reduce((acc, k) => acc + (k.votes || 0), 0);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07111e] select-none">
      {/* 3D WebGL Canvas Layer (Renders ONLY displayedKrathongs so no confusion!) */}
      <LoyKrathongCanvas
        krathongs={displayedKrathongs}
        onSelectKrathong={(k) => setSelectedKrathong(k)}
        focusedKrathongId={focusedKrathongId}
        onClearFocus={() => setFocusedKrathongId(null)}
      />

      {/* Top Royal Header Navigation */}
      <Navbar
        totalKrathongs={allKrathongs.length}
        totalVotes={totalVotes}
        currentFilter={currentFilter}
        onChangeFilter={(f) => {
          setSoloKrathongId(null);
          setCurrentFilter(f);
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        myKrathongsCount={myKrathongs.length}
      />

      {/* Solo / My Krathong Active Notification Banner */}
      {(currentFilter === 'solo' || currentFilter === 'mine') && displayedKrathongs.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex items-center space-x-2.5 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-amber-400 shadow-[0_4px_25px_rgba(255,193,7,0.3)] text-xs sm:text-sm text-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold">
              {currentFilter === 'solo'
                ? '🌟 โหมดเดี่ยว: กำลังแสดงเฉพาะกระทงที่คุณเพิ่งปล่อยในแม่น้ำ (ไม่มีกระทงอื่นให้สับสน)'
                : '🪷 กำลังแสดงเฉพาะกระทงของคุณในแม่น้ำ (ไม่มีกระทงอื่นมาปะปน)'}
            </span>
            <button
              onClick={() => {
                setSoloKrathongId(null);
                setCurrentFilter('all');
              }}
              className="ml-2 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              แสดงกระทงทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Empty State Banner if no krathongs in current filter */}
      {displayedKrathongs.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto text-center p-6 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-amber-400/40 shadow-2xl max-w-sm">
          <div className="text-4xl mb-3">🪷</div>
          <h3 className="text-lg font-bold text-amber-300 mb-1">
            {currentFilter === 'mine' ? 'คุณยังไม่ได้ปล่อยกระทง' : 'ยังไม่มีกระทงในสายน้ำ'}
          </h3>
          <p className="text-xs text-slate-300 mb-4 font-sarabun">
            กดปุ่มด้านล่างเพื่อถ่ายรูปและปล่อยกระทงของคุณลงสู่แม่น้ำ 3D ได้ทันที
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg glow-gold"
          >
            ลอยกระทง & ส่งประกวด
          </button>
        </div>
      )}

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <AudioPlayer />
          
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-emerald-500/30 text-[11px] text-emerald-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore Real-time Active</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center space-x-2 sm:hidden">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/30 text-xs glow-gold"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ลอยกระทง</span>
          </button>
        </div>
      </div>

      {/* Floating Instructions Pill */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:block">
        <div className="px-5 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-amber-400/40 text-xs text-amber-200 shadow-xl font-medium flex items-center space-x-2">
          <span>💡</span>
          <span>หมุนฉาก 360°: ลากเมาส์ / 1 นิ้วบนจอ | ซูม: เลื่อนลูกกลิ้ง / จีบนิ้ว | แตะที่กระทงในน้ำเพื่อดูข้อมูลและโหวต</span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900/95 border-2 border-amber-400 rounded-2xl text-amber-200 text-sm font-bold shadow-2xl backdrop-blur-md animate-toast flex items-center space-x-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: View Krathong Details & Vote */}
      <KrathongModal
        krathong={selectedKrathong}
        allKrathongs={allKrathongs}
        onClose={() => setSelectedKrathong(null)}
        onVote={handleVote}
        hasVoted={selectedKrathong ? hasUserVoted(selectedKrathong.id) : false}
      />

      {/* Modal: Add Krathong & Take Photo */}
      <AddKrathongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddKrathong}
      />

      {/* Modal: Leaderboard Top Votes */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        krathongs={allKrathongs}
        onSelectKrathong={(k) => {
          setSelectedKrathong(k);
          setFocusedKrathongId(k.id);
        }}
      />

      {/* Modal: Camera & Controls Help Guide */}
      <CameraControlsGuide
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
