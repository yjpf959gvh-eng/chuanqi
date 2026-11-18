import {
  ComputedStats,
  EquipSlot,
  EquipmentItem,
  MapConfig,
  PlayerProgress,
  Rarity,
  SkillDef,
} from './types';

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; border: string; bg: string; beamColor: string }
> = {
  common: {
    label: '精良',
    color: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.35)',
    bg: 'rgba(30, 41, 59, 0.7)',
    beamColor: '#94a3b8',
  },
  rare: {
    label: '稀有',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.45)',
    bg: 'rgba(12, 74, 110, 0.35)',
    beamColor: '#38bdf8',
  },
  epic: {
    label: '史诗',
    color: '#c084fc',
    border: 'rgba(192, 132, 252, 0.5)',
    bg: 'rgba(88, 28, 135, 0.35)',
    beamColor: '#c084fc',
  },
  legendary: {
    label: '传说',
    color: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.6)',
    bg: 'rgba(120, 53, 15, 0.4)',
    beamColor: '#f59e0b',
  },
  mythic: {
    label: '神话',
    color: '#f87171',
    border: 'rgba(248, 113, 113, 0.7)',
    bg: 'rgba(127, 29, 29, 0.45)',
    beamColor: '#ef4444',
  },
  lord: {
    label: '至尊',
    color: '#fde047',
    border: 'rgba(253, 224, 71, 0.85)',
    bg: 'rgba(133, 77, 14, 0.5)',
    beamColor: '#fde047',
  },
};

export const MAPS: MapConfig[] = [
  {
    id: 'woma',
    name: '沃玛神殿',
    subtitle: '迷宫探宝 · 沃玛教主栖息地',
    recommendedPower: 480,
    unlockLevel: 1,
    arenaImage: '/src/assets/images/arena_woma_temple_1794991379673.jpg',
    themeColor: '#f59e0b',
    bossId: 'boss_woma',
    bossName: '沃玛教主',
    bossTitle: '远古雷霆魔君',
    bossLevel: 12,
    bossMaxHp: 11500,
    bossMaxArmor: 4200,
    bossDef: 24,
    bossAtk: 56,
    mobName: '沃玛战将',
    mobHp: 460,
    mobAtk: 16,
    mobExp: 45,
    eliteName: '沃玛暗影护法',
    eliteHp: 2100,
    eliteAtk: 34,
    eliteExp: 150,
    respawnSeconds: 20,
    expReward: 620,
    goldReward: 2400,
    stoneReward: 5,
    dropTiers: [1, 2, 3],
    tokenDropChance: 0.3,
  },
  {
    id: 'zuma',
    name: '祖玛阁',
    subtitle: '石室迷城 · 裁决神兵产地',
    recommendedPower: 1800,
    unlockLevel: 8,
    arenaImage: '/src/assets/images/arena_zuma_hall_1794991382887.jpg',
    themeColor: '#10b981',
    bossId: 'boss_zuma',
    bossName: '祖玛教主',
    bossTitle: '黑曜石镇殿妖皇',
    bossLevel: 28,
    bossMaxHp: 46000,
    bossMaxArmor: 17500,
    bossDef: 85,
    bossAtk: 150,
    mobName: '祖玛弓箭手',
    mobHp: 2200,
    mobAtk: 48,
    mobExp: 170,
    eliteName: '祖玛雕像统领',
    eliteHp: 8500,
    eliteAtk: 88,
    eliteExp: 520,
    respawnSeconds: 28,
    expReward: 2400,
    goldReward: 8200,
    stoneReward: 10,
    dropTiers: [2, 3, 4],
    tokenDropChance: 0.5,
  },
  {
    id: 'crimson',
    name: '赤月魔穴',
    subtitle: '熔岩魔巢 · 屠龙宝刀秘境',
    recommendedPower: 5200,
    unlockLevel: 18,
    arenaImage: '/src/assets/images/arena_crimson_lair_1794991380447.jpg',
    themeColor: '#ef4444',
    bossId: 'boss_crimson',
    bossName: '赤月恶魔',
    bossTitle: '血海熔岩霸主',
    bossLevel: 45,
    bossMaxHp: 165000,
    bossMaxArmor: 62000,
    bossDef: 240,
    bossAtk: 370,
    mobName: '血巨人魔兵',
    mobHp: 7800,
    mobAtk: 120,
    mobExp: 480,
    eliteName: '双头金刚护法',
    eliteHp: 28000,
    eliteAtk: 210,
    eliteExp: 1400,
    respawnSeconds: 38,
    expReward: 8200,
    goldReward: 24000,
    stoneReward: 20,
    dropTiers: [3, 4, 5],
    tokenDropChance: 0.75,
  },
  {
    id: 'sabak',
    name: '沙巴克皇宫',
    subtitle: '皇城深殿 · 至尊神话终章',
    recommendedPower: 12500,
    unlockLevel: 30,
    arenaImage: '/src/assets/images/arena_sabak_palace_1794991380346.jpg',
    themeColor: '#eab308',
    bossId: 'boss_dragon',
    bossName: '暗之魔龙教主',
    bossTitle: '灭世龙皇',
    bossLevel: 68,
    bossMaxHp: 520000,
    bossMaxArmor: 195000,
    bossDef: 560,
    bossAtk: 820,
    mobName: '皇宫魔龙卫',
    mobHp: 22000,
    mobAtk: 290,
    mobExp: 1300,
    eliteName: '魔龙破甲将领',
    eliteHp: 82000,
    eliteAtk: 460,
    eliteExp: 3600,
    respawnSeconds: 50,
    expReward: 26000,
    goldReward: 70000,
    stoneReward: 42,
    dropTiers: [4, 5, 6],
    tokenDropChance: 1.0,
  },
];

