import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Compass, Crosshair, MapPin, X } from 'lucide-react';
import { MAPS } from '../game/data';
import { drawMinimapToCanvas, MinimapRenderData } from '../game/renderer';
import { BossRuntimeState } from '../game/types';

interface FullMapModalProps {
  currentMapId: string;
  currentRoomName: string;
  playerLevel: number;
  combatPower: number;
  bossStates: Record<string, BossRuntimeState>;
  minimapDataRef: React.MutableRefObject<MinimapRenderData | null>;
  onSelectMap: (mapId: string) => void;
  onToggleReminder: (mapId: string) => void;
  onClose: () => void;
}

export const FullMapModal: React.FC<FullMapModalProps> = ({
  currentMapId,
  currentRoomName,
  playerLevel,
  combatPower,
  bossStates,
  minimapDataRef,
  onSelectMap,
  onToggleReminder,
  onClose,
}) => {
  const [tab, setTab] = useState<'dungeon' | 'world'>('dungeon');
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentMap = MAPS.find((m) => m.id === currentMapId) || MAPS[0];

  useEffect(() => {
    if (tab !== 'dungeon') return;
    let raf = 0;
    const render = (now: number) => {
      const c = mapCanvasRef.current;
      const data = minimapDataRef.current;
      if (c && data) {
        const ctx = c.getContext('2d');
        if (ctx) {
          drawMinimapToCanvas(ctx, c.width, c.height, data, now / 1000, true);
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [tab, minimapDataRef]);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-amber-500/30 bg-[#10131c] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                玛法地图与BOSS刷新雷达
              </h2>
              <div className="text-xs text-slate-400">
                当前位置：{currentMap.name} · {currentRoomName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭地图"
            className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-3 flex gap-2 border-b border-white/5 pb-3">
          <button
            type="button"
            onClick={() => setTab('dungeon')}
            className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-colors ${
              tab === 'dungeon'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            当前区域探险全图（战争迷雾）
          </button>
          <button
            type="button"
            onClick={() => setTab('world')}
            className={`min-h-[40px] flex-1 rounded-xl text-xs font-bold transition-colors ${
              tab === 'world'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/70 text-slate-300 hover:text-white'
            }`}
          >
            四大BOSS地图与刷新倒计时
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'dungeon' ? (
            <div className="space-y-3">
              <div className="w-full aspect-[14/9] rounded-xl overflow-hidden border border-amber-500/35 bg-black">
                <canvas
                  ref={mapCanvasRef}
                  width={560}
                  height={360}
                  className="w-full h-full block"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400">● 玩家位置</span>
                  <span className="text-yellow-300">■ 神秘宝箱(含BOSS方位)</span>
                  <span className="text-orange-400">● 精英/小怪</span>
                  <span className="text-rose-400">● 已发现BOSS</span>
                </div>
                <span className="text-slate-400">
                  走入房间或开启宝箱可驱散迷雾并获取BOSS方位！
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAPS.map((map) => {
                const state = bossStates[map.id];
                const isCurrent = map.id === currentMapId;
                const isUnlocked = playerLevel >= map.unlockLevel;
                const isAlive = state?.isAlive ?? true;
                const remaining = Math.ceil(state?.respawnRemaining ?? 0);
                const reminderOn = state?.reminderEnabled ?? true;
                const powerOk = combatPower >= map.recommendedPower * 0.75;

                return (
                  <div
                    key={map.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-amber-950/30 border-amber-500/60'
                        : 'bg-[#151924] border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-100">
                          {map.name} · <span className="text-amber-300">{map.bossName}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          解锁 Lv.{map.unlockLevel} ·{' '}
                          <span className={powerOk ? 'text-emerald-400' : 'text-rose-400'}>
                            推荐战力 {map.recommendedPower.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleReminder(map.id)}
                        className={`min-h-[36px] min-w-[36px] rounded-lg border flex items-center justify-center ${
                          reminderOn
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-800 border-white/10 text-slate-500'
                        }`}
                      >
                        {reminderOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono-num">
                      {!isUnlocked ? (
                        <span className="text-slate-500">需 Lv.{map.unlockLevel}</span>
                      ) : isAlive ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Crosshair className="w-3.5 h-3.5" />
                          BOSS已刷新
                        </span>
                      ) : (
                        <span className="text-amber-300 font-semibold">
                          刷新倒计时 {remaining}s
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={!isUnlocked || isCurrent}
                        onClick={() => {
                          onSelectMap(map.id);
                          onClose();
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:bg-slate-800 disabled:text-slate-500 flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {isCurrent ? '当前所在' : '传送前往'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
