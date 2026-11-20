export type KrathongStyleId = 'banana-classic' | 'lotus-pink' | 'royal-gold' | 'orchid-purple' | 'nature-flower';

export type WishCategory = 'ขมาพระแม่คงคา' | 'ขอพรความรัก' | 'ขอพรการงานและการเงิน' | 'ขอพรสุขภาพและครอบครัว' | 'ขอพรการศึกษา';

export interface KrathongStyle {
  id: KrathongStyleId;
  name: string;
  thaiName: string;
  description: string;
  symbolism: string;
  baseColor: string;
  petalColor: string;
  accentColor: string;
  flowerColor: string;
}

export interface ContestantKrathong {
  id: string;
  name: string;
  wish: string;
  photoUrl: string;
  styleId: KrathongStyleId;
  category: WishCategory;
  location: string;
  votes: number;
  createdAt: number;
  // 3D coordinates & drift parameters
  posX: number;
  posZ: number;
  baseY: number;
  speed: number;
  amplitude: number;
  phase: number;
  rotationSpeed: number;
  isUserCreated?: boolean;
}

export interface AtmospherePerson {
  id: number;
  posX: number;
  posZ: number;
  posY: number;
  rotationY: number;
  bodyColor: string;
  attireColor: string;
  sashColor: string;
  isWalking: boolean;
  walkSpeed: number;
  targetZ: number;
  minZ: number;
  maxZ: number;
  hasLantern?: boolean;
  hasKrathong?: boolean;
  hairStyle: 'chignon' | 'short' | 'ornament';
}
