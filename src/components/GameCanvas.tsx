import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../game/audio';
import { MAPS, RARITY_META, rollDropItem, SKILLS } from '../game/data';
import {
  BossTelegraph,
  drawBoss,
  drawChests,
  drawEffects,
  drawFloatingTexts,
  drawGroundLoot,
  drawMob,
  drawObstacles,
  drawParticles,
  drawPlayer,
  drawRoomFloorLabels,
  drawTelegraphs,
  drawWorldBackground,
  FloatingText,
  GroundLoot,
  MinimapRenderData,
  Particle,
  RenderBoss,
  RenderChest,
  RenderMob,
  RenderPlayer,
  SkillEffect,
} from '../game/renderer';
import {
  BossRuntimeState,
  ComputedStats,
  EquipmentItem,
  MapConfig,
  PlayerProgress,
  SabakState,
  SkillDef,
} from '../game/types';
import {
  FOG_CELL,
  FOG_COLS,
  FOG_ROWS,
  getRoomNameAt,
  MAP_LAYOUTS,
  resolveCircleObstacles,
  WORLD_H,
  WORLD_W,
} from '../game/worldMap';

export interface ActiveTargetInfo {
  name: string;
  level: number;
  isBoss: boolean;
  isElite: boolean;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  isArmorBroken: boolean;
}

export interface LiveCombatSnapshot {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerArmor: number;
  playerMaxArmor: number;
  playerArmorBroken: boolean;
  currentRoomName: string;
  exploredPct: number;
  clueRemaining: number;
  activeTarget: ActiveTargetInfo | null;
  dashCooldown: number;
  teleportCooldown: number;
  skillCooldowns: Record<string, number>;
}

export interface CanvasActions {
  castSkill: (skillId: SkillDef['id']) => void;
  basicAttack: () => void;
  dashDodge: () => void;
  randomTeleport: () => void;
  usePotion: () => void;
  repairArmor: () => void;
}

