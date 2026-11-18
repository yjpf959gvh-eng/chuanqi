import { RARITY_META } from './data';
import { FOG_CELL, FOG_COLS, FOG_ROWS, WORLD_H, WORLD_W } from './worldMap';
import { EquipmentItem, MapObstacle, MapRoom, Rarity } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'shard' | 'smoke' | 'ring' | 'feather';
  rotation?: number;
  vRot?: number;
}

export interface SkillEffect {
  id: string;
  kind:
    | 'slash'
    | 'fire_slash'
    | 'thunder'
    | 'sun_beam'
    | 'meteor'
    | 'shatter_wave'
    | 'boss_aoe'
    | 'level_up';
  x: number;
  y: number;
  tx: number;
  ty: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
  isBanner?: boolean;
}

export interface GroundLoot {
  id: string;
  x: number;
  y: number;
  label: string;
  rarity: Rarity;
  kind: 'item' | 'gold' | 'stone' | 'token';
  item?: EquipmentItem;
  amount?: number;
  spawnAt: number;
}

export interface BossTelegraph {
  id: string;
  x: number;
  y: number;
  radius: number;
  elapsed: number;
  duration: number;
  damageMultiplier: number;
  label: string;
}

export interface RenderPlayer {
  x: number;
  y: number;
  facing: number;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  swingProgress: number;
  dashTrail: { x: number; y: number; alpha: number }[];
  weaponTier: number;
  weaponRarity: Rarity;
  armorTier: number;
  armorRarity: Rarity;
  wingLevel: number;
  isLord: boolean;
  isArmorBroken: boolean;
  hitFlash: number;
  invulnTimer: number;
  clueTimer: number;
  bossAngle: number;
}

export interface RenderBoss {
  x: number;
  y: number;
  bossId: string;
  name: string;
  title: string;
  level: number;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  isArmorBroken: boolean;
  armorBreakTimer: number;
  stunTimer: number;
  hitFlash: number;
  attackAnim: number;
  isSiegeLord?: boolean;
  discovered: boolean;
}

export interface RenderMob {
  id: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  name: string;
  isElite: boolean;
  hp: number;
  maxHp: number;
  atk: number;
  expReward: number;
  hitFlash: number;
  stunTimer: number;
  atkTimer: number;
  respawnTimer: number;
}

export interface RenderChest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  respawnTimer: number;
}

export function drawWorldBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  bgImage: HTMLImageElement | null,
  themeColor: string
) {
  ctx.fillStyle = '#07080d';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-camX, -camY);

  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const tileW = 680;
    const tileH = 440;
    const startCol = Math.max(0, Math.floor(camX / tileW));
    const endCol = Math.min(Math.ceil(WORLD_W / tileW), Math.ceil((camX + viewW) / tileW));
    const startRow = Math.max(0, Math.floor(camY / tileH));
    const endRow = Math.min(Math.ceil(WORLD_H / tileH), Math.ceil((camY + viewH) / tileH));

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        ctx.drawImage(bgImage, c * tileW, r * tileH, tileW, tileH);
      }
    }
    ctx.fillStyle = 'rgba(4, 6, 12, 0.34)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= WORLD_W; gx += 64) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, WORLD_H);
      ctx.stroke();
    }
    for (let gy = 0; gy <= WORLD_H; gy += 64) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(WORLD_W, gy);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, WORLD_W - 32, WORLD_H - 32);

  ctx.restore();
}

