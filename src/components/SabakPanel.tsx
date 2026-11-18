import React from 'react';
import { Coins, Crown, Flame, Swords } from 'lucide-react';
import { SabakState } from '../game/types';

interface SabakPanelProps {
  sabak: SabakState;
  playerLevel: number;
  combatPower: number;
  onStartSiege: () => void;
  onCollectTax: () => void;
  onActivateDoubleDrop: () => void;
}

export const SabakPanel: React.FC<SabakPanelProps> = ({
  sabak,
  playerLevel,
  combatPower,
  onStartSiege,
  onCollectTax,
  onActivateDoubleDrop,
}) => {
  const reqPower = 2500;
  const canApply = (combatPower >= reqPower || sabak.sabakTokens >= 1) && !sabak.siegeActive;
  const now = Date.now();
  const doubleActive = now < sabak.doubleDropUntil;
  const doubleSec = Math.max(0, Math.ceil((sabak.doubleDropUntil - now) / 1000));
  const pendingTax = Math.min(
    500,
    Math.floor((now - sabak.lastTaxCollectAt) / 5000) * 15
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* Imperial Castle Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/60 via-[#16131c] to-[#11131b] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-amber-300/80">沙巴克皇宫 · 至高荣耀</div>
            <h2 className="text-lg font-bold text-amber-300 font-display mt-0.5 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-300" />
              {sabak.isLord ? '现任城主：玛法战神 (你)' : `现任城主：${sabak.lordName}`}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          夺取沙巴克城主可激活全属性 +30% 帝皇光环、头顶金龙皇冠幻化、定时领取元宝税收，并可开启全服双倍神装爆率狂欢！
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-500/20 text-xs font-mono-num">
          <div>
            <span className="text-slate-400">当前战力：</span>
            <span className={combatPower >= reqPower ? 'text-emerald-400 font-bold' : 'text-amber-200 font-bold'}>
              {combatPower.toLocaleString()} / {reqPower.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400">沙巴克令牌：</span>
            <span className="text-yellow-300 font-bold">{sabak.sabakTokens} 枚</span>
          </div>
        </div>
      </div>

      {/* Siege Action */}
      {sabak.siegeActive ? (
        <div className="rounded-xl bg-rose-950/50 border border-rose-500/50 p-4 text-center">
          <div className="text-sm font-bold text-rose-200">
            沙巴克攻城战正在进行中！
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono-num mt-1">
            剩余时间 {Math.ceil(sabak.siegeTimeRemaining)}s
          </div>
          <div className="text-xs text-slate-300 mt-1">
            请在皇宫战场内击败「沙巴克幻影城主」即可登基称帝！
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canApply}
          onClick={onStartSiege}
          className={`min-h-[48px] w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            canApply
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Swords className="w-4 h-4" />
          {sabak.isLord
            ? '再战皇宫 · 巩固城主霸权'
            : canApply
            ? '申请攻城 · 争夺沙巴克城主'
            : `需战力 ${reqPower.toLocaleString()} 或 1枚沙巴克令牌 (当前Lv.${playerLevel})`}
        </button>
      )}

      {/* Lord Privileges */}
      {sabak.isLord && (
        <div className="rounded-xl bg-[#12151e] border border-amber-500/30 p-3.5 flex flex-col gap-2.5">
          <div className="text-xs font-bold text-amber-300">城主专属特权</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={pendingTax <= 0}
              onClick={onCollectTax}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45 whitespace-nowrap"
            >
              <Coins className="w-4 h-4 text-yellow-300" />
              领取城主税收 (+{pendingTax}元宝)
            </button>

            <button
              type="button"
              disabled={doubleActive}
              onClick={onActivateDoubleDrop}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-rose-600/25 hover:bg-rose-600/35 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              {doubleActive ? `双倍爆率狂欢中 (${doubleSec}s)` : '诏书：开启双倍爆率 (60s)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
