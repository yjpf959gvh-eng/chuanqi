import React from 'react';
import { Hammer, Lock, Shield, Swords, Trash2, Unlock, X } from 'lucide-react';
import {
  getItemEffectiveStats,
  getItemPower,
  RARITY_META,
} from '../game/data';
import { EquipSlot, EquipmentItem } from '../game/types';

interface ItemDetailModalProps {
  item: EquipmentItem;
  isEquipped: boolean;
  currentlyEquippedInSlot: EquipmentItem | null;
  stones: number;
  onClose: () => void;
  onEquip?: (item: EquipmentItem) => void;
  onEnhance?: (item: EquipmentItem, isEquipped: boolean) => void;
  onToggleLock?: (item: EquipmentItem, isEquipped: boolean) => void;
  onRecycleOne?: (item: EquipmentItem) => void;
}

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: '武器 · 神兵',
  armor: '衣服 · 战甲',
  necklace: '项链 · 战链',
  ring: '戒指 · 圣戒',
};

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isEquipped,
  currentlyEquippedInSlot,
  stones,
  onClose,
  onEquip,
  onEnhance,
  onToggleLock,
  onRecycleOne,
}) => {
  const meta = RARITY_META[item.rarity];
  const eff = getItemEffectiveStats(item);
  const power = getItemPower(item);
  const enhCost = (item.enhanceLevel + 1) * 3;
  const canEnhance = item.enhanceLevel < 15 && stones >= enhCost;

  const currentPower = currentlyEquippedInSlot ? getItemPower(currentlyEquippedInSlot) : 0;
  const powerDiff = isEquipped ? 0 : power - currentPower;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-[#111520] p-5 shadow-2xl relative"
        style={{ borderColor: meta.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭装备详情"
          className="absolute top-3.5 right-3.5 min-h-[36px] min-w-[36px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-10">
          <div
            className="w-14 h-14 rounded-xl border flex items-center justify-center shrink-0"
            style={{ backgroundColor: meta.bg, borderColor: meta.border }}
          >
            {item.slot === 'weapon' ? (
              <Swords className="w-7 h-7" style={{ color: meta.color }} />
            ) : (
              <Shield className="w-7 h-7" style={{ color: meta.color }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400">
              {SLOT_LABELS[item.slot]} · T{item.tier}阶 · {meta.label}
            </div>
            <h3 className="text-lg font-bold truncate mt-0.5" style={{ color: meta.color }}>
              {item.name}
              {item.enhanceLevel > 0 && (
                <span className="text-amber-300 ml-1.5 font-mono-num">+{item.enhanceLevel}</span>
              )}
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono-num mt-1">
              <span className="text-slate-300">评分 {power.toLocaleString()}</span>
              {!isEquipped && powerDiff !== 0 && (
                <span className={powerDiff > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  ({powerDiff > 0 ? `+${powerDiff.toLocaleString()}` : powerDiff.toLocaleString()})
                </span>
              )}
              {isEquipped && <span className="text-amber-300">当前已穿戴</span>}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 mt-3 leading-relaxed border-t border-white/10 pt-3">
          {item.description}
        </p>

        {/* Stats Breakdown */}
        <div className="mt-3 rounded-xl bg-black/35 border border-white/5 p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono-num">
          <div className="flex justify-between">
            <span className="text-slate-400">攻击力</span>
            <span className="text-slate-100 font-semibold">
              {eff.atk}
              {eff.atk > item.atk && (
                <span className="text-amber-400 ml-1">(+{eff.atk - item.atk})</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">防御力</span>
            <span className="text-slate-100 font-semibold">
              {eff.def}
              {eff.def > item.def && (
                <span className="text-amber-400 ml-1">(+{eff.def - item.def})</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">生命值</span>
            <span className="text-slate-100 font-semibold">
              {eff.hp}
              {eff.hp > item.hp && (
                <span className="text-amber-400 ml-1">(+{eff.hp - item.hp})</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">护甲韧性</span>
            <span className="text-cyan-300 font-semibold">
              {eff.armor}
              {eff.armor > item.armor && (
                <span className="text-amber-400 ml-1">(+{eff.armor - item.armor})</span>
              )}
            </span>
          </div>
          <div className="flex justify-between col-span-2 pt-1 border-t border-white/5">
            <span className="text-slate-400">暴击几率</span>
            <span className="text-amber-300 font-semibold">+{eff.critRate}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {!isEquipped && onEquip && (
            <button
              type="button"
              onClick={() => {
                onEquip(item);
                onClose();
              }}
              className="min-h-[42px] col-span-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
            >
              穿戴此装备
            </button>
          )}

          {onEnhance && (
            <button
              type="button"
              disabled={!canEnhance}
              onClick={() => onEnhance(item, isEquipped)}
              className={`min-h-[40px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                item.enhanceLevel >= 15
                  ? 'bg-amber-500/20 text-amber-300'
                  : canEnhance
                  ? 'bg-sky-600 hover:bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              {item.enhanceLevel >= 15 ? '已强化满级' : `强化 +1 (需${enhCost}石)`}
            </button>
          )}

          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(item, isEquipped)}
              className={`min-h-[40px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                item.locked
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {item.locked ? '已锁定 (防误拆)' : '锁定装备'}
            </button>
          )}

          {!isEquipped && onRecycleOne && (
            <button
              type="button"
              disabled={!!item.locked}
              onClick={() => {
                onRecycleOne(item);
                onClose();
              }}
              className="min-h-[40px] col-span-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/35 text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {item.locked
                ? '装备已锁定，解锁后可回收'
                : `回收分解 (+${item.tier * 350}金币, +${item.tier * 2}强化石)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