interface GameCanvasProps {
  currentMap: MapConfig;
  bossRuntime: BossRuntimeState;
  stats: ComputedStats;
  progress: PlayerProgress;
  sabak: SabakState;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  actionsRef: React.MutableRefObject<CanvasActions | null>;
  minimapDataRef: React.MutableRefObject<MinimapRenderData | null>;
  onSnapshot: (snap: LiveCombatSnapshot) => void;
  onBossKilled: (
    mapId: string,
    wasArmorBroken: boolean,
    isSiegeLord: boolean
  ) => void;
  onMobKilled: (mapId: string, isElite: boolean) => void;
  onPickupLoot: (loot: {
    kind: 'item' | 'gold' | 'stone' | 'token';
    item?: EquipmentItem;
    amount?: number;
  }) => void;
  onBossArmorBreakCount: () => void;
  onConsumePotion: () => boolean;
  onRepairArmorCost: () => boolean;
  onSiegeFail: () => void;
  onStatusBanner: (msg: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentMap,
  bossRuntime,
  stats,
  progress,
  sabak,
  joystickRef,
  actionsRef,
  minimapDataRef,
  onSnapshot,
  onBossKilled,
  onMobKilled,
  onPickupLoot,
  onBossArmorBreakCount,
  onConsumePotion,
  onRepairArmorCost,
  onSiegeFail,
  onStatusBanner,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const viewSizeRef = useRef({ w: 960, h: 640 });
  const prevLevelRef = useRef(progress.level);

  const propsRef = useRef({
    currentMap,
    bossRuntime,
    stats,
    progress,
    sabak,
    onSnapshot,
    onBossKilled,
    onMobKilled,
    onPickupLoot,
    onBossArmorBreakCount,
    onConsumePotion,
    onRepairArmorCost,
    onSiegeFail,
    onStatusBanner,
  });
  propsRef.current = {
    currentMap,
    bossRuntime,
    stats,
    progress,
    sabak,
    onSnapshot,
    onBossKilled,
    onMobKilled,
    onPickupLoot,
    onBossArmorBreakCount,
    onConsumePotion,
    onRepairArmorCost,
    onSiegeFail,
    onStatusBanner,
  };

  const simRef = useRef({
    mapId: currentMap.id,
    wasSiege: sabak.siegeActive,
    time: 0,
    hitStop: 0,
    shake: 0,
    camX: 0,
    camY: 0,
    clueTimer: 0,
    fog: new Uint8Array(FOG_COLS * FOG_ROWS),
    keys: new Set<string>(),
    clickTarget: null as { x: number; y: number } | null,
    player: {
      x: 240,
      y: 900,
      facing: 0,
      hp: stats.maxHp,
      mp: stats.maxMp,
      armor: stats.maxArmor,
      isArmorBroken: false,
      swingProgress: 0,
      atkTimer: 0,
      hitFlash: 0,
      invulnTimer: 0,
      dashTrail: [] as { x: number; y: number; alpha: number }[],
    },
    boss: null as RenderBoss | null,
    mobs: [] as RenderMob[],
    chests: [] as RenderChest[],
    bossAttackTimer: 1.5,
    bossTelegraphTimer: 4.0,
    telegraphs: [] as BossTelegraph[],
    effects: [] as SkillEffect[],
    particles: [] as Particle[],
    texts: [] as FloatingText[],
    loots: [] as GroundLoot[],
    dashCooldown: 0,
    teleportCooldown: 0,
    cooldowns: {
      fire_slash: 0,
      thunder: 0,
      sun_beam: 0,
      meteor_dash: 0,
    } as Record<string, number>,
  });

  // ResizeObserver for crisp 100% full-viewport canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        viewSizeRef.current = { w: Math.round(rect.width), h: Math.round(rect.height) };
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    for (const m of MAPS) {
      if (!bgCacheRef.current[m.id]) {
        const img = new Image();
        img.src = m.arenaImage;
        bgCacheRef.current[m.id] = img;
      }
    }
  }, []);

  // Golden Level-Up Pillar Celebration!
  useEffect(() => {
    if (progress.level > prevLevelRef.current) {
      const sim = simRef.current;
      sim.player.hp = propsRef.current.stats.maxHp;
      sim.player.mp = propsRef.current.stats.maxMp;
      sim.player.armor = propsRef.current.stats.maxArmor;
      sim.player.isArmorBroken = false;
      soundEngine.playLevelUp();
      sim.effects.push({
        id: `lv_${Date.now()}`,
        kind: 'level_up',
        x: sim.player.x,
        y: sim.player.y,
        tx: sim.player.x,
        ty: sim.player.y,
        angle: 0,
        life: 1.2,
        maxLife: 1.2,
        color: '#fde047',
        radius: 60,
      });
      sim.texts.push({
        id: `lvt_${Date.now()}`,
        x: sim.player.x,
        y: sim.player.y - 52,
        vy: -20,
        text: `升级！Lv.${progress.level} (+5潜能点)`,
        color: '#fde047',
        scale: 1.3,
        life: 2.0,
        maxLife: 2.0,
        isBanner: true,
      });
    }
    prevLevelRef.current = progress.level;
  }, [progress.level]);

  const spawnMapEntities = (map: MapConfig) => {
    const layout = MAP_LAYOUTS[map.id] || MAP_LAYOUTS.woma;
    const mobs: RenderMob[] = [];

    layout.mobSpawns.forEach((sp, idx) => {
      mobs.push({
        id: `mb_${map.id}_${idx}`,
        x: sp.x,
        y: sp.y,
        homeX: sp.x,
        homeY: sp.y,
        name: map.mobName,
        isElite: false,
        hp: map.mobHp,
        maxHp: map.mobHp,
        atk: map.mobAtk,
        expReward: map.mobExp,
        hitFlash: 0,
        stunTimer: 0,
        atkTimer: 1.0,
        respawnTimer: 0,
      });
    });

    layout.eliteSpawns.forEach((sp, idx) => {
      mobs.push({
        id: `el_${map.id}_${idx}`,
        x: sp.x,
        y: sp.y,
        homeX: sp.x,
        homeY: sp.y,
        name: map.eliteName,
        isElite: true,
        hp: map.eliteHp,
        maxHp: map.eliteHp,
        atk: map.eliteAtk,
        expReward: map.eliteExp,
        hitFlash: 0,
        stunTimer: 0,
        atkTimer: 1.2,
        respawnTimer: 0,
      });
    });

    simRef.current.mobs = mobs;
    simRef.current.chests = layout.chestSpawns.map((cp, idx) => ({
      id: `ch_${map.id}_${idx}`,
      x: cp.x,
      y: cp.y,
      opened: false,
      respawnTimer: 0,
    }));
  };

  const spawnBossEntity = (map: MapConfig, isSiege: boolean) => {
    const sim = simRef.current;
    const layout = MAP_LAYOUTS[map.id] || MAP_LAYOUTS.woma;
    const candidates = layout.bossSpawnCandidates;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    if (isSiege) {
      sim.boss = {
        x: 1400,
        y: 340,
        bossId: 'boss_siege',
        name: '沙巴克幻影城主',
        title: '皇城守御至尊',
        level: 50,
        hp: 140000,
        maxHp: 140000,
        armor: 52000,
        maxArmor: 52000,
        isArmorBroken: false,
        armorBreakTimer: 0,
        stunTimer: 0,
        hitFlash: 0,
        attackAnim: 0,
        isSiegeLord: true,
        discovered: true,
      };
    } else {
      sim.boss = {
        x: picked.x,
        y: picked.y,
        bossId: map.bossId,
        name: map.bossName,
        title: map.bossTitle,
        level: map.bossLevel,
        hp: map.bossMaxHp,
        maxHp: map.bossMaxHp,
        armor: map.bossMaxArmor,
        maxArmor: map.bossMaxArmor,
        isArmorBroken: false,
        armorBreakTimer: 0,
        stunTimer: 0,
        hitFlash: 0,
        attackAnim: 0,
        isSiegeLord: false,
        discovered: false,
      };
    }
    sim.bossAttackTimer = 1.5;
    sim.bossTelegraphTimer = 4.0;
    sim.telegraphs = [];
  };

  useEffect(() => {
    const sim = simRef.current;
    if (sim.mapId !== currentMap.id || sim.wasSiege !== sabak.siegeActive) {
      sim.mapId = currentMap.id;
      sim.wasSiege = sabak.siegeActive;
      const layout = MAP_LAYOUTS[currentMap.id] || MAP_LAYOUTS.woma;
      sim.player.x = sabak.siegeActive ? 1400 : layout.playerSpawn.x;
      sim.player.y = sabak.siegeActive ? 1100 : layout.playerSpawn.y;
      sim.player.hp = propsRef.current.stats.maxHp;
      sim.player.mp = propsRef.current.stats.maxMp;
      sim.player.armor = propsRef.current.stats.maxArmor;
      sim.player.isArmorBroken = false;
      sim.fog = new Uint8Array(FOG_COLS * FOG_ROWS);
      sim.clueTimer = 0;
      sim.clickTarget = null;
      sim.loots = [];
      sim.telegraphs = [];
      sim.effects = [];

      spawnMapEntities(currentMap);
      if (sabak.siegeActive) {
        spawnBossEntity(currentMap, true);
      } else if (bossRuntime.isAlive) {
        spawnBossEntity(currentMap, false);
      } else {
        sim.boss = null;
      }
    }
  }, [currentMap, sabak.siegeActive, bossRuntime.isAlive]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sabak.siegeActive && bossRuntime.isAlive && !sim.boss) {
      spawnBossEntity(currentMap, false);
    }
  }, [bossRuntime.isAlive, currentMap, sabak.siegeActive]);

  const addText = (
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
    isBanner = false
  ) => {
    simRef.current.texts.push({
      id: `${Date.now()}_${Math.random()}`,
      x: x + (Math.random() - 0.5) * 26,
      y,
      vy: isBanner ? -18 : -44,
      text,
      color,
      scale,
      life: isBanner ? 1.7 : 0.9,
      maxLife: isBanner ? 1.7 : 0.9,
      isBanner,
    });
  };

  const spawnArmorShards = (x: number, y: number, color: string, count = 24) => {
    const sim = simRef.current;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spd = 120 + Math.random() * 210;
      sim.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: 0.65 + Math.random() * 0.4,
        maxLife: 1.05,
        size: 5 + Math.random() * 5,
        color,
        type: 'shard',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
      });
    }
    sim.effects.push({
      id: `wave_${Date.now()}`,
      kind: 'shatter_wave',
      x,
      y,
      tx: x,
      ty: y,
      angle: 0,
      life: 0.45,
      maxLife: 0.45,
      color: '#fde047',
      radius: 130,
    });
  };

  const spawnImpactSparks = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      simRef.current.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.55,
        size: 2.5 + Math.random() * 3,
        color,
        type: 'spark',
      });
    }
  };

  const findNearestTarget = (maxRange = 9999) => {
    const sim = simRef.current;
    let best: { kind: 'boss' | 'mob'; x: number; y: number; dist: number; mob?: RenderMob } | null = null;
    if (sim.boss && sim.boss.hp > 0) {
      const d = Math.hypot(sim.boss.x - sim.player.x, sim.boss.y - sim.player.y);
      if (d <= maxRange) {
        best = { kind: 'boss', x: sim.boss.x, y: sim.boss.y, dist: d };
      }
    }
    for (const m of sim.mobs) {
      if (m.hp <= 0) continue;
      const d = Math.hypot(m.x - sim.player.x, m.y - sim.player.y);
      if (d <= maxRange && (!best || d < best.dist)) {
        best = { kind: 'mob', x: m.x, y: m.y, dist: d, mob: m };
      }
    }
    return best;
  };

  const dealDamageToBoss = (dmgMult: number, armorShredMult: number, skillColor: string) => {
    const sim = simRef.current;
    const boss = sim.boss;
    const { stats: st, currentMap: map, sabak: sb } = propsRef.current;
    if (!boss || boss.hp <= 0) return;

    const bonusCrit = sim.player.isArmorBroken ? 35 : 0;
    const isCrit = Math.random() * 100 < st.critRate + bonusCrit;

    const bossDef = boss.isSiegeLord ? 220 : map.bossDef;
    const rawAfterDef = Math.max(st.atk * 0.28, st.atk - bossDef * 0.55);
    const armorPhaseMult = boss.isArmorBroken ? 1.45 : 0.55;

    let dmg = rawAfterDef * dmgMult * armorPhaseMult * (0.92 + Math.random() * 0.16);
    if (isCrit) dmg *= st.critDmg;
    const finalDmg = Math.max(12, Math.round(dmg));

    if (!boss.isArmorBroken && boss.armor > 0) {
      const shred = Math.round(st.atk * armorShredMult * (isCrit ? 1.35 : 1.0));
      boss.armor = Math.max(0, boss.armor - shred);
      if (boss.armor <= 0) {
        boss.isArmorBroken = true;
        boss.armorBreakTimer = 14;
        sim.hitStop = 0.11;
        sim.shake = 14;
        soundEngine.playArmorShatter();
        spawnArmorShards(boss.x, boss.y, '#94a3b8', 26);
        addText(boss.x, boss.y - 68, '破甲爆衣！易伤+45%', '#fde047', 1.25, true);
        propsRef.current.onBossArmorBreakCount();
      }
    }

    boss.hp = Math.max(0, boss.hp - finalDmg);
    boss.hitFlash = 0.1;

    spawnImpactSparks(boss.x, boss.y - 10, isCrit ? '#fde047' : skillColor, isCrit ? 12 : 7);
    addText(
      boss.x,
      boss.y - 34,
      isCrit ? `暴击 ${finalDmg.toLocaleString()}` : `${finalDmg.toLocaleString()}`,
      isCrit ? '#fde047' : '#ffffff',
      isCrit ? 1.3 : 1.0
    );

    if (boss.hp <= 0) {
      const wasBroken = boss.isArmorBroken;
      const isDouble = Date.now() < sb.doubleDropUntil;
      const dropCount = (wasBroken ? 3 : 2) + (isDouble ? 2 : 0);

      spawnArmorShards(boss.x, boss.y, '#ef4444', 32);
      sim.shake = 16;
      soundEngine.playLootChime();

      if (boss.isSiegeLord) {
        addText(boss.x, boss.y - 50, '攻城胜利 · 恭迎沙巴克城主！', '#fde047', 1.4, true);
        sim.boss = null;
        propsRef.current.onBossKilled(map.id, wasBroken, true);
        return;
      }

      sim.loots.push({
        id: `gold_${Date.now()}`,
        x: boss.x + (Math.random() - 0.5) * 70,
        y: boss.y + (Math.random() - 0.5) * 50,
        label: `${map.goldReward.toLocaleString()} 金币`,
        rarity: 'legendary',
        kind: 'gold',
        amount: map.goldReward * (isDouble ? 2 : 1),
        spawnAt: sim.time,
      });

      sim.loots.push({
        id: `stone_${Date.now()}`,
        x: boss.x + (Math.random() - 0.5) * 80,
        y: boss.y + (Math.random() - 0.5) * 50,
        label: `强化石 ×${map.stoneReward}`,
        rarity: 'rare',
        kind: 'stone',
        amount: map.stoneReward * (isDouble ? 2 : 1),
        spawnAt: sim.time,
      });

      if (Math.random() < map.tokenDropChance) {
        sim.loots.push({
          id: `token_${Date.now()}`,
          x: boss.x + (Math.random() - 0.5) * 85,
          y: boss.y + (Math.random() - 0.5) * 55,
          label: '沙巴克令牌 ×1',
          rarity: 'lord',
          kind: 'token',
          amount: 1,
          spawnAt: sim.time,
        });
      }

      for (let i = 0; i < dropCount; i++) {
        const item = rollDropItem(map.dropTiers);
        sim.loots.push({
          id: `item_${Date.now()}_${i}`,
          x: boss.x + (Math.random() - 0.5) * 120,
          y: boss.y + (Math.random() - 0.5) * 75,
          label: item.name,
          rarity: item.rarity,
          kind: 'item',
          item,
          spawnAt: sim.time,
        });
      }

      sim.boss = null;
      propsRef.current.onBossKilled(map.id, wasBroken, false);
    }
  };

  const dealDamageToMob = (m: RenderMob, dmgMult: number, skillColor: string, stunSec = 0) => {
    const sim = simRef.current;
    const { stats: st, currentMap: map } = propsRef.current;
    if (m.hp <= 0) return;

    const bonusCrit = sim.player.isArmorBroken ? 35 : 0;
    const isCrit = Math.random() * 100 < st.critRate + bonusCrit;
    let dmg = st.atk * dmgMult * (0.9 + Math.random() * 0.2);
    if (isCrit) dmg *= st.critDmg;
    const finalDmg = Math.max(15, Math.round(dmg));

    m.hp = Math.max(0, m.hp - finalDmg);
    m.hitFlash = 0.1;
    if (stunSec > 0) m.stunTimer = Math.max(m.stunTimer, stunSec);

    spawnImpactSparks(m.x, m.y - 8, isCrit ? '#fde047' : skillColor, 6);
    addText(
      m.x,
      m.y - 26,
      isCrit ? `暴击 ${finalDmg}` : `${finalDmg}`,
      isCrit ? '#fde047' : '#ffffff',
      isCrit ? 1.15 : 0.95
    );

    if (m.hp <= 0) {
      m.respawnTimer = m.isElite ? 12 : 8;
      soundEngine.playLootChime();
      addText(m.x, m.y - 42, `+${m.expReward} 经验`, '#34d399', 0.95);

      const goldAmt = Math.round(map.goldReward * (m.isElite ? 0.25 : 0.08));
      sim.loots.push({
        id: `mg_${Date.now()}_${Math.random()}`,
        x: m.x + (Math.random() - 0.5) * 36,
        y: m.y + (Math.random() - 0.5) * 24,
        label: `${goldAmt} 金币`,
        rarity: m.isElite ? 'rare' : 'common',
        kind: 'gold',
        amount: goldAmt,
        spawnAt: sim.time,
      });

      if (m.isElite) {
        // Elites reveal a Boss Clue!
        if (sim.boss && sim.boss.hp > 0) {
          sim.clueTimer = 15;
          addText(sim.player.x, sim.player.y - 48, '获得教主踪迹！罗盘指引15秒', '#fde047', 1.1, true);
        }
        sim.loots.push({
          id: `ms_${Date.now()}_${Math.random()}`,
          x: m.x + 18,
          y: m.y,
          label: `强化石 ×1`,
          rarity: 'rare',
          kind: 'stone',
          amount: 1,
          spawnAt: sim.time,
        });
        if (Math.random() < 0.5) {
          const item = rollDropItem([map.dropTiers[0], map.dropTiers[Math.min(1, map.dropTiers.length - 1)]]);
          sim.loots.push({
            id: `mi_${Date.now()}_${Math.random()}`,
            x: m.x,
            y: m.y + 14,
            label: item.name,
            rarity: item.rarity,
            kind: 'item',
            item,
            spawnAt: sim.time,
          });
        }
      } else if (Math.random() < 0.16) {
        const item = rollDropItem([map.dropTiers[0]]);
        sim.loots.push({
          id: `mi_${Date.now()}_${Math.random()}`,
          x: m.x,
          y: m.y + 12,
          label: item.name,
          rarity: item.rarity,
          kind: 'item',
          item,
          spawnAt: sim.time,
        });
      }

      propsRef.current.onMobKilled(map.id, m.isElite);
    }
  };

  useEffect(() => {
    const performBasicAttack = () => {
      const sim = simRef.current;
      if (sim.player.atkTimer > 0) return;
      const target = findNearestTarget(110);
      if (!target) {
        sim.player.atkTimer = 0.45;
        sim.player.swingProgress = 1;
        soundEngine.playSlash();
        sim.effects.push({
          id: `sl_${Date.now()}`,
          kind: 'slash',
          x: sim.player.x,
          y: sim.player.y,
          tx: sim.player.x,
          ty: sim.player.y,
          angle: sim.player.facing,
          life: 0.16,
          maxLife: 0.16,
          color: '#f8fafc',
          radius: 52,
        });
        return;
      }

      const { stats: st } = propsRef.current;
      const spdBonus = sim.player.isArmorBroken ? 1.25 : 1.0;
      sim.player.atkTimer = 0.52 / (st.atkSpeed * spdBonus);
      sim.player.swingProgress = 1;
      sim.player.facing = Math.atan2(target.y - sim.player.y, target.x - sim.player.x);
      soundEngine.playSlash();

      sim.effects.push({
        id: `slash_${Date.now()}`,
        kind: 'slash',
        x: sim.player.x,
        y: sim.player.y,
        tx: target.x,
        ty: target.y,
        angle: sim.player.facing,
        life: 0.18,
        maxLife: 0.18,
        color: '#f8fafc',
        radius: 56,
      });

      if (target.kind === 'boss') dealDamageToBoss(1.0, 1.0, '#f8fafc');
      else if (target.mob) dealDamageToMob(target.mob, 1.0, '#f8fafc');
    };

    const performSkill = (skillId: SkillDef['id']) => {
      const sim = simRef.current;
      const { progress: prog, currentMap: map } = propsRef.current;
      const skill = SKILLS.find((s) => s.id === skillId);
      if (!skill) return;
      if (prog.level < skill.unlockLevel) {
        propsRef.current.onStatusBanner(`【${skill.name}】需人物 Lv.${skill.unlockLevel} 解锁！`);
        return;
      }
      if ((sim.cooldowns[skillId] || 0) > 0) return;

      const target = findNearestTarget(380);
      if (!target) {
        propsRef.current.onStatusBanner('附近无怪物目标，请沿着房间搜寻怪物或BOSS！');
        return;
      }

      sim.cooldowns[skillId] = skill.cooldown;
      sim.player.facing = Math.atan2(target.y - sim.player.y, target.x - sim.player.x);
      sim.player.swingProgress = 1;
      soundEngine.playSkill(skillId);

      const layout = MAP_LAYOUTS[map.id] || MAP_LAYOUTS.woma;

      if (skillId === 'fire_slash') {
        if (target.dist > 110) {
          const step = Math.min(80, target.dist - 55);
          const pos = resolveCircleObstacles(
            sim.player.x + Math.cos(sim.player.facing) * step,
            sim.player.y + Math.sin(sim.player.facing) * step,
            16,
            layout.obstacles
          );
          sim.player.x = pos.x;
          sim.player.y = pos.y;
        }
        sim.shake = 7;
        sim.effects.push({
          id: `fs_${Date.now()}`,
          kind: 'fire_slash',
          x: sim.player.x,
          y: sim.player.y,
          tx: target.x,
          ty: target.y,
          angle: sim.player.facing,
          life: 0.32,
          maxLife: 0.32,
          color: '#f97316',
          radius: 86,
        });
      } else if (skillId === 'thunder') {
        sim.shake = 9;
        for (let i = 0; i < 3; i++) {
          sim.effects.push({
            id: `th_${Date.now()}_${i}`,
            kind: 'thunder',
            x: sim.player.x,
            y: sim.player.y,
            tx: target.x + (i - 1) * 28,
            ty: target.y + (Math.random() - 0.5) * 20,
            angle: 0,
            life: 0.35,
            maxLife: 0.35,
            color: '#38bdf8',
            radius: 62,
          });
        }
        if (target.kind === 'boss' && sim.boss) {
          sim.boss.stunTimer = Math.max(sim.boss.stunTimer, 1.5);
        }
      } else if (skillId === 'sun_beam') {
        sim.shake = 10;
        sim.effects.push({
          id: `sb_${Date.now()}`,
          kind: 'sun_beam',
          x: sim.player.x,
          y: sim.player.y,
          tx: target.x,
          ty: target.y,
          angle: sim.player.facing,
          life: 0.36,
          maxLife: 0.36,
          color: '#fbbf24',
          radius: 420,
        });
      } else if (skillId === 'meteor_dash') {
        for (let i = 0; i < 4; i++) {
          sim.player.dashTrail.push({
            x: sim.player.x + ((target.x - sim.player.x) * i) / 4,
            y: sim.player.y + ((target.y - sim.player.y) * i) / 4,
            alpha: 1,
          });
        }
        const pos = resolveCircleObstacles(
          target.x - Math.cos(sim.player.facing) * 58,
          target.y - Math.sin(sim.player.facing) * 58,
          16,
          layout.obstacles
        );
        sim.player.x = pos.x;
        sim.player.y = pos.y;
        sim.shake = 13;
        for (let i = 0; i < 5; i++) {
          sim.effects.push({
            id: `mt_${Date.now()}_${i}`,
            kind: 'meteor',
            x: target.x,
            y: target.y,
            tx: target.x + (Math.random() - 0.5) * 90,
            ty: target.y + (Math.random() - 0.5) * 70,
            angle: 0,
            life: 0.48,
            maxLife: 0.48,
            color: '#ef4444',
            radius: 68,
          });
        }
      }

      if (target.kind === 'boss') {
        dealDamageToBoss(skill.dmgMultiplier, skill.armorShredMultiplier, skill.color);
      } else if (target.mob) {
        dealDamageToMob(target.mob, skill.dmgMultiplier, skill.color, skillId === 'thunder' ? 1.5 : 0);
      }
    };

    const dashDodge = () => {
      const sim = simRef.current;
      if (sim.dashCooldown > 0) return;
      sim.dashCooldown = 2.2;
      sim.player.invulnTimer = 0.4;
      const layout = MAP_LAYOUTS[propsRef.current.currentMap.id] || MAP_LAYOUTS.woma;
      for (let i = 0; i < 4; i++) {
        sim.player.dashTrail.push({
          x: sim.player.x + Math.cos(sim.player.facing) * i * 32,
          y: sim.player.y + Math.sin(sim.player.facing) * i * 32,
          alpha: 1,
        });
      }
      const nextPos = resolveCircleObstacles(
        sim.player.x + Math.cos(sim.player.facing) * 150,
        sim.player.y + Math.sin(sim.player.facing) * 150,
        16,
        layout.obstacles
      );
      sim.player.x = nextPos.x;
      sim.player.y = nextPos.y;
      addText(sim.player.x, sim.player.y - 25, '疾风闪避', '#38bdf8', 0.9);
    };

    const randomTeleport = () => {
      const sim = simRef.current;
      if (sim.teleportCooldown > 0) return;
      sim.teleportCooldown = 2.5;
      const layout = MAP_LAYOUTS[propsRef.current.currentMap.id] || MAP_LAYOUTS.woma;
      const rx = 180 + Math.random() * (WORLD_W - 360);
      const ry = 180 + Math.random() * (WORLD_H - 360);
      const safe = resolveCircleObstacles(rx, ry, 20, layout.obstacles);
      sim.player.x = safe.x;
      sim.player.y = safe.y;
      sim.clickTarget = null;
      soundEngine.playSkill('sun_beam');
      spawnImpactSparks(sim.player.x, sim.player.y, '#38bdf8', 14);
      addText(sim.player.x, sim.player.y - 30, '随机传送！', '#38bdf8', 1.05);
    };

    const usePotion = () => {
      const sim = simRef.current;
      const { stats: st } = propsRef.current;
      if (sim.player.hp >= st.maxHp * 0.98) return;
      if (propsRef.current.onConsumePotion()) {
        const heal = Math.round(st.maxHp * 0.45);
        sim.player.hp = Math.min(st.maxHp, sim.player.hp + heal);
        sim.player.mp = Math.min(st.maxMp, sim.player.mp + 45);
        addText(sim.player.x, sim.player.y - 30, `+${heal} HP`, '#10b981', 1.05);
        spawnImpactSparks(sim.player.x, sim.player.y, '#10b981', 10);
      }
    };

    const repairArmor = () => {
      const sim = simRef.current;
      const { stats: st } = propsRef.current;
      if (sim.player.armor >= st.maxArmor && !sim.player.isArmorBroken) return;
      if (propsRef.current.onRepairArmorCost()) {
        sim.player.armor = st.maxArmor;
        sim.player.isArmorBroken = false;
        addText(sim.player.x, sim.player.y - 35, '战甲修复完成！', '#38bdf8', 1.1);
        spawnImpactSparks(sim.player.x, sim.player.y, '#38bdf8', 14);
      }
    };

    actionsRef.current = {
      castSkill: performSkill,
      basicAttack: performBasicAttack,
      dashDodge,
      randomTeleport,
      usePotion,
      repairArmor,
    };
  }, [actionsRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      simRef.current.keys.add(k);
      if (k === '1') actionsRef.current?.castSkill('fire_slash');
      else if (k === '2') actionsRef.current?.castSkill('thunder');
      else if (k === '3') actionsRef.current?.castSkill('sun_beam');
      else if (k === '4') actionsRef.current?.castSkill('meteor_dash');
      else if (k === ' ') {
        e.preventDefault();
        actionsRef.current?.basicAttack();
      } else if (k === 'shift') actionsRef.current?.dashDodge();
      else if (k === 'r') actionsRef.current?.randomTeleport();
      else if (k === 'q') actionsRef.current?.usePotion();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [actionsRef]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let snapTimer = 0;

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const sim = simRef.current;
      const { stats: st, progress: prog, sabak: sb, currentMap: map } = propsRef.current;
      const layout = MAP_LAYOUTS[map.id] || MAP_LAYOUTS.woma;
      const viewW = viewSizeRef.current.w;
      const viewH = viewSizeRef.current.h;

      let dt = rawDt;
      if (sim.hitStop > 0) {
        sim.hitStop -= rawDt;
        dt = rawDt * 0.15;
      }
      sim.time += dt;

      for (const sk of SKILLS) {
        if ((sim.cooldowns[sk.id] || 0) > 0) {
          sim.cooldowns[sk.id] = Math.max(0, sim.cooldowns[sk.id] - dt);
        }
      }
      sim.dashCooldown = Math.max(0, sim.dashCooldown - dt);
      sim.teleportCooldown = Math.max(0, sim.teleportCooldown - dt);
      sim.clueTimer = Math.max(0, sim.clueTimer - dt);
      sim.player.atkTimer = Math.max(0, sim.player.atkTimer - dt);
      sim.player.hitFlash = Math.max(0, sim.player.hitFlash - dt);
      sim.player.invulnTimer = Math.max(0, sim.player.invulnTimer - dt);
      if (sim.player.swingProgress > 0) {
        sim.player.swingProgress = Math.max(0, sim.player.swingProgress - dt * 5.5);
      }
      sim.shake = Math.max(0, sim.shake - dt * 28);

      sim.player.hp = Math.min(st.maxHp, sim.player.hp + st.maxHp * 0.012 * dt);
      sim.player.mp = Math.min(st.maxMp, sim.player.mp + 8 * dt);
      if (sim.player.hp < st.maxHp * 0.35 && prog.potions > 0) {
        actionsRef.current?.usePotion();
      }

      // Reveal Fog-of-War within 360px radius around player!
      const pCol = Math.floor(sim.player.x / FOG_CELL);
      const pRow = Math.floor(sim.player.y / FOG_CELL);
      for (let dr = -4; dr <= 4; dr++) {
        for (let dc = -4; dc <= 4; dc++) {
          if (dr * dr + dc * dc <= 17) {
            const rr = pRow + dr;
            const cc = pCol + dc;
            if (rr >= 0 && rr < FOG_ROWS && cc >= 0 && cc < FOG_COLS) {
              sim.fog[rr * FOG_COLS + cc] = 1;
            }
          }
        }
      }

      // Check Chests
      for (const ch of sim.chests) {
        if (ch.opened) {
          ch.respawnTimer -= dt;
          if (ch.respawnTimer <= 0) ch.opened = false;
          continue;
        }
        const dc = Math.hypot(ch.x - sim.player.x, ch.y - sim.player.y);
        if (dc < 42) {
          ch.opened = true;
          ch.respawnTimer = 45;
          soundEngine.playLootChime();
          spawnImpactSparks(ch.x, ch.y, '#fde047', 16);
          if (sim.boss && sim.boss.hp > 0) {
            sim.clueTimer = 20;
            addText(ch.x, ch.y - 36, '开启宝箱！获得教主罗盘方位(20秒)', '#fde047', 1.1, true);
          } else {
            addText(ch.x, ch.y - 36, '开启神秘宝箱！', '#fde047', 1.1, true);
          }
          sim.loots.push({
            id: `chg_${Date.now()}`,
            x: ch.x - 16,
            y: ch.y + 12,
            label: `${Math.round(map.goldReward * 0.4)} 金币`,
            rarity: 'legendary',
            kind: 'gold',
            amount: Math.round(map.goldReward * 0.4),
            spawnAt: sim.time,
          });
          sim.loots.push({
            id: `chs_${Date.now()}`,
            x: ch.x + 16,
            y: ch.y + 12,
            label: `强化石 ×2`,
            rarity: 'rare',
            kind: 'stone',
            amount: 2,
            spawnAt: sim.time,
          });
        }
      }

      // Boss Discovery within 480px
      if (sim.boss && sim.boss.hp > 0 && !sim.boss.discovered) {
        const dBoss = Math.hypot(sim.boss.x - sim.player.x, sim.boss.y - sim.player.y);
        if (dBoss < 480) {
          sim.boss.discovered = true;
          soundEngine.playBossSpawnHorn();
          addText(sim.player.x, sim.player.y - 45, `发现【${sim.boss.name}】！`, '#fde047', 1.25, true);
        }
      }

      // Movement
      let moveX = joystickRef.current.x;
      let moveY = joystickRef.current.y;
      if (sim.keys.has('w') || sim.keys.has('arrowup')) moveY -= 1;
      if (sim.keys.has('s') || sim.keys.has('arrowdown')) moveY += 1;
      if (sim.keys.has('a') || sim.keys.has('arrowleft')) moveX -= 1;
      if (sim.keys.has('d') || sim.keys.has('arrowright')) moveX += 1;

      const hasManualMove = Math.hypot(moveX, moveY) > 0.1;
      if (hasManualMove) {
        sim.clickTarget = null;
        const mag = Math.hypot(moveX, moveY);
        moveX /= Math.max(1, mag);
        moveY /= Math.max(1, mag);
      } else if (sim.clickTarget) {
        const dx = sim.clickTarget.x - sim.player.x;
        const dy = sim.clickTarget.y - sim.player.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          moveX = dx / d;
          moveY = dy / d;
        } else {
          sim.clickTarget = null;
        }
      } else if (prog.autoBattle) {
        if (sim.loots.length > 0) {
          const tl = sim.loots[0];
          const dx = tl.x - sim.player.x;
          const dy = tl.y - sim.player.y;
          const d = Math.hypot(dx, dy);
          if (d > 16) {
            moveX = dx / d;
            moveY = dy / d;
          }
        } else {
          const tgt = findNearestTarget(9999);
          let dodging = false;
          for (const tel of sim.telegraphs) {
            const dx = sim.player.x - tel.x;
            const dy = sim.player.y - tel.y;
            const d = Math.hypot(dx, dy);
            if (d < tel.radius + 10 && tel.elapsed / tel.duration > 0.4) {
              const ang = d > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
              moveX = Math.cos(ang);
              moveY = Math.sin(ang);
              dodging = true;
              break;
            }
          }

          if (!dodging && tgt) {
            if (tgt.dist > 82) {
              moveX = (tgt.x - sim.player.x) / tgt.dist;
              moveY = (tgt.y - sim.player.y) / tgt.dist;
            } else {
              const unlockedReady = SKILLS.find(
                (s) => prog.level >= s.unlockLevel && (sim.cooldowns[s.id] || 0) <= 0
              );
              if (unlockedReady) actionsRef.current?.castSkill(unlockedReady.id);
              else actionsRef.current?.basicAttack();
            }
          }
        }
      }

      if (Math.hypot(moveX, moveY) > 0.05) {
        const nextPos = resolveCircleObstacles(
          sim.player.x + moveX * st.moveSpeed * dt,
          sim.player.y + moveY * st.moveSpeed * dt,
          16,
          layout.obstacles
        );
        sim.player.x = nextPos.x;
        sim.player.y = nextPos.y;
        sim.player.facing = Math.atan2(moveY, moveX);
      }

      // Camera centers on player inside actual screen dimensions
      const targetCamX = Math.max(0, Math.min(WORLD_W - viewW, sim.player.x - viewW / 2));
      const targetCamY = Math.max(0, Math.min(WORLD_H - viewH, sim.player.y - viewH / 2));
      sim.camX += (targetCamX - sim.camX) * Math.min(1, dt * 10);
      sim.camY += (targetCamY - sim.camY) * Math.min(1, dt * 10);

      sim.player.dashTrail = sim.player.dashTrail
        .map((tr) => ({ ...tr, alpha: tr.alpha - dt * 3 }))
        .filter((tr) => tr.alpha > 0);

      // Update Normal Mobs & Elites
      for (const m of sim.mobs) {
        if (m.hp <= 0) {
          m.respawnTimer -= dt;
          if (m.respawnTimer <= 0) {
            m.x = m.homeX;
            m.y = m.homeY;
            m.hp = m.maxHp;
          }
          continue;
        }
        m.hitFlash = Math.max(0, m.hitFlash - dt);
        m.stunTimer = Math.max(0, m.stunTimer - dt);
        m.atkTimer = Math.max(0, m.atkTimer - dt);

        if (m.stunTimer <= 0) {
          const dx = sim.player.x - m.x;
          const dy = sim.player.y - m.y;
          const dist = Math.hypot(dx, dy);
          const aggroRange = m.isElite ? 340 : 280;
          if (dist < aggroRange) {
            if (dist > 60) {
              const spd = m.isElite ? 108 : 92;
              const np = resolveCircleObstacles(
                m.x + (dx / dist) * spd * dt,
                m.y + (dy / dist) * spd * dt,
                16,
                layout.obstacles
              );
              m.x = np.x;
              m.y = np.y;
            } else if (m.atkTimer <= 0) {
              m.atkTimer = m.isElite ? 1.55 : 1.75;
              applyDamageToPlayer(m.atk, false);
            }
          }
        }
      }

      // Update Boss
      if (sim.boss && sim.boss.hp > 0) {
        const b = sim.boss;
        b.hitFlash = Math.max(0, b.hitFlash - dt);
        b.attackAnim = Math.max(0, b.attackAnim - dt * 3.5);
        b.stunTimer = Math.max(0, b.stunTimer - dt);

        if (b.isArmorBroken) {
          b.armorBreakTimer -= dt;
          if (b.armorBreakTimer <= 0) {
            b.isArmorBroken = false;
            b.armor = Math.round(b.maxArmor * 0.45);
            addText(b.x, b.y - 55, 'BOSS重整护甲！', '#38bdf8', 1.0);
          }
        }

        const dx = sim.player.x - b.x;
        const dy = sim.player.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (b.stunTimer <= 0 && (b.discovered || dist < 440)) {
          if (dist > 82) {
            const bSpd = b.isSiegeLord ? 125 : 100;
            const np = resolveCircleObstacles(
              b.x + (dx / dist) * bSpd * dt,
              b.y + (dy / dist) * bSpd * dt,
              24,
              layout.obstacles
            );
            b.x = np.x;
            b.y = np.y;
          } else {
            sim.bossAttackTimer -= dt;
            if (sim.bossAttackTimer <= 0) {
              sim.bossAttackTimer = b.isSiegeLord ? 1.4 : 1.75;
              b.attackAnim = 1;
              applyDamageToPlayer(b.isSiegeLord ? 520 : map.bossAtk, false);
            }
          }

          sim.bossTelegraphTimer -= dt;
          if (sim.bossTelegraphTimer <= 0 && dist < 440) {
            sim.bossTelegraphTimer = b.isSiegeLord ? 4.0 : 5.2;
            sim.telegraphs.push({
              id: `tel_${Date.now()}`,
              x: sim.player.x,
              y: sim.player.y,
              radius: b.isSiegeLord ? 105 : 88,
              elapsed: 0,
              duration: 1.35,
              damageMultiplier: 2.2,
              label: b.isSiegeLord ? '皇城天罚 · 闪避' : '狂暴重击 · 闪避',
            });
          }
        }
      }

      const nextTelegraphs: BossTelegraph[] = [];
      for (const tel of sim.telegraphs) {
        tel.elapsed += dt;
        if (tel.elapsed >= tel.duration) {
          sim.effects.push({
            id: `bo_${Date.now()}`,
            kind: 'boss_aoe',
            x: tel.x,
            y: tel.y,
            tx: tel.x,
            ty: tel.y,
            angle: 0,
            life: 0.35,
            maxLife: 0.35,
            color: '#ef4444',
            radius: tel.radius,
          });
          const dist = Math.hypot(sim.player.x - tel.x, sim.player.y - tel.y);
          if (dist <= tel.radius && sim.boss) {
            const baseAtk = sim.boss.isSiegeLord ? 520 : map.bossAtk;
            applyDamageToPlayer(baseAtk * tel.damageMultiplier, true);
          }
        } else {
          nextTelegraphs.push(tel);
        }
      }
      sim.telegraphs = nextTelegraphs;

      const remainingLoot: GroundLoot[] = [];
      for (const loot of sim.loots) {
        const dist = Math.hypot(loot.x - sim.player.x, loot.y - sim.player.y);
        if (dist < 46) {
          propsRef.current.onPickupLoot({ kind: loot.kind, item: loot.item, amount: loot.amount });
          soundEngine.playLootChime();
          addText(loot.x, loot.y - 10, `拾取 ${loot.label}`, RARITY_META[loot.rarity].color, 0.95);
        } else {
          remainingLoot.push(loot);
        }
      }
      sim.loots = remainingLoot;

      sim.effects = sim.effects.map((e) => ({ ...e, life: e.life - dt })).filter((e) => e.life > 0);
      sim.particles = sim.particles
        .map((pt) => ({
          ...pt,
          x: pt.x + pt.vx * dt,
          y: pt.y + pt.vy * dt,
          vy: pt.type === 'shard' ? pt.vy + 260 * dt : pt.vy,
          rotation: (pt.rotation || 0) + (pt.vRot || 0) * dt,
          life: pt.life - dt,
        }))
        .filter((pt) => pt.life > 0);
      sim.texts = sim.texts.map((t) => ({ ...t, y: t.y + t.vy * dt, life: t.life - dt })).filter((t) => t.life > 0);

      // Update shared Minimap data ref
      minimapDataRef.current = {
        obstacles: layout.obstacles,
        rooms: layout.rooms,
        fog: sim.fog,
        playerX: sim.player.x,
        playerY: sim.player.y,
        mobs: sim.mobs,
        chests: sim.chests,
        boss: sim.boss,
        loots: sim.loots,
        clueActive: sim.clueTimer > 0,
      };

      // Render Full-Viewport Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const targetW = Math.round(viewW * dpr);
          const targetH = Math.round(viewH * dpr);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          ctx.save();
          ctx.scale(dpr, dpr);

          const shakeX = sim.shake > 0.2 ? (Math.random() - 0.5) * sim.shake : 0;
          const shakeY = sim.shake > 0.2 ? (Math.random() - 0.5) * sim.shake : 0;

          drawWorldBackground(
            ctx,
            sim.camX - shakeX,
            sim.camY - shakeY,
            viewW,
            viewH,
            bgCacheRef.current[map.id] || null,
            map.themeColor
          );

          ctx.save();
          ctx.translate(-sim.camX + shakeX, -sim.camY + shakeY);

          drawRoomFloorLabels(ctx, layout.rooms);
          drawObstacles(ctx, layout.obstacles, map.themeColor, sim.time);
          drawChests(ctx, sim.chests, sim.time);
          drawTelegraphs(ctx, sim.telegraphs);
          drawGroundLoot(ctx, sim.loots, sim.time);

          for (const m of sim.mobs) drawMob(ctx, m);

          const bossAngle =
            sim.boss && sim.boss.hp > 0
              ? Math.atan2(sim.boss.y - sim.player.y, sim.boss.x - sim.player.x)
              : 0;

          const renderPlayerObj: RenderPlayer = {
            x: sim.player.x,
            y: sim.player.y,
            facing: sim.player.facing,
            hp: sim.player.hp,
            maxHp: st.maxHp,
            armor: sim.player.armor,
            maxArmor: st.maxArmor,
            swingProgress: sim.player.swingProgress,
            dashTrail: sim.player.dashTrail,
            weaponTier: prog.equipped.weapon?.tier || 1,
            weaponRarity: prog.equipped.weapon?.rarity || 'common',
            armorTier: prog.equipped.armor?.tier || 1,
            armorRarity: prog.equipped.armor?.rarity || 'common',
            wingLevel: prog.wingLevel,
            isLord: sb.isLord,
            isArmorBroken: sim.player.isArmorBroken,
            hitFlash: sim.player.hitFlash,
            invulnTimer: sim.player.invulnTimer,
            clueTimer: sim.clueTimer,
            bossAngle,
          };

          if (sim.boss && sim.boss.y < sim.player.y) {
            drawBoss(ctx, sim.boss, sim.time);
            drawPlayer(ctx, renderPlayerObj, sim.time);
          } else {
            drawPlayer(ctx, renderPlayerObj, sim.time);
            if (sim.boss) drawBoss(ctx, sim.boss, sim.time);
          }

          drawEffects(ctx, sim.effects);
          drawParticles(ctx, sim.particles);
          drawFloatingTexts(ctx, sim.texts);

          ctx.restore();

          // Soft atmospheric exploration vignette
          const vig = ctx.createRadialGradient(
            viewW / 2,
            viewH / 2,
            Math.min(viewW, viewH) * 0.25,
            viewW / 2,
            viewH / 2,
            Math.max(viewW, viewH) * 0.72
          );
          vig.addColorStop(0, 'rgba(0,0,0,0)');
          vig.addColorStop(1, 'rgba(4,5,10,0.52)');
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, viewW, viewH);

          ctx.restore();
        }
      }

      snapTimer += rawDt;
      if (snapTimer >= 0.1) {
        snapTimer = 0;

        let activeTarget: ActiveTargetInfo | null = null;
        if (sim.boss && sim.boss.hp > 0 && sim.boss.discovered) {
          activeTarget = {
            name: sim.boss.name,
            level: sim.boss.level,
            isBoss: true,
            isElite: false,
            hp: Math.round(sim.boss.hp),
            maxHp: sim.boss.maxHp,
            armor: Math.round(sim.boss.armor),
            maxArmor: sim.boss.maxArmor,
            isArmorBroken: sim.boss.isArmorBroken,
          };
        } else {
          const nearMob = findNearestTarget(340);
          if (nearMob?.mob) {
            activeTarget = {
              name: nearMob.mob.name,
              level: map.bossLevel - 4,
              isBoss: false,
              isElite: nearMob.mob.isElite,
              hp: Math.round(nearMob.mob.hp),
              maxHp: nearMob.mob.maxHp,
              armor: 0,
              maxArmor: 0,
              isArmorBroken: false,
            };
          }
        }

        let exploredCells = 0;
        for (let i = 0; i < sim.fog.length; i++) if (sim.fog[i]) exploredCells++;

        propsRef.current.onSnapshot({
          playerHp: Math.round(sim.player.hp),
          playerMaxHp: st.maxHp,
          playerMp: Math.round(sim.player.mp),
          playerMaxMp: st.maxMp,
          playerArmor: Math.round(sim.player.armor),
          playerMaxArmor: st.maxArmor,
          playerArmorBroken: sim.player.isArmorBroken,
          currentRoomName: getRoomNameAt(map.id, sim.player.x, sim.player.y),
          exploredPct: Math.round((exploredCells / sim.fog.length) * 100),
          clueRemaining: Math.ceil(sim.clueTimer),
          activeTarget,
          dashCooldown: sim.dashCooldown,
          teleportCooldown: sim.teleportCooldown,
          skillCooldowns: { ...sim.cooldowns },
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    const applyDamageToPlayer = (rawAtk: number, heavyArmorShred: boolean) => {
      const sim = simRef.current;
      if (sim.player.invulnTimer > 0) {
        addText(sim.player.x, sim.player.y - 26, '闪避！', '#38bdf8', 0.95);
        return;
      }

      const { stats: st, sabak: sb } = propsRef.current;
      const mitigated = Math.max(6, Math.round(rawAtk - st.def * 0.45));
      sim.player.hitFlash = 0.12;

      if (!sim.player.isArmorBroken && sim.player.armor > 0) {
        const armorLoss = Math.round(mitigated * (heavyArmorShred ? 2.5 : 1.35));
        sim.player.armor = Math.max(0, sim.player.armor - armorLoss);
        if (sim.player.armor <= 0) {
          sim.player.isArmorBroken = true;
          soundEngine.playArmorShatter();
          spawnArmorShards(sim.player.x, sim.player.y, '#fbbf24', 18);
          addText(sim.player.x, sim.player.y - 45, '护甲碎裂·爆衣狂暴！', '#fb7185', 1.2, true);
        }
      }

      const hpDmg = sim.player.isArmorBroken ? Math.round(mitigated * 1.15) : Math.round(mitigated * 0.65);
      sim.player.hp = Math.max(0, sim.player.hp - hpDmg);
      addText(sim.player.x, sim.player.y - 24, `-${hpDmg}`, '#f87171', 0.95);

      if (sim.player.hp <= 0) {
        if (sb.siegeActive) propsRef.current.onSiegeFail();
        const layout = MAP_LAYOUTS[propsRef.current.currentMap.id] || MAP_LAYOUTS.woma;
        sim.player.hp = st.maxHp;
        sim.player.armor = st.maxArmor;
        sim.player.isArmorBroken = false;
        sim.player.x = layout.playerSpawn.x;
        sim.player.y = layout.playerSpawn.y;
        addText(sim.player.x, sim.player.y - 30, '返回入口满血复活！', '#38bdf8', 1.15, true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [joystickRef, minimapDataRef]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const vx = e.clientX - rect.left;
    const vy = e.clientY - rect.top;
    simRef.current.clickTarget = {
      x: simRef.current.camX + vx,
      y: simRef.current.camY + vy,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handleCanvasPointerDown}
      className="w-full h-full block cursor-crosshair touch-none select-none"
    />
  );
};
