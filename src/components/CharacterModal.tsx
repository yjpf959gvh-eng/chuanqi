import React, { useState } from 'react';
import {
  ArrowUpCircle,
  Eye,
  Feather,
  Hammer,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  getItemEffectiveStats,
  getItemPower,
  RARITY_META,
  WING_NAMES,
} from '../game/data';
import {
  ComputedStats,
  EquipSlot,
  EquipmentItem,
  PlayerProgress,
  StatAllocations,
} from '../game/types';

interface CharacterModalProps {
  progress: PlayerProgress;
  stats: ComputedStats;
  isArmorBroken: boolean;
  onClose: () => void;
  onAllocateStat: (key: keyof StatAllocations, amount: number) => void;
  onAutoAllocateStats: () => void;
  onEquip: (item: EquipmentItem) => void;
  onEnhance: (slot: EquipSlot) => void;
  onInspectItem: (item: EquipmentItem, isEquipped: boolean) => void;
  onRecycleAll: () => void;
  onUpgradeWing: () => void;
  onRebirth: () => void;
  onRepairArmor: () => void;
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: '神兵',
  armor: '战甲',
  necklace: '项链',
  ring: '戒指',
};

export const CharacterModal: React.FC<CharacterModalProps> = ({
  progress,
  stats,
  isArmorBroken,
  onClose,
  onAllocateStat,
  onAutoAllocateStats,
  onEquip,
  onEnhance,
  onInspectItem,
  onRecycleAll,
  onUpgradeWing,
  onRebirth,
  onRepairArmor,
}) => {
  const [tab, setTab] = useState<'growth' | 'bag'>('growth');
  const wingCost = progress.wingLevel * 12;
  const rebirthReqLevel = 25 + progress.rebirth * 10;
  const canRebirth = progress.level >= rebirthReqLevel && progress.rebirth < 5;
  const recyclableCount = progress.inventory.filter((i) => !i.locked).length;
  const expPct = Math.min(100, Math.round((progress.exp / Math.max(1, progress.expToNext)) * 100));

  return (
    <div
      className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-amber-500/30 bg-[#10131c] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                角色成长与神装背包
              </h2>
              <div className="text-xs text-slate-400 font-mono-num">
                Lv.{progress.level} · {progress.rebirth}转 · 综合战力{' '}
                <span className="text-amber-300 font-bold">{stats.combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭角色面板"
            className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="px-5 pt-3 flex gap-2 border-b border-white/5 pb-3">
          <button
            type="button"
            onClick={() => setTab('growth')}
            className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-colors ${
              tab === 'growth'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            等级成长 · 潜能加点 {progress.statPoints > 0 ? `(+${progress.statPoints})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('bag')}
            className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-colors ${
              tab === 'bag'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            已穿戴神装与背包 ({progress.inventory.length}/40)
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'growth' ? (
            <>
              {/* Level & EXP Card */}
              <div className="rounded-xl bg-[#161a26] border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-amber-300">
                    当前等级 Lv.{progress.level} / 80
                  </span>
                  <span className="font-mono-num text-slate-300">
                    经验 {progress.exp.toLocaleString()} / {progress.expToNext.toLocaleString()} ({expPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  每升 1 级回满生命护甲并获得 5 点自由潜能点；Lv.3/5/8 依次解锁雷霆万钧、逐日剑法、十步火雨！
                </p>
              </div>

              {/* Free Stat Allocation */}
              <div className="rounded-xl bg-[#161a26] border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-100">潜能属性分配</div>
                    <div className="text-xs text-amber-300 font-mono-num">
                      可用潜能点：{progress.statPoints}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={progress.statPoints <= 0}
                    onClick={onAutoAllocateStats}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-40 whitespace-nowrap"
                  >
                    一键推荐加点
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      key: 'str' as const,
                      label: '力量 (物理攻击)',
                      val: progress.allocations?.str || 0,
                      desc: '每点 +6 攻击力',
                    },
                    {
                      key: 'vit' as const,
                      label: '体魄 (生存护甲)',
                      val: progress.allocations?.vit || 0,
                      desc: '每点 +45血 +25甲 +3防',
                    },
                    {
                      key: 'agi' as const,
                      label: '敏捷 (暴击攻速)',
                      val: progress.allocations?.agi || 0,
                      desc: '提升暴击率与出刀速度',
                    },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="rounded-xl bg-black/30 border border-white/5 p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{s.label}</div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                        <div className="text-sm font-bold text-amber-300 font-mono-num mt-1">
                          已加 {s.val} 点
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={progress.statPoints <= 0}
                        onClick={() => onAllocateStat(s.key, 1)}
                        className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 flex items-center justify-center disabled:opacity-35 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat Summary + Wings + Rebirth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#161a26] border border-white/10 p-3.5 space-y-2 text-xs font-mono-num">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-100 font-sans">当前战斗属性</span>
                    <button
                      type="button"
                      onClick={onRepairArmor}
                      className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 text-[11px] font-bold"
                    >
                      {isArmorBroken ? '修复爆衣(100金)' : '修满护甲'}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">攻击 / 防御</span>
                    <span>
                      {stats.atk.toLocaleString()} / {stats.def.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">生命 / 护甲</span>
                    <span>
                      {stats.maxHp.toLocaleString()} / {stats.maxArmor.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">暴击 / 暴伤</span>
                    <span className="text-amber-300">
                      {stats.critRate}% / {(stats.critDmg * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#161a26] border border-white/10 p-3 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Feather className="w-3.5 h-3.5 text-sky-400" />
                        绚丽羽翼
                      </div>
                      <div className="text-xs font-bold text-sky-300 mt-1 truncate">
                        {WING_NAMES[progress.wingLevel - 1]}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={progress.wingLevel >= 8 || progress.stones < wingCost}
                      onClick={onUpgradeWing}
                      className="min-h-[36px] w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      {progress.wingLevel >= 8 ? '神翼满阶' : `进阶(${wingCost}石)`}
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#161a26] border border-white/10 p-3 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        转生突破
                      </div>
                      <div className="text-xs font-bold text-amber-300 mt-1 font-mono-num">
                        {progress.rebirth} 转 / 5 转
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canRebirth}
                      onClick={onRebirth}
                      className="min-h-[36px] w-full rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold disabled:bg-slate-800 disabled:text-slate-500"
                    >
                      {progress.rebirth >= 5 ? '巅峰' : `Lv.${rebirthReqLevel}转生`}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Equipped 4 Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-amber-400" />
                    已穿戴神装（点击查看属性与对比）
                  </span>
                  <span className="text-xs text-sky-300 font-mono-num">
                    强化石：{progress.stones.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['weapon', 'armor', 'necklace', 'ring'] as EquipSlot[]).map((slot) => {
                    const item = progress.equipped[slot];
                    if (!item) return null;
                    const meta = RARITY_META[item.rarity];
                    const eff = getItemEffectiveStats(item);
                    const enhCost = (item.enhanceLevel + 1) * 3;
                    const canEnhance = item.enhanceLevel < 15 && progress.stones >= enhCost;
                    return (
                      <div
                        key={slot}
                        className="rounded-xl p-2.5 border flex items-center justify-between gap-2"
                        style={{ backgroundColor: meta.bg, borderColor: meta.border }}
                      >
                        <button
                          type="button"
                          onClick={() => onInspectItem(item, true)}
                          className="min-w-0 flex-1 text-left group"
                        >
                          <div
                            className="flex items-center gap-1.5 text-sm font-bold truncate"
                            style={{ color: meta.color }}
                          >
                            <span className="text-[11px] text-slate-300 font-normal">
                              {SLOT_LABELS[slot]}
                            </span>
                            <span className="truncate group-hover:underline">{item.name}</span>
                            {item.enhanceLevel > 0 && (
                              <span className="text-xs text-amber-300 font-mono-num">
                                +{item.enhanceLevel}
                              </span>
                            )}
                            <Eye className="w-3 h-3 text-slate-400 shrink-0" />
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5 font-mono-num">
                            攻+{eff.atk} · 血+{eff.hp} · 甲+{eff.armor}
                          </div>
                        </button>
                        <button
                          type="button"
                          disabled={!canEnhance}
                          onClick={() => onEnhance(slot)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:bg-slate-800 disabled:text-slate-500 flex items-center gap-1 shrink-0"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          {item.enhanceLevel >= 15 ? '满' : `+1(${enhCost})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bag */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">
                    背包列表 ({progress.inventory.length}/40)
                  </span>
                  <button
                    type="button"
                    disabled={recyclableCount === 0}
                    onClick={onRecycleAll}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/35 text-rose-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    一键回收({recyclableCount})
                  </button>
                </div>

                {progress.inventory.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-black/25 p-6 text-center text-xs text-slate-500">
                    暂无多余装备，探索地图开启宝箱、击杀精英与BOSS可爆出极品装备！
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {progress.inventory.map((item) => {
                      const meta = RARITY_META[item.rarity];
                      const equipped = progress.equipped[item.slot];
                      const isBetter = !equipped || getItemPower(item) > getItemPower(equipped);
                      return (
                        <div
                          key={item.uid}
                          className="rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2"
                          style={{ backgroundColor: meta.bg, borderColor: meta.border }}
                        >
                          <button
                            type="button"
                            onClick={() => onInspectItem(item, false)}
                            className="min-w-0 flex-1 text-left group"
                          >
                            <div
                              className="flex items-center gap-1 text-xs font-bold truncate"
                              style={{ color: meta.color }}
                            >
                              {item.locked && <Lock className="w-3 h-3 text-amber-300 shrink-0" />}
                              <span className="truncate group-hover:underline">{item.name}</span>
                              {item.enhanceLevel > 0 && <span>+{item.enhanceLevel}</span>}
                              {isBetter && (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-300 font-mono-num">
                              评分 {getItemPower(item).toLocaleString()} · 点击查看
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEquip(item)}
                            className="min-h-[34px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold shrink-0"
                          >
                            穿戴
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
