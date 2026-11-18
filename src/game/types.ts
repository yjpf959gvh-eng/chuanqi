export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'lord';

export type EquipSlot = 'weapon' | 'armor' | 'necklace' | 'ring';

export interface EquipmentItem {
  uid: string;
  templateId: string;
  name: string;
  slot: EquipSlot;
  tier: number; // 1..6
  rarity: Rarity;
  atk: number;
  def: number;
  hp: number;
  armor: number;
  critRate: number;
  enhanceLevel: number; // 0..15
  locked?: boolean;
  visualStyle: string;
  description: string;
}

export interface MapObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'pillar' | 'wall' | 'brazier';
}

export interface MapRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapConfig {
  id: string;
  name: string;
  subtitle: string;
  recommendedPower: number;
  unlockLevel: number;
  arenaImage: string;
  themeColor: string;
  bossId: string;
  bossName: string;
  bossTitle: string;
  bossLevel: number;
  bossMaxHp: number;
  bossMaxArmor: number;
  bossDef: number;
  bossAtk: number;
  mobName: string;
  mobHp: number;
  mobAtk: number;
  mobExp: number;
  eliteName: string;
  eliteHp: number;
  eliteAtk: number;
  eliteExp: number;
  respawnSeconds: number;
  expReward: number;
  goldReward: number;
  stoneReward: number;
  dropTiers: number[];
  tokenDropChance: number;
}

export interface BossRuntimeState {
  mapId: string;
  isAlive: boolean;
  respawnRemaining: number;
  reminderEnabled: boolean;
  kills: number;
}

export interface SkillDef {
  id: 'fire_slash' | 'thunder' | 'sun_beam' | 'meteor_dash';
  name: string;
  shortName: string;
  unlockLevel: number;
  cooldown: number;
  dmgMultiplier: number;
  armorShredMultiplier: number;
  mpCost: number;
  color: string;
  description: string;
  keyHint: string;
}

export interface SabakState {
  isLord: boolean;
  lordName: string;
  siegeActive: boolean;
  siegeTimeRemaining: number;
  lastTaxCollectAt: number;
  doubleDropUntil: number;
  sabakTokens: number;
  siegeWins: number;
}

export interface StatAllocations {
  str: number; // 力量: +ATK, +Armor Shred
  vit: number; // 体魄: +HP, +Armor, +DEF
  agi: number; // 敏捷: +Crit, +AtkSpeed
}

export interface PlayerProgress {
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  statPoints: number;
  allocations: StatAllocations;
  rebirth: number; // 0..5
  gold: number;
  ingots: number;
  stones: number;
  wingLevel: number; // 1..8
  potions: number;
  equipped: Record<EquipSlot, EquipmentItem | null>;
  inventory: EquipmentItem[];
  autoBattle: boolean;
  soundEnabled: boolean;
  totalBossKills: number;
  armorBreaksTriggered: number;
  createdAt: number;
}

export interface ComputedStats {
  maxHp: number;
  maxMp: number;
  maxArmor: number;
  atk: number;
  def: number;
  critRate: number;
  critDmg: number;
  moveSpeed: number;
  atkSpeed: number;
  combatPower: number;
}

export interface FloatingAlert {
  id: string;
  mapId: string;
  bossName: string;
  mapName: string;
  type: 'spawn' | 'soon' | 'lord' | 'loot' | 'level';
  message: string;
  timestamp: number;
}
