import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Compass,
  Crown,
  Flame,
  Heart,
  Lock,
  MapPin,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  UserCheck,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { CharacterModal } from './components/CharacterModal';
import { FullMapModal } from './components/FullMapModal';
import { CanvasActions, GameCanvas, LiveCombatSnapshot } from './components/GameCanvas';
import { ItemDetailModal } from './components/ItemDetailModal';
import { SabakPanel } from './components/SabakPanel';
import { VirtualJoystick } from './components/VirtualJoystick';
import { soundEngine } from './game/audio';
import {
  calcExpToNext,
  computePlayerStats,
  createInitialProgress,
  getItemPower,
  MAPS,
  SKILLS,
} from './game/data';
import { drawMinimapToCanvas, MinimapRenderData } from './game/renderer';
import {
  BossRuntimeState,
  EquipSlot,
  EquipmentItem,
  FloatingAlert,
  PlayerProgress,
  SabakState,
  SkillDef,
  StatAllocations,
} from './game/types';

const SAVE_KEY = 'legend_boss_rush_save_v3';

function createInitialBossStates(): Record<string, BossRuntimeState> {
  const rec: Record<string, BossRuntimeState> = {};
  for (const m of MAPS) {
    rec[m.id] = {
      mapId: m.id,
      isAlive: true,
      respawnRemaining: 0,
      reminderEnabled: true,
      kills: 0,
    };
  }
  return rec;
}

function createInitialSabak(): SabakState {
  return {
    isLord: false,
    lordName: '虚位以待',
    siegeActive: false,
    siegeTimeRemaining: 0,
    lastTaxCollectAt: Date.now(),
    doubleDropUntil: 0,
    sabakTokens: 0,
    siegeWins: 0,
  };
}

