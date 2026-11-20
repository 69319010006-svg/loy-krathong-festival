import { ContestantKrathong, KrathongStyle, WishCategory } from '../types';
import { db, KRATHONGS_COLLECTION, saveKrathongToFirestore, voteKrathongInFirestore } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

export const KRATHONG_STYLES: KrathongStyle[] = [
  {
    id: 'banana-classic',
    name: 'กระทงใบตองวิจิตร (Classic Banana Leaf & Marigold)',
    thaiName: 'กระทงใบตองกาบกล้วยวิจิตร',
    description: 'ประดิษฐ์จากหยวกกล้วยและใบตองสดพับกลีบผกา 3 ชั้นซ้อน ประดับด้วยดอกดาวเรืองมงคลและดอกกล้วยไม้สีเหลืองทองอร่าม',
    symbolism: 'ความเจริญงอกงาม ความเคารพต่อธรรมชาติ และความเรียบง่ายตามวิถีไทยโบราณ',
    baseColor: '#2d6a4f',
    petalColor: '#40916c',
    accentColor: '#ffd166',
    flowerColor: '#ffaa00',
  },
  {
    id: 'lotus-pink',
    name: 'กระทงบัวชมพูทิพย์ (Sacred Pink Lotus Blossom)',
    thaiName: 'กระทงบัวหลวงชมพูทิพย์สิริ',
    description: 'ประดับด้วยกลีบบัวหลวงสีชมพูระเรื่อพับกลีบผีเสื้อซ้อน 4 ชั้น ล้อมรอบด้วยพวงมาลัยดอกมะลิหอมกรุ่นและดอกรักแท้',
    symbolism: 'ความบริสุทธิ์ผุดผ่อง จิตใจสงบ และความรักที่มั่นคงดั่งดอกบัวเหนือน้ำ',
    baseColor: '#1b4332',
    petalColor: '#ff758f',
    accentColor: '#ffb3c1',
    flowerColor: '#ffffff',
  },
  {
    id: 'royal-gold',
    name: 'กระทงสุวรรณมาศ (Royal Gilded Elegance)',
    thaiName: 'กระทงสุวรรณมาศราชนารี',
    description: 'กลีบกระทงลงรักปิดทองคำเปลวเปล่งประกาย ประดับดอกบานไม่รู้โรยสีทองและเทียนหอมขี้ผึ้งแท้กลิ่นกำยานชาววัง',
    symbolism: 'ความมั่งคั่ง เกียรติยศชื่อเสียง และสิริมงคลสูงสุดในชีวิต',
    baseColor: '#b8860b',
    petalColor: '#ffd700',
    accentColor: '#fff3b0',
    flowerColor: '#ffe066',
  },
  {
    id: 'orchid-purple',
    name: 'กระทงกล้วยไม้มงคล (Imperial Orchid & Jasmine Garland)',
    thaiName: 'กระทงพุทธรักษาและกล้วยไม้ม่วง',
    description: 'ร้อยเรียงด้วยช่อกล้วยไม้หวายสีม่วงอมชมพู สลับกลีบผกาสีเขียวตองอ่อน พร้อมมาลัยดอกรักและดอกพุดตูม',
    symbolism: 'ความสง่างาม ความสำเร็จในการงาน และมิตรภาพที่ยั่งยืน',
    baseColor: '#1e3a1e',
    petalColor: '#9d4edd',
    accentColor: '#e0aaff',
    flowerColor: '#f72585',
  },
  {
    id: 'nature-flower',
    name: 'กระทงบุปผาหลากสี (Seven Rainbow Blossoms)',
    thaiName: 'กระทงเบญจมาศสายรุ้งธรรมชาติ',
    description: 'กระทงรักษ์โลกที่ประดับด้วยดอกเบญจมาศหลากสี ดาวเรือง มะลิ ดอกเข็ม และดอกบานไม่รู้โรย ย่อยสลายได้ 100%',
    symbolism: 'ความสดใสมีชีวิตชีวา ความหลากหลาย และความหวังใหม่ในปีหน้า',
    baseColor: '#2b9348',
    petalColor: '#f72585',
    accentColor: '#4cc9f0',
    flowerColor: '#fee440',
  },
];

const STORAGE_KEY = 'loy_krathong_contestants_real_v1';
const VOTED_KEY = 'loy_krathong_user_voted_list_v4';

/**
 * Get stored krathongs. Only returns real entries (no fake/dummy krathongs).
 */
export function getStoredKrathongs(): ContestantKrathong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading from localStorage', e);
  }
  return [];
}

export function saveStoredKrathongs(list: ContestantKrathong[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

/**
 * Add a new real krathong to Firestore and LocalStorage
 */
export async function addKrathongAsync(newKrathong: Omit<ContestantKrathong, 'id' | 'votes' | 'createdAt' | 'posX' | 'posZ' | 'baseY' | 'speed' | 'amplitude' | 'phase' | 'rotationSpeed'>): Promise<ContestantKrathong> {
  const id = 'user_' + Date.now();
  
  // Placed center-stage in front of the spectator pier
  const item: ContestantKrathong = {
    ...newKrathong,
    id,
    votes: 1,
    createdAt: Date.now(),
    posX: (Math.random() - 0.5) * 6,
    posZ: 16 + (Math.random() - 0.5) * 4,
    baseY: 0.16,
    speed: 0.38,
    amplitude: 0.09,
    phase: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.012,
    isUserCreated: true,
  };

  // 1. Save to Cloud Firestore
  try {
    await saveKrathongToFirestore(item);
  } catch (err) {
    console.warn('Could not save to Firestore, saving locally:', err);
  }

  // 2. Save to local storage
  const current = getStoredKrathongs();
  const updated = [item, ...current.filter(k => k.id !== item.id)];
  saveStoredKrathongs(updated);

  return item;
}

/**
 * Vote for krathong in Firestore
 */
export async function voteForKrathongAsync(id: string): Promise<{ success: boolean; newVotes: number }> {
  try {
    await voteKrathongInFirestore(id);
  } catch (err) {
    console.warn('Firestore vote update error:', err);
  }

  const list = getStoredKrathongs();
  const target = list.find(k => k.id === id);
  if (!target) return { success: true, newVotes: 1 };

  target.votes += 1;
  saveStoredKrathongs(list);

  try {
    const rawVoted = localStorage.getItem(VOTED_KEY);
    const votedList: string[] = rawVoted ? JSON.parse(rawVoted) : [];
    if (!votedList.includes(id)) {
      votedList.push(id);
      localStorage.setItem(VOTED_KEY, JSON.stringify(votedList));
    }
  } catch (e) {
    console.error(e);
  }

  return { success: true, newVotes: target.votes };
}

export function hasUserVoted(id: string): boolean {
  try {
    const rawVoted = localStorage.getItem(VOTED_KEY);
    const votedList: string[] = rawVoted ? JSON.parse(rawVoted) : [];
    return votedList.includes(id);
  } catch (e) {
    return false;
  }
}
