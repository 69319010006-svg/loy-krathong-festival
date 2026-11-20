import React, { useState, useRef } from 'react';
import { X, Camera, RefreshCw, Send, Sparkles, CheckCircle2, MapPin, Tag, Image as ImageIcon, Check } from 'lucide-react';
import { KRATHONG_STYLES } from '../services/storage';
import { KrathongStyleId, WishCategory } from '../types';
import { resizeImageToMax500 } from '../utils/imageCompressor';

interface AddKrathongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    wish: string;
    photoUrl: string;
    styleId: KrathongStyleId;
    category: WishCategory;
    location: string;
  }) => void;
}

const WISH_CATEGORIES: WishCategory[] = [
  'ขมาพระแม่คงคา',
  'ขอพรความรัก',
  'ขอพรการงานและการเงิน',
  'ขอพรสุขภาพและครอบครัว',
  'ขอพรการศึกษา',
];

const PROVINCES = [
  'กรุงเทพมหานคร', 'เชียงใหม่', 'สุโขทัย', 'พระนครศรีอยุธยา', 'ภูเก็ต',
  'ขอนแก่น', 'ชลบุรี', 'นครราชสีมา', 'สงขลา', 'นนทบุรี', 'สุพรรณบุรี'
];

export const AddKrathongModal: React.FC<AddKrathongModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [category, setCategory] = useState<WishCategory>('ขมาพระแม่คงคา');
  const [location, setLocation] = useState('กรุงเทพมหานคร');
  const [selectedStyle, setSelectedStyle] = useState<KrathongStyleId>('lotus-pink');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Cannot open camera directly, fallback to file upload', err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture photo from webcam & compress to max 500px
  const capturePhoto = async () => {
    if (videoRef.current) {
      setIsCompressing(true);
      try {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        const minDim = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = minDim;
        canvas.height = minDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (video.videoWidth - minDim) / 2;
          const sy = (video.videoHeight - minDim) / 2;
          ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, minDim, minDim);
          const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          // Apply max 500px dimension resize for Firestore storage!
          const resizedDataUrl = await resizeImageToMax500(rawDataUrl, 500, 0.85);
          setPhotoUrl(resizedDataUrl);
          stopCamera();
        }
      } catch (err) {
        console.error('Error compressing camera photo:', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Handle uploaded file & compress to max 500px
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        // Automatically resize image to not exceed 500px!
        const resizedDataUrl = await resizeImageToMax500(file, 500, 0.85);
        setPhotoUrl(resizedDataUrl);
      } catch (err) {
        console.error('Error compressing uploaded file:', err);
        setErrorMsg('ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาป้อนชื่อของคุณเพื่อร่วมส่งกระทง');
      return;
    }
    if (!wish.trim()) {
      setErrorMsg('กรุณาป้อนคำอธิษฐานวันลอยกระทง');
      return;
    }

    let finalPhoto = photoUrl;
    if (!finalPhoto) {
      // Default fallback avatar
      finalPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
    } else if (finalPhoto.startsWith('data:image')) {
      // Double guarantee that image is resized <= 500px
      finalPhoto = await resizeImageToMax500(finalPhoto, 500, 0.85);
    }

    stopCamera();
    onSubmit({
      name: name.trim(),
      wish: wish.trim(),
      photoUrl: finalPhoto,
      styleId: selectedStyle,
      category,
      location,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#131d36] via-[#0e1628] to-[#070b15] border-2 border-amber-400/50 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(255,193,7,0.25)] text-white my-auto max-h-[92vh] overflow-y-auto animate-modal-spring"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 mb-2 shadow-lg">
            🪷
          </div>
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            สร้างกระทง & ส่งภาพเข้าประกวด
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sarabun">
            บันทึกข้อมูลและรูปภาพลงระบบคลาวด์ Firestore แบบเรียลไทม์
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase text-amber-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" />
                1. ถ่ายรูปหรือแนบรูปตัวเองเข้าประกวด
              </label>
              <span className="text-[10px] text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                ย่อรูปไม่เกิน 500px อัตโนมัติ (Firestore)
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 border border-slate-700/70">
              {isCompressing ? (
                <div className="py-8 text-center text-xs text-amber-300 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังปรับย่อขนาดรูปภาพไม่เกิน 500px...</span>
                </div>
              ) : cameraActive ? (
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-full shadow-lg"
                  >
                    ถ่ายภาพ (ย่อขนาดอัตโนมัติ)
                  </button>
                </div>
              ) : photoUrl ? (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md group">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="text-xs text-white bg-rose-600 px-2 py-1 rounded-md"
                    >
                      เปลี่ยนรูป
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-slate-700/60 flex items-center justify-center text-slate-300">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 mb-2.5">
                    สามารถถ่ายเซลฟี่สด หรือเลือกรูปจากอัลบั้ม (ระบบจะย่อรูปให้มีขนาดไม่เกิน 500px ทันที)
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      เปิดกล้องเซลฟี่
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      เลือกจากอัลบั้ม
                    </button>
                  </div>
                </div>
              )}

              {photoUrl && !isCompressing && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      startCamera();
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    ถ่ายใหม่
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name & Province */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5">
                2. ชื่อผู้ส่งเข้าประกวด
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น นภาพร ชัยชนะ (น้องฟ้า)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition"
                maxLength={40}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                จังหวัด
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition"
              >
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Wish Category */}
          <div>
            <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              3. หมวดหมู่คำอธิษฐาน
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WISH_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    category === cat
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Wish Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase text-amber-300 mb-1.5">
              4. ป้อนคำอธิษฐานจิตวันลอยกระทง
            </label>
            <textarea
              required
              rows={3}
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="ขอขมาต่อพระแม่คงคา ขอให้ครอบครัวและคนที่รักมีความสุข ปราศจากโรคภัย..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition resize-none font-sarabun"
              maxLength={220}
            />
          </div>

          {/* Krathong Style Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-amber-300 mb-2">
              5. เลือกรูปแบบกระทง 3D วิจิตร
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KRATHONG_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: style.petalColor }}
                      />
                      <span className="text-xs font-bold truncate text-slate-100">
                        {style.thaiName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-sarabun">
                      {style.symbolism}
                    </p>
                    {isSelected && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Release Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCompressing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-base flex items-center justify-center space-x-2 shadow-2xl shadow-amber-500/30 transition active:scale-98 glow-gold disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
              <span>ลอยกระทงวิจิตรสู่สายน้ำ & บันทึกลง Firestore</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