export default function App() {
  const [hasSave, setHasSave] = useState(false);
  const [screen, setScreen] = useState<'TITLE' | 'PLAYING'>('TITLE');

  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.progress) return parsed.progress;
      }
    } catch {
      // ignore
    }
    return createInitialProgress();
  });

  const [sabak, setSabak] = useState<SabakState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.sabak) return { ...parsed.sabak, siegeActive: false, siegeTimeRemaining: 0 };
      }
    } catch {
      // ignore
    }
    return createInitialSabak();
  });

  const [currentMapId, setCurrentMapId] = useState<string>('woma');
  const [bossStates, setBossStates] = useState<Record<string, BossRuntimeState>>(
    createInitialBossStates
  );
  const [alerts, setAlerts] = useState<FloatingAlert[]>([]);
  const [openModal, setOpenModal] = useState<'none' | 'char' | 'map' | 'sabak'>('none');
  const [inspected, setInspected] = useState<{ item: EquipmentItem; isEquipped: boolean } | null>(null);

  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const actionsRef = useRef<CanvasActions | null>(null);
  const minimapDataRef = useRef<MinimapRenderData | null>(null);
  const hudMinimapRef = useRef<HTMLCanvasElement | null>(null);

  const stats = useMemo(
    () => computePlayerStats(progress, sabak.isLord),
    [progress, sabak.isLord]
  );

  const [snapshot, setSnapshot] = useState<LiveCombatSnapshot>(() => ({
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    playerMp: stats.maxMp,
    playerMaxMp: stats.maxMp,
    playerArmor: stats.maxArmor,
    playerMaxArmor: stats.maxArmor,
    playerArmorBroken: false,
    currentRoomName: '沃玛神殿入口',
    exploredPct: 12,
    clueRemaining: 0,
    activeTarget: null,
    dashCooldown: 0,
    teleportCooldown: 0,
    skillCooldowns: { fire_slash: 0, thunder: 0, sun_beam: 0, meteor_dash: 0 },
  }));

  useEffect(() => {
    try {
      if (localStorage.getItem(SAVE_KEY)) setHasSave(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    soundEngine.enabled = progress.soundEnabled;
  }, [progress.soundEnabled]);

  useEffect(() => {
    if (screen !== 'PLAYING') return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ progress, sabak }));
      setHasSave(true);
    } catch {
      // ignore
    }
  }, [progress, sabak, screen]);

  // Live HUD Minimap Render Loop (15fps lightweight sync)
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const id = setInterval(() => {
      const c = hudMinimapRef.current;
      const data = minimapDataRef.current;
      if (c && data) {
        const ctx = c.getContext('2d');
        if (ctx) drawMinimapToCanvas(ctx, c.width, c.height, data, performance.now() / 1000, false);
      }
    }, 80);
    return () => clearInterval(id);
  }, [screen]);

  const currentMap = useMemo(
    () => MAPS.find((m) => m.id === currentMapId) || MAPS[0],
    [currentMapId]
  );

  const pushAlert = useCallback((alert: Omit<FloatingAlert, 'id' | 'timestamp'>) => {
    const id = `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setAlerts((prev) => [{ ...alert, id, timestamp: Date.now() }, ...prev].slice(0, 3));
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5500);
  }, []);

  // Keyboard shortcut M for Map, C for Character
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 'm') setOpenModal((prev) => (prev === 'map' ? 'none' : 'map'));
      else if (k === 'c' || k === 'b') setOpenModal((prev) => (prev === 'char' ? 'none' : 'char'));
      else if (k === 'escape') {
        setInspected(null);
        setOpenModal('none');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // 1-second global ticker for Boss Respawn Countdowns & Siege Timer
  useEffect(() => {
    if (screen !== 'PLAYING') return;

    const timer = setInterval(() => {
      setBossStates((prev) => {
        let changed = false;
        const next: Record<string, BossRuntimeState> = { ...prev };

        for (const map of MAPS) {
          const st = next[map.id];
          if (!st || st.isAlive) continue;
          changed = true;
          const rem = Math.max(0, st.respawnRemaining - 1);

          if (rem === 4 && st.reminderEnabled && progress.level >= map.unlockLevel) {
            pushAlert({
              mapId: map.id,
              bossName: map.bossName,
              mapName: map.name,
              type: 'soon',
              message: `${map.name} · ${map.bossName} 将于 4 秒后刷新！`,
            });
          }

          if (rem <= 0) {
            next[map.id] = { ...st, isAlive: true, respawnRemaining: 0 };
            if (st.reminderEnabled && progress.level >= map.unlockLevel) {
              soundEngine.playBossSpawnHorn();
              pushAlert({
                mapId: map.id,
                bossName: map.bossName,
                mapName: map.name,
                type: 'spawn',
                message: `【${map.bossName}】已在 ${map.name} 刷新！`,
              });
            }
          } else {
            next[map.id] = { ...st, respawnRemaining: rem };
          }
        }
        return changed ? next : prev;
      });

      setSabak((prev) => {
        if (!prev.siegeActive) return prev;
        const nextRem = prev.siegeTimeRemaining - 1;
        if (nextRem <= 0) {
          pushAlert({
            mapId: 'sabak',
            bossName: '沙巴克幻影城主',
            mapName: '沙巴克皇宫',
            type: 'lord',
            message: '攻城时间耗尽，请提升战力后再次申请攻城！',
          });
          return { ...prev, siegeActive: false, siegeTimeRemaining: 0 };
        }
        return { ...prev, siegeTimeRemaining: nextRem };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, progress.level, pushAlert]);

  const handleSelectMap = useCallback(
    (mapId: string) => {
      const m = MAPS.find((x) => x.id === mapId);
      if (!m || progress.level < m.unlockLevel) return;
      if (sabak.siegeActive) {
        setSabak((prev) => ({ ...prev, siegeActive: false, siegeTimeRemaining: 0 }));
      }
      setCurrentMapId(mapId);
    },
    [progress.level, sabak.siegeActive]
  );

  const handleToggleReminder = useCallback((mapId: string) => {
    setBossStates((prev) => ({
      ...prev,
      [mapId]: { ...prev[mapId], reminderEnabled: !prev[mapId].reminderEnabled },
    }));
  }, []);

  const applyExpGain = useCallback(
    (prev: PlayerProgress, expGain: number, extraPotions = 0, isBoss = false): PlayerProgress => {
      let lv = prev.level;
      let exp = prev.exp + expGain;
      let expNext = prev.expToNext;
      let gainedPoints = 0;

      while (exp >= expNext && lv < 80) {
        exp -= expNext;
        lv += 1;
        gainedPoints += 5;
        expNext = calcExpToNext(lv);
      }

      if (gainedPoints > 0) {
        const unlockedSkill = SKILLS.find((s) => s.unlockLevel === lv);
        pushAlert({
          mapId: currentMapId,
          bossName: `Lv.${lv}`,
          mapName: '人物升级',
          type: 'level',
          message: unlockedSkill
            ? `恭喜升至 Lv.${lv}！解锁新技能【${unlockedSkill.name}】并获 +${gainedPoints} 潜能点！`
            : `恭喜升至 Lv.${lv}！获得 +${gainedPoints} 自由潜能点！`,
        });
      }

      return {
        ...prev,
        level: lv,
        exp,
        expToNext: expNext,
        statPoints: (prev.statPoints || 0) + gainedPoints,
        potions: Math.min(99, prev.potions + extraPotions),
        totalBossKills: prev.totalBossKills + (isBoss ? 1 : 0),
      };
    },
    [currentMapId, pushAlert]
  );

  const handleBossKilled = useCallback(
    (mapId: string, wasArmorBroken: boolean, isSiegeLord: boolean) => {
      const map = MAPS.find((m) => m.id === mapId) || MAPS[0];

      if (isSiegeLord) {
        setSabak((prev) => ({
          ...prev,
          isLord: true,
          lordName: progress.name,
          siegeActive: false,
          siegeTimeRemaining: 0,
          siegeWins: prev.siegeWins + 1,
          lastTaxCollectAt: Date.now(),
        }));
        setProgress((prev) => ({
          ...prev,
          ingots: prev.ingots + 300,
          stones: prev.stones + 30,
          totalBossKills: prev.totalBossKills + 1,
        }));
        soundEngine.playBossSpawnHorn();
        pushAlert({
          mapId: 'sabak',
          bossName: '沙巴克城主',
          mapName: '沙巴克皇宫',
          type: 'lord',
          message: '恭喜登基【沙巴克城主】！全属性 +30% 光环已激活！',
        });
        return;
      }

      setBossStates((prev) => ({
        ...prev,
        [mapId]: {
          ...prev[mapId],
          isAlive: false,
          respawnRemaining: map.respawnSeconds,
          kills: prev[mapId].kills + 1,
        },
      }));

      const expGain = Math.round(map.expReward * (wasArmorBroken ? 1.25 : 1.0));
      setProgress((prev) => applyExpGain(prev, expGain, 2, true));
    },
    [progress.name, pushAlert, applyExpGain]
  );

  const handleMobKilled = useCallback(
    (mapId: string, isElite: boolean) => {
      const map = MAPS.find((m) => m.id === mapId) || MAPS[0];
      const expGain = isElite ? map.eliteExp : map.mobExp;
      setProgress((prev) => applyExpGain(prev, expGain, isElite ? 1 : 0, false));
    },
    [applyExpGain]
  );

  const handlePickupLoot = useCallback(
    (loot: { kind: 'item' | 'gold' | 'stone' | 'token'; item?: EquipmentItem; amount?: number }) => {
      if (loot.kind === 'gold') {
        setProgress((prev) => ({ ...prev, gold: prev.gold + (loot.amount || 0) }));
      } else if (loot.kind === 'stone') {
        setProgress((prev) => ({ ...prev, stones: prev.stones + (loot.amount || 0) }));
      } else if (loot.kind === 'token') {
        setSabak((prev) => ({ ...prev, sabakTokens: prev.sabakTokens + (loot.amount || 1) }));
      } else if (loot.kind === 'item' && loot.item) {
        const dropped = loot.item;
        setProgress((prev) => {
          const currentEq = prev.equipped[dropped.slot];
          const isBetter = !currentEq || getItemPower(dropped) > getItemPower(currentEq);
          if (isBetter) {
            pushAlert({
              mapId: currentMapId,
              bossName: dropped.name,
              mapName: '背包',
              type: 'loot',
              message: `拾取更高战力神装【${dropped.name}】！点击「角色·背包」查看穿戴`,
            });
          }
          return {
            ...prev,
            inventory: [dropped, ...prev.inventory].slice(0, 40),
          };
        });
      }
    },
    [currentMapId, pushAlert]
  );

  const handleAllocateStat = (key: keyof StatAllocations, amount: number) => {
    setProgress((prev) => {
      if (prev.statPoints < amount) return prev;
      const cur = prev.allocations || { str: 0, vit: 0, agi: 0 };
      return {
        ...prev,
        statPoints: prev.statPoints - amount,
        allocations: { ...cur, [key]: cur[key] + amount },
      };
    });
  };

  const handleAutoAllocateStats = () => {
    setProgress((prev) => {
      if (prev.statPoints <= 0) return prev;
      const pts = prev.statPoints;
      const strAdd = Math.ceil(pts * 0.5);
      const vitAdd = Math.floor(pts * 0.3);
      const agiAdd = pts - strAdd - vitAdd;
      const cur = prev.allocations || { str: 0, vit: 0, agi: 0 };
      return {
        ...prev,
        statPoints: 0,
        allocations: {
          str: cur.str + strAdd,
          vit: cur.vit + vitAdd,
          agi: cur.agi + agiAdd,
        },
      };
    });
  };

  const handleEquip = (item: EquipmentItem) => {
    setProgress((prev) => {
      const old = prev.equipped[item.slot];
      const nextInv = prev.inventory.filter((x) => x.uid !== item.uid);
      if (old) nextInv.unshift(old);
      return {
        ...prev,
        equipped: { ...prev.equipped, [item.slot]: item },
        inventory: nextInv.slice(0, 40),
      };
    });
  };

  const handleEnhanceSlot = (slot: EquipSlot) => {
    setProgress((prev) => {
      const item = prev.equipped[slot];
      if (!item || item.enhanceLevel >= 15) return prev;
      const cost = (item.enhanceLevel + 1) * 3;
      if (prev.stones < cost) return prev;
      return {
        ...prev,
        stones: prev.stones - cost,
        equipped: {
          ...prev.equipped,
          [slot]: { ...item, enhanceLevel: item.enhanceLevel + 1 },
        },
      };
    });
  };

  const handleEnhanceFromModal = (target: EquipmentItem, isEquipped: boolean) => {
    if (target.enhanceLevel >= 15) return;
    const cost = (target.enhanceLevel + 1) * 3;
    setProgress((prev) => {
      if (prev.stones < cost) return prev;
      const updated = { ...target, enhanceLevel: target.enhanceLevel + 1 };
      setInspected({ item: updated, isEquipped });
      if (isEquipped) {
        return {
          ...prev,
          stones: prev.stones - cost,
          equipped: { ...prev.equipped, [target.slot]: updated },
        };
      }
      return {
        ...prev,
        stones: prev.stones - cost,
        inventory: prev.inventory.map((i) => (i.uid === target.uid ? updated : i)),
      };
    });
  };

  const handleToggleLock = (target: EquipmentItem, isEquipped: boolean) => {
    const updated = { ...target, locked: !target.locked };
    setInspected({ item: updated, isEquipped });
    setProgress((prev) => {
      if (isEquipped) {
        return { ...prev, equipped: { ...prev.equipped, [target.slot]: updated } };
      }
      return {
        ...prev,
        inventory: prev.inventory.map((i) => (i.uid === target.uid ? updated : i)),
      };
    });
  };

  const handleRecycleOne = (target: EquipmentItem) => {
    if (target.locked) return;
    setProgress((prev) => ({
      ...prev,
      gold: prev.gold + target.tier * 350,
      stones: prev.stones + target.tier * 2,
      inventory: prev.inventory.filter((i) => i.uid !== target.uid),
    }));
  };

  const handleRecycleAll = () => {
    setProgress((prev) => {
      const toRecycle = prev.inventory.filter((i) => !i.locked);
      if (toRecycle.length === 0) return prev;
      let bonusGold = 0;
      let bonusStones = 0;
      for (const it of toRecycle) {
        bonusGold += it.tier * 350;
        bonusStones += it.tier * 2;
      }
      return {
        ...prev,
        gold: prev.gold + bonusGold,
        stones: prev.stones + bonusStones,
        inventory: prev.inventory.filter((i) => i.locked),
      };
    });
  };

  const handleUpgradeWing = () => {
    setProgress((prev) => {
      if (prev.wingLevel >= 8) return prev;
      const cost = prev.wingLevel * 12;
      if (prev.stones < cost) return prev;
      return {
        ...prev,
        stones: prev.stones - cost,
        wingLevel: prev.wingLevel + 1,
      };
    });
  };

  const handleRebirth = () => {
    setProgress((prev) => {
      const req = 25 + prev.rebirth * 10;
      if (prev.level < req || prev.rebirth >= 5) return prev;
      return {
        ...prev,
        rebirth: prev.rebirth + 1,
        stones: prev.stones + 15,
        statPoints: (prev.statPoints || 0) + 15,
      };
    });
  };

  const handleStartSiege = () => {
    setCurrentMapId('sabak');
    setSabak((prev) => ({
      ...prev,
      siegeActive: true,
      siegeTimeRemaining: 90,
      sabakTokens: Math.max(0, prev.sabakTokens - (prev.sabakTokens > 0 ? 1 : 0)),
    }));
    setOpenModal('none');
    soundEngine.playBossSpawnHorn();
    pushAlert({
      mapId: 'sabak',
      bossName: '沙巴克幻影城主',
      mapName: '沙巴克皇宫',
      type: 'lord',
      message: '沙巴克攻城战打响！90秒内击败幻影城主即可加冕！',
    });
  };

  const handleCollectTax = () => {
    const now = Date.now();
    const pending = Math.min(500, Math.floor((now - sabak.lastTaxCollectAt) / 5000) * 15);
    if (pending <= 0) return;
    setSabak((prev) => ({ ...prev, lastTaxCollectAt: now }));
    setProgress((prev) => ({ ...prev, ingots: prev.ingots + pending }));
  };

  const handleActivateDoubleDrop = () => {
    setSabak((prev) => ({ ...prev, doubleDropUntil: Date.now() + 60000 }));
    pushAlert({
      mapId: currentMapId,
      bossName: '城主诏书',
      mapName: '全服',
      type: 'lord',
      message: '城主诏令：全服开启 60 秒双倍神装爆率狂欢！',
    });
  };

  const handleResetGame = () => {
    localStorage.removeItem(SAVE_KEY);
    setProgress(createInitialProgress());
    setSabak(createInitialSabak());
    setBossStates(createInitialBossStates());
    setCurrentMapId('woma');
    setHasSave(false);
    setScreen('PLAYING');
  };

  // TITLE SCREEN
  if (screen === 'TITLE') {
    return (
      <div className="min-h-screen bg-[#08090d] text-slate-100 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(217, 119, 6, 0.25), transparent 60%), radial-gradient(circle at 80% 80%, rgba(185, 28, 28, 0.2), transparent 50%)',
          }}
        />

        <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-[#11141d]/90 backdrop-blur-md p-6 sm:p-10 shadow-2xl">
          <div className="text-center">
            <div className="text-xs tracking-widest text-amber-400 font-semibold">
              全屏沉浸 · 迷宫探宝 · 传奇成长版
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-600 mt-2">
              烈焰霸业 · 传奇BOSS传
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              全屏实景迷宫探索：从小怪刷级、潜能加点与技能逐步解锁成长，深入战争迷雾开启宝箱寻找BOSS踪迹，破甲爆衣激战四大教主，夺取沙巴克城主！
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
            {[
              { icon: Compass, title: '迷雾大地图寻BOSS', desc: '开宝箱·打精英寻罗盘线索' },
              { icon: Sparkles, title: '真实升级与解锁', desc: '金光升级·潜能加点·技能进阶' },
              { icon: Flame, title: '破甲爆衣与闪避', desc: '护甲减伤·碎甲爆装双倍掉' },
              { icon: Crown, title: '沙巴克城主争霸', desc: '金龙皇冠·税收特权诏书' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 text-center"
              >
                <f.icon className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-100">{f.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('PLAYING')}
              className="min-h-[48px] w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] whitespace-nowrap"
            >
              {hasSave ? `继续征战 (Lv.${progress.level})` : '进入玛法大陆'}
            </button>

            {hasSave && (
              <button
                type="button"
                onClick={handleResetGame}
                className="min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                重新开局
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentBossState = bossStates[currentMapId];
  const expPct = Math.min(100, Math.round((progress.exp / Math.max(1, progress.expToNext)) * 100));
  const hasBetterGearInBag = progress.inventory.some((item) => {
    const cur = progress.equipped[item.slot];
    return !cur || getItemPower(item) > getItemPower(cur);
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06070b] text-slate-100 select-none">
      {/* 100% Full-Screen Live World Canvas */}
      <GameCanvas
        currentMap={currentMap}
        bossRuntime={currentBossState}
        stats={stats}
        progress={progress}
        sabak={sabak}
        joystickRef={joystickRef}
        actionsRef={actionsRef}
        minimapDataRef={minimapDataRef}
        onSnapshot={setSnapshot}
        onBossKilled={handleBossKilled}
        onMobKilled={handleMobKilled}
        onPickupLoot={handlePickupLoot}
        onBossArmorBreakCount={() =>
          setProgress((p) => ({ ...p, armorBreaksTriggered: p.armorBreaksTriggered + 1 }))
        }
        onConsumePotion={() => {
          if (progress.potions <= 0) return false;
          setProgress((p) => ({ ...p, potions: Math.max(0, p.potions - 1) }));
          return true;
        }}
        onRepairArmorCost={() => {
          if (progress.gold < 100) return false;
          setProgress((p) => ({ ...p, gold: p.gold - 100 }));
          return true;
        }}
        onSiegeFail={() =>
          setSabak((prev) => ({ ...prev, siegeActive: false, siegeTimeRemaining: 0 }))
        }
        onStatusBanner={(msg) =>
          pushAlert({
            mapId: currentMapId,
            bossName: '提示',
            mapName: currentMap.name,
            type: 'soon',
            message: msg,
          })
        }
      />

      {/* FLOATING HUD LAYER */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
        {/* TOP HUD ROW */}
        <div className="flex items-start justify-between gap-2">
          {/* TOP-LEFT: Character Vital Plate + Menu Shortcuts */}
          <div className="pointer-events-auto flex flex-col gap-2 max-w-[235px] sm:max-w-[270px]">
            <div className="rounded-2xl bg-[#0c0f17]/85 backdrop-blur-md border border-amber-500/30 p-2.5 shadow-xl">
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-bold truncate">
                  {sabak.isLord && <Crown className="w-3.5 h-3.5 text-yellow-300 shrink-0" />}
                  <span className="text-amber-300 font-mono-num">Lv.{progress.level}</span>
                  {progress.rebirth > 0 && (
                    <span className="text-rose-400 font-mono-num">{progress.rebirth}转</span>
                  )}
                  <span className="text-slate-100 truncate">{progress.name}</span>
                </div>
                <span className="text-[11px] font-mono-num text-emerald-400 font-bold shrink-0">
                  战力 {stats.combatPower.toLocaleString()}
                </span>
              </div>

              {/* HP Bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-slate-900/90 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-100"
                    style={{
                      width: `${Math.max(0, (snapshot.playerHp / Math.max(1, snapshot.playerMaxHp)) * 100)}%`,
                    }}
                  />
                </div>
                {/* Armor Integrity Bar */}
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-900/90 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        snapshot.playerArmorBroken ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                      style={{
                        width: `${snapshot.playerArmorBroken ? 100 : Math.max(0, (snapshot.playerArmor / Math.max(1, snapshot.playerMaxArmor)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono-num text-cyan-300 shrink-0">
                    {snapshot.playerArmorBroken ? '爆衣+35%暴' : `甲 ${snapshot.playerArmor}`}
                  </span>
                </div>
              </div>

              {/* Currency Row */}
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono-num text-slate-300 mt-1.5 pt-1.5 border-t border-white/10">
                <span>金 {progress.gold.toLocaleString()}</span>
                <span className="text-amber-300">元宝 {progress.ingots}</span>
                <span className="text-sky-300">石 {progress.stones}</span>
              </div>
            </div>

            {/* 3 Primary Floating Menu Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOpenModal('char')}
                className="relative min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#0c0f17]/88 hover:bg-[#161b2a] border border-white/15 backdrop-blur-md text-xs font-bold text-slate-100 flex items-center gap-1 whitespace-nowrap shadow-lg"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>角色·背包</span>
                {(progress.statPoints > 0 || hasBetterGearInBag) && (
                  <span className="ml-0.5 text-[10px] font-mono-num text-emerald-400 font-black">
                    {progress.statPoints > 0 ? `+${progress.statPoints}` : '新'}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpenModal('map')}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#0c0f17]/88 hover:bg-[#161b2a] border border-white/15 backdrop-blur-md text-xs font-bold text-slate-100 flex items-center gap-1 whitespace-nowrap shadow-lg"
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>地图</span>
              </button>

              <button
                type="button"
                onClick={() => setOpenModal('sabak')}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#0c0f17]/88 hover:bg-[#161b2a] border border-amber-500/35 backdrop-blur-md text-xs font-bold text-amber-200 flex items-center gap-1 whitespace-nowrap shadow-lg"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-300" />
                <span>沙巴克</span>
              </button>
            </div>
          </div>

          {/* TOP-CENTER: Active Target HP/Armor Frame + Compass/Respawn Notice */}
          <div className="hidden md:flex flex-col items-center gap-1.5 max-w-sm w-full">
            {snapshot.activeTarget ? (
              <div className="pointer-events-auto w-full rounded-xl bg-[#0c0f17]/88 backdrop-blur-md border border-rose-500/40 px-3.5 py-2 shadow-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-100">
                    {snapshot.activeTarget.isBoss
                      ? `BOSS · ${snapshot.activeTarget.name}`
                      : snapshot.activeTarget.isElite
                      ? `精英 · ${snapshot.activeTarget.name}`
                      : snapshot.activeTarget.name}
                    {snapshot.activeTarget.isArmorBroken && (
                      <span className="text-rose-400 ml-1.5">[破甲爆衣]</span>
                    )}
                  </span>
                  <span className="font-mono-num text-slate-300">
                    {snapshot.activeTarget.hp.toLocaleString()} /{' '}
                    {snapshot.activeTarget.maxHp.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-100"
                    style={{
                      width: `${Math.max(
                        0,
                        (snapshot.activeTarget.hp / Math.max(1, snapshot.activeTarget.maxHp)) * 100
                      )}%`,
                    }}
                  />
                </div>
                {snapshot.activeTarget.maxArmor > 0 && (
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-100"
                      style={{
                        width: `${Math.max(
                          0,
                          (snapshot.activeTarget.armor / Math.max(1, snapshot.activeTarget.maxArmor)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-[#0c0f17]/75 backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs text-slate-300">
                {sabak.siegeActive ? (
                  <span className="text-rose-300 font-bold font-mono-num">
                    沙巴克攻城战剩余 {Math.ceil(sabak.siegeTimeRemaining)}s
                  </span>
                ) : snapshot.clueRemaining > 0 ? (
                  <span className="text-amber-300 font-semibold font-mono-num">
                    罗盘已锁定教主方位 ({snapshot.clueRemaining}s) · 顺金箭前行
                  </span>
                ) : currentBossState?.isAlive ? (
                  <span>探索迷雾房间或开宝箱，搜寻 {currentMap.bossName}</span>
                ) : (
                  <span className="text-amber-300 font-mono-num">
                    {currentMap.bossName} 刷新倒计时 {Math.ceil(currentBossState?.respawnRemaining || 0)}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* TOP-RIGHT: Interactive Fog-of-War Minimap + Quick Controls */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => setOpenModal('map')}
              title="点击展开探险大地图 (快捷键 M)"
              className="group relative w-[134px] sm:w-[164px] rounded-xl overflow-hidden border border-amber-500/45 bg-[#090b10]/90 shadow-xl text-left"
            >
              <canvas
                ref={hudMinimapRef}
                width={164}
                height={104}
                className="w-full h-[84px] sm:h-[104px] block"
              />
              <div className="px-2 py-1 bg-black/75 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-300 truncate">{snapshot.currentRoomName}</span>
                <span className="font-mono-num text-slate-400 shrink-0">
                  {snapshot.exploredPct}%
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProgress((p) => ({ ...p, autoBattle: !p.autoBattle }))}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md transition-colors whitespace-nowrap ${
                  progress.autoBattle
                    ? 'bg-emerald-500/25 border border-emerald-400/55 text-emerald-200'
                    : 'bg-[#0c0f17]/85 border border-white/15 text-slate-300 hover:text-white'
                }`}
              >
                {progress.autoBattle ? '自动寻怪:开' : '手动操作'}
              </button>

              <button
                type="button"
                aria-label={progress.soundEnabled ? '关闭音效' : '开启音效'}
                onClick={() => setProgress((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg bg-[#0c0f17]/85 border border-white/15 text-slate-300 hover:text-white backdrop-blur-md"
              >
                {progress.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Target Bar (when fighting on narrow viewport) */}
        {snapshot.activeTarget && (
          <div className="md:hidden mx-auto w-full max-w-xs rounded-xl bg-[#0c0f17]/88 backdrop-blur-md border border-rose-500/40 px-3 py-1.5 shadow-lg">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-slate-100 truncate">
                {snapshot.activeTarget.name}
                {snapshot.activeTarget.isArmorBroken ? ' [爆衣]' : ''}
              </span>
              <span className="font-mono-num text-slate-300 shrink-0">
                {snapshot.activeTarget.hp.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-rose-500"
                style={{
                  width: `${Math.max(
                    0,
                    (snapshot.activeTarget.hp / Math.max(1, snapshot.activeTarget.maxHp)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* BOTTOM HUD ROW: Virtual Joystick (Left) + EXP Bar (Center) + Skill Cluster (Right) */}
        <div className="flex items-end justify-between gap-2 pb-4 sm:pb-5">
          {/* Bottom-Left: Touch Joystick */}
          <div className="pointer-events-auto">
            <VirtualJoystick joystickRef={joystickRef} />
          </div>

          {/* Bottom-Right: RPG Action Cluster */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {/* Utility Row: Dodge, Teleport Stone, Potion, Repair if broken */}
            <div className="flex items-center gap-1.5">
              {snapshot.playerArmorBroken && (
                <button
                  type="button"
                  onClick={() => actionsRef.current?.repairArmor()}
                  className="min-h-[38px] px-2.5 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg"
                >
                  <Shield className="w-3.5 h-3.5" />
                  修甲
                </button>
              )}

              <button
                type="button"
                onClick={() => actionsRef.current?.dashDodge()}
                className="relative min-h-[42px] min-w-[46px] px-2 rounded-xl bg-[#0c0f17]/88 border border-sky-400/40 backdrop-blur-md flex flex-col items-center justify-center active:scale-95 overflow-hidden shadow-lg"
              >
                <Wind className="w-4 h-4 text-sky-300" />
                <span className="text-[10px] font-bold text-sky-200">闪避</span>
                {snapshot.dashCooldown > 0.05 && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono-num font-bold text-sky-300">
                    {snapshot.dashCooldown.toFixed(1)}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => actionsRef.current?.randomTeleport()}
                className="relative min-h-[42px] min-w-[46px] px-2 rounded-xl bg-[#0c0f17]/88 border border-purple-400/40 backdrop-blur-md flex flex-col items-center justify-center active:scale-95 overflow-hidden shadow-lg"
              >
                <Compass className="w-4 h-4 text-purple-300" />
                <span className="text-[10px] font-bold text-purple-200">随机石</span>
                {snapshot.teleportCooldown > 0.05 && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono-num font-bold text-purple-300">
                    {snapshot.teleportCooldown.toFixed(1)}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => actionsRef.current?.usePotion()}
                className="min-h-[42px] min-w-[46px] px-2 rounded-xl bg-[#0c0f17]/88 border border-emerald-400/40 backdrop-blur-md flex flex-col items-center justify-center active:scale-95 shadow-lg"
              >
                <Heart className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-200 font-mono-num">
                  药({progress.potions})
                </span>
              </button>
            </div>

            {/* Skill Row + Big Attack */}
            <div className="flex items-end gap-1.5">
              {SKILLS.map((sk) => {
                const locked = progress.level < sk.unlockLevel;
                const cd = snapshot.skillCooldowns[sk.id] || 0;
                const isReady = !locked && cd <= 0.05;
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => actionsRef.current?.castSkill(sk.id as SkillDef['id'])}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center active:scale-95 transition-transform overflow-hidden shadow-lg ${
                      locked
                        ? 'bg-slate-900/80 border-white/10 text-slate-500'
                        : 'bg-[#0e121d]/90 border-white/20 hover:border-amber-400/60 text-slate-100'
                    }`}
                  >
                    {locked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                        <span className="text-[10px] font-mono-num">Lv.{sk.unlockLevel}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mb-0.5" style={{ color: sk.color }} />
                        <span className="text-[11px] font-bold">{sk.shortName}</span>
                      </>
                    )}
                    {!locked && !isReady && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono-num font-bold text-amber-300">
                        {cd.toFixed(1)}
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => actionsRef.current?.basicAttack()}
                className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-2 border-yellow-200/70 text-slate-950 font-black flex flex-col items-center justify-center shadow-xl shadow-amber-500/25 active:scale-90 transition-transform"
              >
                <Swords className="w-5 h-5" />
                <span className="text-[11px]">普攻</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sleek Full-Width Bottom EXP Progress Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#080a10]/90 border-t border-white/10 px-3 py-1 flex items-center gap-3 text-[10px] font-mono-num">
          <span className="text-amber-300 font-bold shrink-0">Lv.{progress.level}</span>
          <div className="h-1.5 flex-1 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-200"
              style={{ width: `${expPct}%` }}
            />
          </div>
          <span className="text-slate-300 shrink-0">
            经验 {progress.exp.toLocaleString()} / {progress.expToNext.toLocaleString()} ({expPct}%)
          </span>
        </div>
      </div>

      {/* Floating Toast Alerts (Boss Respawn / Level-Up / Rare Loot) */}
      {alerts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md flex flex-col gap-2 pointer-events-none">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="pointer-events-auto rounded-xl bg-[#141824]/95 border border-amber-400/60 shadow-2xl px-3.5 py-2 flex items-center justify-between gap-2 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-100 truncate">{al.message}</span>
              </div>
              {al.type === 'spawn' && al.mapId !== currentMapId && (
                <button
                  type="button"
                  onClick={() => handleSelectMap(al.mapId)}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  传送
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Character Growth & Gear Modal */}
      {openModal === 'char' && (
        <CharacterModal
          progress={progress}
          stats={stats}
          isArmorBroken={snapshot.playerArmorBroken}
          onClose={() => setOpenModal('none')}
          onAllocateStat={handleAllocateStat}
          onAutoAllocateStats={handleAutoAllocateStats}
          onEquip={handleEquip}
          onEnhance={handleEnhanceSlot}
          onInspectItem={(item, isEquipped) => setInspected({ item, isEquipped })}
          onRecycleAll={handleRecycleAll}
          onUpgradeWing={handleUpgradeWing}
          onRebirth={handleRebirth}
          onRepairArmor={() => actionsRef.current?.repairArmor()}
        />
      )}

      {/* Full Dungeon Map & Boss Radar Modal */}
      {openModal === 'map' && (
        <FullMapModal
          currentMapId={currentMapId}
          currentRoomName={snapshot.currentRoomName}
          playerLevel={progress.level}
          combatPower={stats.combatPower}
          bossStates={bossStates}
          minimapDataRef={minimapDataRef}
          onSelectMap={handleSelectMap}
          onToggleReminder={handleToggleReminder}
          onClose={() => setOpenModal('none')}
        />
      )}

      {/* Sabak Castle Lord Modal */}
      {openModal === 'sabak' && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenModal('none')}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-amber-500/35 bg-[#10131c] p-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpenModal('none')}
              aria-label="关闭沙巴克面板"
              className="absolute top-3.5 right-3.5 min-h-[36px] min-w-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <SabakPanel
              sabak={sabak}
              playerLevel={progress.level}
              combatPower={stats.combatPower}
              onStartSiege={handleStartSiege}
              onCollectTax={handleCollectTax}
              onActivateDoubleDrop={handleActivateDoubleDrop}
            />
          </div>
        </div>
      )}

      {/* Equipment Detail & Comparison Inspector */}
      {inspected && (
        <ItemDetailModal
          item={inspected.item}
          isEquipped={inspected.isEquipped}
          currentlyEquippedInSlot={progress.equipped[inspected.item.slot]}
          stones={progress.stones}
          onClose={() => setInspected(null)}
          onEquip={handleEquip}
          onEnhance={handleEnhanceFromModal}
          onToggleLock={handleToggleLock}
          onRecycleOne={handleRecycleOne}
        />
      )}
    </div>
  );
}
