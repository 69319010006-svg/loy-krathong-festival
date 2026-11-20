import React from 'react';
import { X, RotateCw, ZoomIn, Hand, MousePointerClick } from 'lucide-react';

interface CameraControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraControlsGuide: React.FC<CameraControlsGuideProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-[#0e1628] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-amber-300 mb-1 flex items-center gap-2">
          <span>🎮</span> วิธีการควบคุมและชมงาน 3D
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          รองรับการใช้งานสมบูรณ์แบบทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟน
        </p>

        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <RotateCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">หมุนฉาก 360 องศา (Rotate)</strong>
              <span className="text-xs text-slate-400">
                • <strong>มือถือ/แท็บเล็ต:</strong> ลาก 1 นิ้วไปรอบๆ หน้าจอ<br />
                • <strong>คอมพิวเตอร์:</strong> คลิกเมาส์ซ้ายค้างไว้แล้วลาก
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <ZoomIn className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">ซูมเข้า - ออก (Zoom In/Out)</strong>
              <span className="text-xs text-slate-400">
                • <strong>มือถือ/แท็บเล็ต:</strong> ใช้นิ้ว 2 นิ้วบีบหรือถ่างเพื่อซูม (Pinch to zoom)<br />
                • <strong>คอมพิวเตอร์:</strong> เลื่อนลูกกลิ้งเมาส์ (Scroll Wheel)
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <MousePointerClick className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block text-xs">ดูข้อมูลและโหวตกระทง (Inspect & Vote)</strong>
              <span className="text-xs text-slate-400">
                • <strong>แตะหรือคลิก</strong> ที่กระทงที่ลอยอยู่ในแม่น้ำเพื่อเปิดหน้าต่างดูรูปถ่าย คำอธิษฐาน และกดปุ่มโหวตคะแนน
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
        >
          เข้าใจแล้ว เข้าสู่บรรยากาศงาน
        </button>
      </div>
    </div>
  );
};