export function drawRoomFloorLabels(
  ctx: CanvasRenderingContext2D,
  rooms: MapRoom[]
) {
  ctx.save();
  ctx.font = '700 18px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(253, 224, 71, 0.14)';
  for (const r of rooms) {
    ctx.fillText(r.name, r.x + r.w / 2, r.y + r.h / 2);
  }
  ctx.restore();
}

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: MapObstacle[],
  themeColor: string,
  time: number
) {
  for (const ob of obstacles) {
    ctx.save();
    if (ob.kind === 'wall') {
      const grad = ctx.createLinearGradient(ob.x, ob.y, ob.x + ob.w, ob.y + ob.h);
      grad.addColorStop(0, '#1e2430');
      grad.addColorStop(1, '#0d1017');
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(217, 160, 40, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(ob.x + 4, ob.y + 4, ob.w - 8, 8);
    } else if (ob.kind === 'pillar') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w / 2, ob.y + ob.h + 4, ob.w * 0.45, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1b202b';
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ob.x, ob.y, ob.w, ob.h, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = themeColor + '44';
      ctx.beginPath();
      ctx.arc(ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const cx = ob.x + ob.w / 2;
      const cy = ob.y + ob.h / 2;
      const glowR = ob.w * (1.2 + Math.sin(time * 8 + cx) * 0.15);
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, glowR);
      glow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
      glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#291d18';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ob.w * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 7 + Math.sin(time * 12) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawChests(ctx: CanvasRenderingContext2D, chests: RenderChest[], time: number) {
  for (const ch of chests) {
    if (ch.opened) continue;
    ctx.save();
    ctx.translate(ch.x, ch.y);
    const glow = 26 + Math.sin(time * 4) * 5;
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, glow);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glow, 0, Math.PI * 2);
    ctx.fill();

    // Chest box
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.fillRect(-3, -3, 6, 7);

    ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('神秘宝箱', 0, -16);
    ctx.restore();
  }
}

export function drawTelegraphs(ctx: CanvasRenderingContext2D, telegraphs: BossTelegraph[]) {
  for (const t of telegraphs) {
    const progress = Math.min(1, t.elapsed / t.duration);
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.88)';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.14)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.36)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#fecaca';
    ctx.textAlign = 'center';
    ctx.fillText(t.label, t.x, t.y - t.radius - 6);
    ctx.restore();
  }
}

export function drawGroundLoot(
  ctx: CanvasRenderingContext2D,
  loots: GroundLoot[],
  time: number
) {
  for (const loot of loots) {
    const meta = RARITY_META[loot.rarity];
    const bob = Math.sin(time * 4 + loot.x) * 3;
    ctx.save();
    ctx.translate(loot.x, loot.y);

    if (loot.kind === 'item' || loot.kind === 'token') {
      const beamH = loot.rarity === 'mythic' || loot.rarity === 'lord' ? 95 : loot.rarity === 'legendary' ? 75 : 52;
      const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamH);
      beamGrad.addColorStop(0, meta.beamColor + 'aa');
      beamGrad.addColorStop(1, meta.beamColor + '00');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-5, -beamH, 10, beamH);

      ctx.strokeStyle = meta.beamColor;
      ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.25;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.translate(0, bob);
    ctx.fillStyle = loot.kind === 'gold' ? '#facc15' : meta.color;
    ctx.shadowColor = meta.beamColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    if (loot.kind === 'gold') {
      ctx.arc(0, -4, 6, 0, Math.PI * 2);
    } else {
      ctx.moveTo(0, -12);
      ctx.lineTo(8, -4);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, -4);
      ctx.closePath();
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(loot.label, 1, -17);
    ctx.fillStyle = loot.kind === 'gold' ? '#fde047' : meta.color;
    ctx.fillText(loot.label, 0, -18);
    ctx.restore();
  }
}