export const SKILLS: SkillDef[] = [
  {
    id: 'fire_slash',
    name: '烈火剑法',
    shortName: '烈火',
    unlockLevel: 1,
    cooldown: 4.0,
    dmgMultiplier: 1.9,
    armorShredMultiplier: 2.8,
    mpCost: 10,
    color: '#f97316',
    description: '召唤烈焰剑气重劈，造成190%伤害并大幅削减BOSS护甲',
    keyHint: '1',
  },
  {
    id: 'thunder',
    name: '雷霆万钧',
    shortName: '雷霆',
    unlockLevel: 3,
    cooldown: 6.5,
    dmgMultiplier: 2.35,
    armorShredMultiplier: 2.1,
    mpCost: 16,
    color: '#38bdf8',
    description: 'Lv.3解锁：引动九天紫雷轰击周围敌军，附带1.5秒麻痹定身',
    keyHint: '2',
  },
  {
    id: 'sun_beam',
    name: '逐日剑法',
    shortName: '逐日',
    unlockLevel: 5,
    cooldown: 8.5,
    dmgMultiplier: 3.1,
    armorShredMultiplier: 3.8,
    mpCost: 22,
    color: '#fbbf24',
    description: 'Lv.5解锁：释放贯穿前方的金龙剑芒，极高破甲伤害击碎战甲',
    keyHint: '3',
  },
  {
    id: 'meteor_dash',
    name: '十步火雨',
    shortName: '火雨',
    unlockLevel: 8,
    cooldown: 12.0,
    dmgMultiplier: 3.9,
    armorShredMultiplier: 3.2,
    mpCost: 28,
    color: '#ef4444',
    description: 'Lv.8解锁：瞬移突袭至目标身后并降下流星火雨全屏轰炸',
    keyHint: '4',
  },
];

interface EquipTemplate {
  templateId: string;
  name: string;
  slot: EquipSlot;
  tier: number;
  rarity: Rarity;
  atk: number;
  def: number;
  hp: number;
  armor: number;
  critRate: number;
  visualStyle: string;
  description: string;
}