export function drawMob(ctx: CanvasRenderingContext2D, m: RenderMob) {
  if (m.hp <= 0) return;
  ctx.save();
  ctx.translate(m.x, m.y);
  const scale = m.isElite ? 1.08 : 0.85;
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (m.hitFlash > 0) ctx.filter = 'brightness(1.9)';

  ctx.fillStyle = m.isElite ? '#334155' : '#1e293b';
  ctx.strokeStyle = m.isElite ? '#f59e0b' : '#94a3b8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-13, -15, 26, 30, 6);
  ctx.fill();
  ctx.stroke();

  if (m.isElite) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-8, -16);
    ctx.lineTo(-14, -26);
    ctx.lineTo(-3, -18);
    ctx.moveTo(8, -16);
    ctx.lineTo(14, -26);
    ctx.lineTo(3, -18);
    ctx.fill();
  }

  ctx.fillStyle = m.isElite ? '#ef4444' : '#f97316';
  ctx.beginPath();
  ctx.arc(-4, -8, 2, 0, Math.PI * 2);
  ctx.arc(4, -8, 2, 0, Math.PI * 2);
  ctx.fill();

  if (m.stunTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -28, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.filter = 'none';

  const bw = m.isElite ? 54 : 40;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-bw / 2 - 1, -36, bw + 2, 6);
  ctx.fillStyle = m.isElite ? '#f97316' : '#ef4444';
  ctx.fillRect(-bw / 2, -35, bw * Math.max(0, m.hp / m.maxHp), 4);

  ctx.font = 'bold 10px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = m.isElite ? '#fed7aa' : '#cbd5e1';
  ctx.fillText(m.name, 0, -41);

  ctx.restore();
}