export const EQUIP_TEMPLATES: EquipTemplate[] = [
  {
    templateId: 'wp_t1',
    name: '青铜战刃',
    slot: 'weapon',
    tier: 1,
    rarity: 'common',
    atk: 42,
    def: 5,
    hp: 120,
    armor: 50,
    critRate: 3,
    visualStyle: 'steel',
    description: '初入玛法的制式重剑，刃口寒光初现。',
  },
  {
    templateId: 'wp_t2',
    name: '炼狱战斧',
    slot: 'weapon',
    tier: 2,
    rarity: 'rare',
    atk: 145,
    def: 15,
    hp: 350,
    armor: 140,
    critRate: 7,
    visualStyle: 'crimson_axe',
    description: '沃玛教主珍藏的双刃巨斧，挥舞时迸发赤红火花。',
  },
  {
    templateId: 'wp_t3',
    name: '裁决之杖',
    slot: 'weapon',
    tier: 3,
    rarity: 'epic',
    atk: 390,
    def: 35,
    hp: 900,
    armor: 360,
    critRate: 12,
    visualStyle: 'golden_mace',
    description: '祖玛阁传世神兵，金色雷纹缠绕，破甲威力惊人。',
  },
  {
    templateId: 'wp_t4',
    name: '屠龙宝刀',
    slot: 'weapon',
    tier: 4,
    rarity: 'legendary',
    atk: 980,
    def: 90,
    hp: 2400,
    armor: 900,
    critRate: 18,
    visualStyle: 'dragon_saber',
    description: '号令玛法武林的绝世宝刀，龙炎环绕刀身不灭。',
  },
  {
    templateId: 'wp_t5',
    name: '灭世·开天',
    slot: 'weapon',
    tier: 5,
    rarity: 'mythic',
    atk: 2500,
    def: 220,
    hp: 6200,
    armor: 2200,
    critRate: 26,
    visualStyle: 'celestial_blade',
    description: '蕴含星辰裂变之力的神话重剑，伴随飞剑护体环绕。',
  },
  {
    templateId: 'wp_t6',
    name: '至尊·沙城圣剑',
    slot: 'weapon',
    tier: 6,
    rarity: 'lord',
    atk: 5400,
    def: 480,
    hp: 14000,
    armor: 5000,
    critRate: 35,
    visualStyle: 'sabak_lord_sword',
    description: '沙巴克城主至高象征，双凤金芒照耀全殿。',
  },
  {
    templateId: 'ar_t1',
    name: '轻型战甲',
    slot: 'armor',
    tier: 1,
    rarity: 'common',
    atk: 8,
    def: 20,
    hp: 380,
    armor: 280,
    critRate: 0,
    visualStyle: 'iron_armor',
    description: '基础精铁护胸，提供基本护甲防护。',
  },
  {
    templateId: 'ar_t2',
    name: '幽灵战衣',
    slot: 'armor',
    tier: 2,
    rarity: 'rare',
    atk: 32,
    def: 68,
    hp: 1200,
    armor: 900,
    critRate: 4,
    visualStyle: 'jade_mantle',
    description: '青玉流光披风战衣，身法轻灵，自带护体灵纹。',
  },
  {
    templateId: 'ar_t3',
    name: '战神盔甲',
    slot: 'armor',
    tier: 3,
    rarity: 'epic',
    atk: 90,
    def: 190,
    hp: 3400,
    armor: 2400,
    critRate: 7,
    visualStyle: 'crimson_paladin',
    description: '赤金重肩战甲与猩红披风，威严赫赫。',
  },
  {
    templateId: 'ar_t4',
    name: '天魔神甲',
    slot: 'armor',
    tier: 4,
    rarity: 'legendary',
    atk: 250,
    def: 480,
    hp: 8800,
    armor: 6200,
    critRate: 11,
    visualStyle: 'demon_gold',
    description: '黑曜熔金重甲，周身燃起暗金魔焰护盾。',
  },
  {
    templateId: 'ar_t5',
    name: '凤天魔甲',
    slot: 'armor',
    tier: 5,
    rarity: 'mythic',
    atk: 640,
    def: 1250,
    hp: 22000,
    armor: 15000,
    critRate: 16,
    visualStyle: 'phoenix_robe',
    description: '浴火凤凰编织的神话战袍，破甲后亦能浴火重生。',
  },
  {
    templateId: 'ar_t6',
    name: '至尊龙皇袍',
    slot: 'armor',
    tier: 6,
    rarity: 'lord',
    atk: 1400,
    def: 2600,
    hp: 52000,
    armor: 36000,
    critRate: 22,
    visualStyle: 'dragon_emperor',
    description: '沙巴克霸主专属金龙帝袍，万法不侵，金光漫天。',
  },
  {
    templateId: 'nk_t1',
    name: '黑檀项链',
    slot: 'necklace',
    tier: 1,
    rarity: 'common',
    atk: 18,
    def: 6,
    hp: 140,
    armor: 75,
    critRate: 3,
    visualStyle: 'neck',
    description: '雕琢古朴的初级战链。',
  },
  {
    templateId: 'nk_t2',
    name: '幽冥项链',
    slot: 'necklace',
    tier: 2,
    rarity: 'rare',
    atk: 72,
    def: 18,
    hp: 450,
    armor: 220,
    critRate: 6,
    visualStyle: 'neck',
    description: '散发幽光的战意吊坠。',
  },
  {
    templateId: 'nk_t3',
    name: '绿色项链',
    slot: 'necklace',
    tier: 3,
    rarity: 'epic',
    atk: 195,
    def: 45,
    hp: 1200,
    armor: 600,
    critRate: 10,
    visualStyle: 'neck',
    description: '大幅提升出刀速度的玛法名链。',
  },
  {
    templateId: 'nk_t4',
    name: '圣战项链',
    slot: 'necklace',
    tier: 4,
    rarity: 'legendary',
    atk: 510,
    def: 120,
    hp: 3200,
    armor: 1500,
    critRate: 15,
    visualStyle: 'neck',
    description: '赤月巅峰战圣遗留的传承之链。',
  },
  {
    templateId: 'nk_t5',
    name: '星王战链',
    slot: 'necklace',
    tier: 5,
    rarity: 'mythic',
    atk: 1320,
    def: 310,
    hp: 8500,
    armor: 3800,
    critRate: 22,
    visualStyle: 'neck',
    description: '星辰凝聚的神话战链，暴击毁天灭地。',
  },
  {
    templateId: 'nk_t6',
    name: '沙城龙印链',
    slot: 'necklace',
    tier: 6,
    rarity: 'lord',
    atk: 2700,
    def: 620,
    hp: 18000,
    armor: 8200,
    critRate: 28,
    visualStyle: 'neck',
    description: '皇城玉玺碎片熔铸的至尊项链。',
  },
  {
    templateId: 'rg_t1',
    name: '蛇眼戒指',
    slot: 'ring',
    tier: 1,
    rarity: 'common',
    atk: 16,
    def: 8,
    hp: 160,
    armor: 90,
    critRate: 2,
    visualStyle: 'ring',
    description: '精准捕捉弱点的初级指环。',
  },
  {
    templateId: 'rg_t2',
    name: '力量戒指',
    slot: 'ring',
    tier: 2,
    rarity: 'rare',
    atk: 62,
    def: 22,
    hp: 520,
    armor: 260,
    critRate: 5,
    visualStyle: 'ring',
    description: '沃玛秘境出土的重击指环。',
  },
  {
    templateId: 'rg_t3',
    name: '麻痹魔戒',
    slot: 'ring',
    tier: 3,
    rarity: 'epic',
    atk: 175,
    def: 55,
    hp: 1400,
    armor: 700,
    critRate: 9,
    visualStyle: 'ring',
    description: '令敌人胆寒的传奇雷电指环。',
  },
  {
    templateId: 'rg_t4',
    name: '复活圣戒',
    slot: 'ring',
    tier: 4,
    rarity: 'legendary',
    atk: 460,
    def: 145,
    hp: 3800,
    armor: 1800,
    critRate: 14,
    visualStyle: 'ring',
    description: '蕴含磅礴生命力与破坏力的圣戒。',
  },
  {
    templateId: 'rg_t5',
    name: '战神神戒',
    slot: 'ring',
    tier: 5,
    rarity: 'mythic',
    atk: 1180,
    def: 360,
    hp: 9600,
    armor: 4500,
    critRate: 20,
    visualStyle: 'ring',
    description: '无双战神佩戴的破甲神戒。',
  },
  {
    templateId: 'rg_t6',
    name: '皇权至尊戒',
    slot: 'ring',
    tier: 6,
    rarity: 'lord',
    atk: 2450,
    def: 720,
    hp: 21000,
    armor: 9500,
    critRate: 25,
    visualStyle: 'ring',
    description: '统御沙巴克的至高权戒。',
  },
];

export const WING_NAMES = [
  '初阶·灵羽',
  '二阶·赤焰翼',
  '三阶·青鸾翼',
  '四阶·金鹏羽',
  '五阶·魔龙翅',
  '六阶·炽天翼',
  '七阶·涅槃凤羽',
  '巅峰·九霄龙翼',
];

export function calcExpToNext(level: number): number {
  return Math.round(110 + level * 45 + level * level * 1.4);
}

export function createItemFromTemplate(templateId: string, enhanceLevel = 0): EquipmentItem {
  const tpl = EQUIP_TEMPLATES.find((t) => t.templateId === templateId) || EQUIP_TEMPLATES[0];
  return {
    ...tpl,
    uid: `${tpl.templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    enhanceLevel,
    locked: false,
  };
}

export function rollDropItem(tiers: number[]): EquipmentItem {
  const r = Math.random();
  let chosenTier = tiers[0];
  if (tiers.length === 3) {
    if (r > 0.84) chosenTier = tiers[2];
    else if (r > 0.4) chosenTier = tiers[1];
    else chosenTier = tiers[0];
  } else if (tiers.length === 2) {
    chosenTier = r > 0.68 ? tiers[1] : tiers[0];
  }

  const candidates = EQUIP_TEMPLATES.filter((t) => t.tier === chosenTier);
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const bonusEnhance = Math.random() > 0.82 ? 1 : 0;
  return createItemFromTemplate(picked.templateId, bonusEnhance);
}

export function getItemEffectiveStats(item: EquipmentItem) {
  const mult = 1 + item.enhanceLevel * 0.14;
  return {
    atk: Math.round(item.atk * mult),
    def: Math.round(item.def * mult),
    hp: Math.round(item.hp * mult),
    armor: Math.round(item.armor * mult),
    critRate: item.critRate + Math.floor(item.enhanceLevel / 3),
  };
}

export function getItemPower(item: EquipmentItem): number {
  const s = getItemEffectiveStats(item);
  return Math.round(s.atk * 2.2 + s.def * 1.5 + s.hp * 0.22 + s.armor * 0.35 + s.critRate * 25);
}

export function computePlayerStats(progress: PlayerProgress, isLord: boolean): ComputedStats {
  const lv = progress.level;
  const rb = progress.rebirth;
  const alloc = progress.allocations || { str: 0, vit: 0, agi: 0 };

  let atk = 30 + lv * 14 + rb * 320 + alloc.str * 6;
  let def = 12 + lv * 6 + rb * 140 + alloc.vit * 3;
  let maxHp = 440 + lv * 95 + rb * 2800 + alloc.vit * 45;
  let maxArmor = 280 + lv * 60 + rb * 1800 + alloc.vit * 25;
  let critRate = 8 + rb * 4 + Math.min(25, alloc.agi * 0.4);

  const wingBonus = progress.wingLevel - 1;
  atk += wingBonus * 125 + wingBonus * wingBonus * 38;
  def += wingBonus * 55 + wingBonus * wingBonus * 18;
  maxHp += wingBonus * 850 + wingBonus * wingBonus * 260;
  maxArmor += wingBonus * 550 + wingBonus * wingBonus * 170;
  critRate += wingBonus * 2;

  const slots: EquipSlot[] = ['weapon', 'armor', 'necklace', 'ring'];
  for (const slot of slots) {
    const item = progress.equipped[slot];
    if (item) {
      const s = getItemEffectiveStats(item);
      atk += s.atk;
      def += s.def;
      maxHp += s.hp;
      maxArmor += s.armor;
      critRate += s.critRate;
    }
  }

  if (isLord) {
    atk = Math.round(atk * 1.3);
    def = Math.round(def * 1.3);
    maxHp = Math.round(maxHp * 1.3);
    maxArmor = Math.round(maxArmor * 1.3);
    critRate += 10;
  }

  critRate = Math.min(85, Math.round(critRate));
  const critDmg = 1.6 + rb * 0.1 + (isLord ? 0.25 : 0);
  const moveSpeed = 245 + Math.min(85, wingBonus * 10);
  const atkSpeed = 1.0 + Math.min(0.85, wingBonus * 0.06 + rb * 0.05 + alloc.agi * 0.008);
  const maxMp = 120 + lv * 5;

  const combatPower = Math.round(
    atk * 2.2 + def * 1.5 + maxHp * 0.22 + maxArmor * 0.35 + critRate * 25
  );

  return {
    maxHp,
    maxMp,
    maxArmor,
    atk,
    def,
    critRate,
    critDmg,
    moveSpeed,
    atkSpeed,
    combatPower,
  };
}

export function createInitialProgress(): PlayerProgress {
  return {
    name: '玛法战神',
    level: 1,
    exp: 0,
    expToNext: calcExpToNext(1),
    statPoints: 0,
    allocations: { str: 0, vit: 0, agi: 0 },
    rebirth: 0,
    gold: 1500,
    ingots: 120,
    stones: 8,
    wingLevel: 1,
    potions: 20,
    equipped: {
      weapon: createItemFromTemplate('wp_t1', 0),
      armor: createItemFromTemplate('ar_t1', 0),
      necklace: createItemFromTemplate('nk_t1', 0),
      ring: createItemFromTemplate('rg_t1', 0),
    },
    inventory: [],
    autoBattle: false,
    soundEnabled: true,
    totalBossKills: 0,
    armorBreaksTriggered: 0,
    createdAt: Date.now(),
  };
}