function getTierColors(tier: number, rarity: Rarity) {
  if (tier >= 6 || rarity === 'lord') {
    return { primary: '#fde047', secondary: '#f97316', glow: '#fef08a', cape: '#991b1b' };
  }
  if (tier === 5 || rarity === 'mythic') {
    return { primary: '#fb7185', secondary: '#38bdf8', glow: '#fda4af', cape: '#7f1d1d' };
  }
  if (tier === 4 || rarity === 'legendary') {
    return { primary: '#fbbf24', secondary: '#dc2626', glow: '#fcd34d', cape: '#7c2d12' };
  }
  if (tier === 3 || rarity === 'epic') {
    return { primary: '#c084fc', secondary: '#f59e0b', glow: '#e9d5ff', cape: '#4c1d95' };
  }
  if (tier === 2 || rarity === 'rare') {
    return { primary: '#38bdf8', secondary: '#10b981', glow: '#7dd3fc', cape: '#0f766e' };
  }
  return { primary: '#94a3b8', secondary: '#64748b', glow: '#cbd5e1', cape: '#334155' };
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: RenderPlayer, time: number) {
  for (const tr of p.dashTrail) {
    ctx.save();
    ctx.globalAlpha = tr.alpha * 0.35;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const armorCols = getTierColors(p.armorTier, p.armorRarity);
  const weaponCols = getTierColors(p.weaponTier, p.weaponRarity);
  const armorPct = p.maxArmor > 0 ? p.armor / p.maxArmor : 0;

  ctx.save();
  ctx.translate(p.x, p.y);

  // Boss Clue Compass Arrow orbiting player when Clue active!
  if (p.clueTimer > 0) {
    ctx.save();
    ctx.rotate(p.bossAngle);
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.lineTo(34, -7);
    ctx.lineTo(37, 0);
    ctx.lineTo(34, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (p.invulnTimer > 0) ctx.globalAlpha = 0.65;

  if (p.isLord) {
    ctx.save();
    ctx.rotate(time * 0.9);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 6, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (p.isArmorBroken) {
    ctx.save();
    const pulse = 24 + Math.sin(time * 14) * 4;
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, pulse);
    aura.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    aura.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
    aura.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.wingLevel >= 1) {
    const wingSpread = 16 + p.wingLevel * 4.5;
    const flap = Math.sin(time * 5) * 4;
    const wingColor =
      p.wingLevel >= 7 ? '#fde047' : p.wingLevel >= 5 ? '#f43f5e' : p.wingLevel >= 3 ? '#38bdf8' : '#f97316';
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = wingColor;
    ctx.shadowBlur = 12 + p.wingLevel * 2;
    for (const side of [-1, 1]) {
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(side * 4, -4);
      ctx.quadraticCurveTo(side * (wingSpread * 0.7), -24 - flap, side * wingSpread, -8 - flap * 0.5);
      ctx.quadraticCurveTo(side * (wingSpread * 0.65), 6, side * 5, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  const capeWave = Math.sin(time * 6) * 4;
  ctx.fillStyle = p.isArmorBroken ? '#7f1d1d' : armorCols.cape;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(10, -8);
  if (p.isArmorBroken) {
    ctx.lineTo(11 + capeWave, 15);
    ctx.lineTo(2, 10);
    ctx.lineTo(-4 + capeWave, 16);
    ctx.lineTo(-12, 11);
  } else {
    ctx.lineTo(14 + capeWave, 18);
    ctx.lineTo(0 + capeWave * 0.5, 22);
    ctx.lineTo(-14 + capeWave, 18);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (p.hitFlash > 0) ctx.filter = 'brightness(2)';

  if (p.isArmorBroken) {
    ctx.fillStyle = '#d6a37a';
    ctx.beginPath();
    ctx.roundRect(-9, -10, 18, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-9, -8);
    ctx.lineTo(9, 10);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -1, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const bodyGrad = ctx.createLinearGradient(-12, -12, 12, 14);
    bodyGrad.addColorStop(0, armorCols.primary);
    bodyGrad.addColorStop(1, armorCols.secondary);
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = armorCols.glow;
    ctx.shadowBlur = p.armorTier >= 3 ? 10 : 4;
    ctx.beginPath();
    ctx.roundRect(-11, -11, 22, 24, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (p.armorTier >= 2) {
      ctx.fillStyle = armorCols.glow;
      ctx.beginPath();
      ctx.ellipse(-13, -7, 6, 4.5, -0.35, 0, Math.PI * 2);
      ctx.ellipse(13, -7, 6, 4.5, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    if (armorPct <= 0.5) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-7, -7);
      ctx.lineTo(-1, -1);
      ctx.lineTo(-5, 6);
      ctx.moveTo(7, -5);
      ctx.lineTo(2, 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#f1c29b';
  ctx.beginPath();
  ctx.arc(0, -17, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.isArmorBroken ? '#1e293b' : armorCols.primary;
  ctx.beginPath();
  ctx.arc(0, -19, 8, Math.PI, Math.PI * 2);
  ctx.fill();

  if (p.isLord) {
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-7, -25);
    ctx.lineTo(-5, -33);
    ctx.lineTo(0, -28);
    ctx.lineTo(5, -33);
    ctx.lineTo(7, -25);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  ctx.save();
  const swingOffset = p.swingProgress > 0 ? Math.sin(p.swingProgress * Math.PI) * 1.9 - 0.85 : 0.4;
  ctx.rotate(p.facing + swingOffset);

  const wLen = 28 + p.weaponTier * 4;
  ctx.shadowColor = weaponCols.glow;
  ctx.shadowBlur = 8 + p.weaponTier * 3;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(10, -3, 7, 6);

  const bladeGrad = ctx.createLinearGradient(16, 0, 16 + wLen, 0);
  bladeGrad.addColorStop(0, '#ffffff');
  bladeGrad.addColorStop(0.45, weaponCols.primary);
  bladeGrad.addColorStop(1, weaponCols.secondary);
  ctx.fillStyle = bladeGrad;

  if (p.weaponTier === 2) {
    ctx.fillRect(16, -2, wLen * 0.75, 4);
    ctx.beginPath();
    ctx.arc(16 + wLen * 0.65, 0, 11, -1.2, 1.2);
    ctx.fill();
  } else if (p.weaponTier === 3) {
    ctx.fillRect(16, -2.5, wLen * 0.7, 5);
    ctx.beginPath();
    ctx.roundRect(16 + wLen * 0.6, -7, 13, 14, 3);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(16, -3.5);
    ctx.lineTo(16 + wLen - 7, -5.5);
    ctx.lineTo(16 + wLen, 0);
    ctx.lineTo(16 + wLen - 7, 5.5);
    ctx.lineTo(16, 3.5);
    ctx.closePath();
    ctx.fill();
  }

  if (p.weaponTier >= 4) {
    for (let i = 0; i < p.weaponTier - 2; i++) {
      const ang = time * 4 + (i * Math.PI * 2) / (p.weaponTier - 2);
      const ox = 22 + Math.cos(ang) * 14;
      const oy = Math.sin(ang) * 10;
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  if (p.isLord) {
    ctx.fillStyle = '#fde047';
    ctx.fillText('★ 沙巴克城主 ★', 0, -40);
  }
  if (p.isArmorBroken) {
    ctx.fillStyle = '#fb7185';
    ctx.fillText('爆衣狂暴', 0, p.isLord ? -53 : -36);
  }

  ctx.restore();
}

export function drawBoss(ctx: CanvasRenderingContext2D, b: RenderBoss, time: number) {
  ctx.save();
  ctx.translate(b.x, b.y);

  const scale = b.isSiegeLord ? 1.28 : 1.15;
  ctx.scale(scale, scale);

  const pulse = Math.sin(time * 4) * 3;
  const armorPct = b.maxArmor > 0 ? b.armor / b.maxArmor : 0;

  ctx.save();
  ctx.strokeStyle = b.isArmorBroken ? 'rgba(248, 113, 113, 0.8)' : 'rgba(234, 179, 8, 0.45)';
  ctx.lineWidth = b.isArmorBroken ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 26, 34 + pulse * 0.4, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 28, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (b.hitFlash > 0) ctx.filter = 'brightness(1.85)';

  const lunge = b.attackAnim > 0 ? Math.sin(b.attackAnim * Math.PI) * 8 : 0;
  ctx.translate(0, -lunge);

  const bossColors: Record<string, { shell: string; core: string; horns: string }> = {
    boss_woma: { shell: '#78350f', core: '#f59e0b', horns: '#fde047' },
    boss_zuma: { shell: '#064e3b', core: '#10b981', horns: '#fbbf24' },
    boss_crimson: { shell: '#7f1d1d', core: '#ef4444', horns: '#fca5a5' },
    boss_dragon: { shell: '#311042', core: '#eab308', horns: '#f43f5e' },
    boss_siege: { shell: '#713f12', core: '#fde047', horns: '#ef4444' },
  };
  const palette = bossColors[b.bossId] || bossColors.boss_woma;

  ctx.save();
  ctx.fillStyle = b.isArmorBroken ? '#ef4444' : palette.shell;
  ctx.globalAlpha = 0.85;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 10, -8);
    ctx.lineTo(s * 42, -32 + pulse);
    ctx.lineTo(s * 34, -4);
    ctx.lineTo(s * 40, 12);
    ctx.lineTo(s * 12, 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (b.isArmorBroken) {
    const coreGrad = ctx.createRadialGradient(0, -4, 3, 0, -4, 24);
    coreGrad.addColorStop(0, '#fef08a');
    coreGrad.addColorStop(0.5, '#ef4444');
    coreGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.roundRect(-18, -24, 36, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-19, 8, 38, 8);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -4, 11 + Math.sin(time * 12) * 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const shellGrad = ctx.createLinearGradient(-22, -26, 22, 22);
    shellGrad.addColorStop(0, palette.shell);
    shellGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = shellGrad;
    ctx.strokeStyle = palette.core;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, -26, 44, 46, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.horns;
    ctx.beginPath();
    ctx.moveTo(-22, -20);
    ctx.lineTo(-34, -30);
    ctx.lineTo(-18, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -20);
    ctx.lineTo(34, -30);
    ctx.lineTo(18, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.core;
    ctx.beginPath();
    ctx.arc(0, -4, 7, 0, Math.PI * 2);
    ctx.fill();

    if (armorPct <= 0.5) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -20);
      ctx.lineTo(-3, -6);
      ctx.lineTo(-12, 10);
      ctx.moveTo(15, -18);
      ctx.lineTo(4, -2);
      ctx.lineTo(13, 12);
      ctx.stroke();
    }
  }

  ctx.fillStyle = b.isArmorBroken ? '#991b1b' : '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -32, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.horns;
  ctx.beginPath();
  ctx.moveTo(-8, -38);
  ctx.lineTo(-20, -54);
  ctx.lineTo(-3, -42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -38);
  ctx.lineTo(20, -54);
  ctx.lineTo(3, -42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = b.isArmorBroken ? '#fef08a' : '#ef4444';
  ctx.beginPath();
  ctx.arc(-4.5, -32, 2.2, 0, Math.PI * 2);
  ctx.arc(4.5, -32, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (b.stunTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -46, 16, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.filter = 'none';

  const barW = 92;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-barW / 2 - 1, -69, barW + 2, 12);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-barW / 2, -68, barW * Math.max(0, b.hp / b.maxHp), 6);
  ctx.fillStyle = b.isArmorBroken ? '#f43f5e' : '#06b6d4';
  ctx.fillRect(-barW / 2, -61, barW * Math.max(0, b.armor / b.maxArmor), 3.5);

  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde047';
  const statusTag = b.isArmorBroken ? ' [破甲爆衣]' : '';
  ctx.fillText(`Lv.${b.level} ${b.name}${statusTag}`, 0, -75);

  ctx.restore();
}

export function drawEffects(ctx: CanvasRenderingContext2D, effects: SkillEffect[]) {
  for (const ef of effects) {
    const t = 1 - ef.life / ef.maxLife;
    const alpha = Math.max(0, ef.life / ef.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (ef.kind === 'level_up') {
      // Dramatic Golden Ascension Pillar!
      const pillarW = 46 * (1 - t * 0.4);
      const grad = ctx.createLinearGradient(ef.x - pillarW / 2, ef.y, ef.x + pillarW / 2, ef.y);
      grad.addColorStop(0, 'rgba(253, 224, 71, 0)');
      grad.addColorStop(0.5, 'rgba(253, 224, 71, 0.85)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(ef.x - pillarW / 2, ef.y - 340, pillarW, 360);

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ef.x, ef.y + 8, 54 * t, 22 * t, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ef.kind === 'slash' || ef.kind === 'fire_slash') {
      ctx.translate(ef.x, ef.y);
      ctx.rotate(ef.angle);
      const isFire = ef.kind === 'fire_slash';
      const r = ef.radius * (0.75 + t * 0.45);
      ctx.strokeStyle = ef.color;
      ctx.shadowColor = ef.color;
      ctx.shadowBlur = isFire ? 24 : 10;
      ctx.lineWidth = isFire ? 18 * (1 - t * 0.5) : 7 * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, r, -1.05, 1.05);
      ctx.stroke();
    } else if (ef.kind === 'thunder') {
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#7dd3fc';
      ctx.shadowBlur = 22;
      ctx.lineWidth = 4.5 * alpha;
      ctx.beginPath();
      let cx = ef.tx + (Math.random() - 0.5) * 14;
      let cy = ef.ty - 240;
      ctx.moveTo(cx, cy);
      for (let i = 1; i <= 6; i++) {
        cx = ef.tx + (i === 6 ? 0 : (Math.random() - 0.5) * 34);
        cy = ef.ty - 240 + i * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * alpha;
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ef.tx, ef.ty + 10, ef.radius * t, ef.radius * 0.42 * t, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ef.kind === 'sun_beam') {
      ctx.translate(ef.x, ef.y);
      ctx.rotate(ef.angle);
      const beamLen = 420;
      const beamW = 34 * (1 - t * 0.65);
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 28;
      const grad = ctx.createLinearGradient(0, -beamW / 2, 0, beamW / 2);
      grad.addColorStop(0, 'rgba(249, 115, 22, 0)');
      grad.addColorStop(0.25, '#f59e0b');
      grad.addColorStop(0.5, '#fffbeb');
      grad.addColorStop(0.75, '#f59e0b');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, -beamW / 2, beamLen, beamW);
    } else if (ef.kind === 'meteor') {
      const r = ef.radius * (0.25 + t * 0.95);
      const grad = ctx.createRadialGradient(ef.tx, ef.ty, 2, ef.tx, ef.ty, r);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#ef4444');
      grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ef.tx, ef.ty, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (ef.kind === 'shatter_wave' || ef.kind === 'boss_aoe') {
      const r = ef.radius * t;
      ctx.strokeStyle = ef.color;
      ctx.shadowColor = ef.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 6 * alpha;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pt.x, pt.y);
    if (pt.rotation) ctx.rotate(pt.rotation);
    if (pt.type === 'shard') {
      ctx.fillStyle = pt.color;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-pt.size, -pt.size * 0.6);
      ctx.lineTo(pt.size, -pt.size * 0.2);
      ctx.lineTo(pt.size * 0.4, pt.size);
      ctx.lineTo(-pt.size * 0.8, pt.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (const ft of texts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = ft.isBanner
      ? '900 18px "Noto Serif SC", serif'
      : `bold ${Math.round(14 * ft.scale)}px "JetBrains Mono", "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

export interface MinimapRenderData {
  obstacles: MapObstacle[];
  rooms: MapRoom[];
  fog: Uint8Array;
  playerX: number;
  playerY: number;
  mobs: RenderMob[];
  chests: RenderChest[];
  boss: RenderBoss | null;
  loots: GroundLoot[];
  clueActive: boolean;
}

export function drawMinimapToCanvas(
  ctx: CanvasRenderingContext2D,
  mw: number,
  mh: number,
  data: MinimapRenderData,
  time: number,
  showRoomLabels = false
) {
  const sx = mw / WORLD_W;
  const sy = mh / WORLD_H;

  ctx.clearRect(0, 0, mw, mh);
  ctx.fillStyle = '#07090f';
  ctx.fillRect(0, 0, mw, mh);

  // Explored rooms floor
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (const r of data.rooms) {
    ctx.strokeRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  }

  // Obstacles
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
  for (const ob of data.obstacles) {
    ctx.fillRect(ob.x * sx, ob.y * sy, Math.max(2, ob.w * sx), Math.max(2, ob.h * sy));
  }

  // Unexplored chests in discovered cells
  for (const ch of data.chests) {
    if (ch.opened) continue;
    const fc = Math.floor(ch.x / FOG_CELL);
    const fr = Math.floor(ch.y / FOG_CELL);
    if (data.fog[fr * FOG_COLS + fc]) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ch.x * sx - 2, ch.y * sy - 2, 4, 4);
    }
  }

  // Mobs / Elites inside explored cells
  for (const m of data.mobs) {
    if (m.hp <= 0) continue;
    const fc = Math.floor(m.x / FOG_CELL);
    const fr = Math.floor(m.y / FOG_CELL);
    if (data.fog[fr * FOG_COLS + fc]) {
      ctx.fillStyle = m.isElite ? '#f97316' : '#f87171';
      ctx.beginPath();
      ctx.arc(m.x * sx, m.y * sy, m.isElite ? 2.8 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fog-of-War Dark Overlay for unexplored cells!
  ctx.fillStyle = 'rgba(3, 4, 8, 0.88)';
  const cw = FOG_CELL * sx + 0.5;
  const ch = FOG_CELL * sy + 0.5;
  for (let r = 0; r < FOG_ROWS; r++) {
    for (let c = 0; c < FOG_COLS; c++) {
      if (!data.fog[r * FOG_COLS + c]) {
        ctx.fillRect(c * FOG_CELL * sx, r * FOG_CELL * sy, cw, ch);
      }
    }
  }

  if (showRoomLabels) {
    ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
    for (const r of data.rooms) {
      ctx.fillText(r.name, (r.x + r.w / 2) * sx, (r.y + r.h / 2) * sy);
    }
  }

  // Boss indicator: exact dot if discovered or clue active; faint ping if alive
  if (data.boss && data.boss.hp > 0) {
    if (data.boss.discovered || data.clueActive) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(data.boss.x * sx, data.boss.y * sy, 4.5 + Math.sin(time * 8) * 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Player dot
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(data.playerX * sx, data.playerY * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}
