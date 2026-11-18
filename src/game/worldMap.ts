import { MapObstacle, MapRoom } from './types';

export const WORLD_W = 2800;
export const WORLD_H = 1800;
export const FOG_CELL = 100; // 28 x 18 fog grid!
export const FOG_COLS = Math.ceil(WORLD_W / FOG_CELL);
export const FOG_ROWS = Math.ceil(WORLD_H / FOG_CELL);

export interface MapLayout {
  playerSpawn: { x: number; y: number };
  rooms: MapRoom[];
  bossSpawnCandidates: { x: number; y: number; roomName: string }[];
  eliteSpawns: { x: number; y: number }[];
  mobSpawns: { x: number; y: number }[];
  chestSpawns: { x: number; y: number }[];
  obstacles: MapObstacle[];
}

export const MAP_LAYOUTS: Record<string, MapLayout> = {
  woma: {
    playerSpawn: { x: 240, y: 900 },
    rooms: [
      { id: 'r1', name: '沃玛神殿入口', x: 40, y: 550, w: 600, h: 700 },
      { id: 'r2', name: '北翼石廊', x: 640, y: 80, w: 720, h: 520 },
      { id: 'r3', name: '中央祭祀厅', x: 640, y: 600, w: 720, h: 600 },
      { id: 'r4', name: '南翼藏经室', x: 640, y: 1200, w: 720, h: 520 },
      { id: 'r5', name: '东北魔坛', x: 1360, y: 80, w: 1380, h: 780 },
      { id: 'r6', name: '东南深殿', x: 1360, y: 940, w: 1380, h: 780 },
    ],
    bossSpawnCandidates: [
      { x: 2400, y: 360, roomName: '东北魔坛' },
      { x: 2400, y: 1420, roomName: '东南深殿' },
      { x: 1120, y: 260, roomName: '北翼石廊' },
      { x: 1120, y: 1520, roomName: '南翼藏经室' },
    ],
    eliteSpawns: [
      { x: 960, y: 320 },
      { x: 980, y: 900 },
      { x: 1850, y: 500 },
      { x: 1850, y: 1320 },
    ],
    mobSpawns: [
      { x: 460, y: 740 },
      { x: 480, y: 1080 },
      { x: 780, y: 420 },
      { x: 840, y: 1380 },
      { x: 1580, y: 380 },
      { x: 1620, y: 1180 },
      { x: 2150, y: 720 },
      { x: 2150, y: 1120 },
    ],
    chestSpawns: [
      { x: 760, y: 180 },
      { x: 760, y: 1620 },
      { x: 2560, y: 900 },
    ],
    obstacles: [
      // Room dividers with open doorways
      { x: 600, y: 60, w: 56, h: 680, kind: 'wall' },
      { x: 600, y: 1040, w: 56, h: 700, kind: 'wall' },
      { x: 1340, y: 60, w: 56, h: 420, kind: 'wall' },
      { x: 1340, y: 740, w: 56, h: 360, kind: 'wall' },
      { x: 1340, y: 1360, w: 56, h: 380, kind: 'wall' },
      { x: 1520, y: 860, w: 940, h: 56, kind: 'wall' },
      // Pillars & braziers
      { x: 940, y: 680, w: 72, h: 72, kind: 'pillar' },
      { x: 940, y: 1050, w: 72, h: 72, kind: 'pillar' },
      { x: 2040, y: 420, w: 74, h: 74, kind: 'brazier' },
      { x: 2040, y: 1320, w: 74, h: 74, kind: 'brazier' },
    ],
  },
  zuma: {
    playerSpawn: { x: 240, y: 260 },
    rooms: [
      { id: 'r1', name: '祖玛阁门厅', x: 40, y: 40, w: 680, h: 580 },
      { id: 'r2', name: '西南迷阵', x: 40, y: 660, w: 680, h: 1080 },
      { id: 'r3', name: '中央龙纹殿', x: 760, y: 380, w: 920, h: 1000 },
      { id: 'r4', name: '东北藏兵阁', x: 1740, y: 40, w: 1000, h: 820 },
      { id: 'r5', name: '祖玛教主之家', x: 1740, y: 920, w: 1000, h: 820 },
    ],
    bossSpawnCandidates: [
      { x: 2420, y: 1420, roomName: '祖玛教主之家' },
      { x: 2420, y: 320, roomName: '东北藏兵阁' },
      { x: 340, y: 1480, roomName: '西南迷阵' },
      { x: 1220, y: 880, roomName: '中央龙纹殿' },
    ],
    eliteSpawns: [
      { x: 420, y: 1020 },
      { x: 1200, y: 540 },
      { x: 1200, y: 1220 },
      { x: 2020, y: 520 },
    ],
    mobSpawns: [
      { x: 520, y: 380 },
      { x: 280, y: 840 },
      { x: 540, y: 1320 },
      { x: 960, y: 880 },
      { x: 1480, y: 880 },
      { x: 1960, y: 1380 },
      { x: 2360, y: 620 },
    ],
    chestSpawns: [
      { x: 220, y: 1600 },
      { x: 1220, y: 200 },
      { x: 2560, y: 200 },
    ],
    obstacles: [
      { x: 700, y: 60, w: 56, h: 480, kind: 'wall' },
      { x: 700, y: 820, w: 56, h: 920, kind: 'wall' },
      { x: 1680, y: 60, w: 56, h: 520, kind: 'wall' },
      { x: 1680, y: 900, w: 56, h: 840, kind: 'wall' },
      { x: 1960, y: 860, w: 620, h: 56, kind: 'wall' },
      { x: 1180, y: 700, w: 80, h: 80, kind: 'pillar' },
      { x: 1180, y: 1020, w: 80, h: 80, kind: 'pillar' },
      { x: 2200, y: 1180, w: 72, h: 72, kind: 'brazier' },
    ],
  },
  crimson: {
    playerSpawn: { x: 240, y: 1520 },
    rooms: [
      { id: 'r1', name: '赤月峡谷口', x: 40, y: 1040, w: 720, h: 700 },
      { id: 'r2', name: '左翼熔岩洞', x: 40, y: 80, w: 840, h: 900 },
      { id: 'r3', name: '血池中庭', x: 920, y: 500, w: 940, h: 860 },
      { id: 'r4', name: '赤月老巢', x: 1920, y: 80, w: 820, h: 900 },
      { id: 'r5', name: '东南晶窟', x: 1920, y: 1040, w: 820, h: 700 },
    ],
    bossSpawnCandidates: [
      { x: 2440, y: 360, roomName: '赤月老巢' },
      { x: 360, y: 320, roomName: '左翼熔岩洞' },
      { x: 2440, y: 1460, roomName: '东南晶窟' },
    ],
    eliteSpawns: [
      { x: 500, y: 640 },
      { x: 1380, y: 880 },
      { x: 2140, y: 640 },
      { x: 2140, y: 1340 },
    ],
    mobSpawns: [
      { x: 520, y: 1380 },
      { x: 340, y: 920 },
      { x: 1080, y: 740 },
      { x: 1140, y: 1240 },
      { x: 1620, y: 660 },
      { x: 2280, y: 920 },
    ],
    chestSpawns: [
      { x: 180, y: 200 },
      { x: 1380, y: 220 },
      { x: 2600, y: 1600 },
    ],
    obstacles: [
      { x: 760, y: 840, w: 56, h: 680, kind: 'wall' },
      { x: 1040, y: 420, w: 680, h: 56, kind: 'wall' },
      { x: 1860, y: 120, w: 56, h: 520, kind: 'wall' },
      { x: 1860, y: 960, w: 56, h: 720, kind: 'wall' },
      { x: 1360, y: 840, w: 88, h: 88, kind: 'brazier' },
      { x: 460, y: 460, w: 88, h: 88, kind: 'brazier' },
    ],
  },
  sabak: {
    playerSpawn: { x: 1400, y: 1600 },
    rooms: [
      { id: 'r1', name: '沙巴克皇城外门', x: 840, y: 1200, w: 1120, h: 560 },
      { id: 'r2', name: '西侧偏殿', x: 60, y: 140, w: 760, h: 1500 },
      { id: 'r3', name: '东侧偏殿', x: 1980, y: 140, w: 760, h: 1500 },
      { id: 'r4', name: '皇宫金銮殿', x: 840, y: 80, w: 1120, h: 1060 },
    ],
    bossSpawnCandidates: [
      { x: 1400, y: 340, roomName: '皇宫金銮殿' },
      { x: 380, y: 420, roomName: '西侧偏殿' },
      { x: 2420, y: 420, roomName: '东侧偏殿' },
    ],
    eliteSpawns: [
      { x: 520, y: 1020 },
      { x: 2280, y: 1020 },
      { x: 1400, y: 780 },
    ],
    mobSpawns: [
      { x: 1020, y: 1340 },
      { x: 1780, y: 1340 },
      { x: 420, y: 760 },
      { x: 2380, y: 760 },
      { x: 1060, y: 540 },
      { x: 1740, y: 540 },
    ],
    chestSpawns: [
      { x: 200, y: 240 },
      { x: 2600, y: 240 },
      { x: 1400, y: 160 },
    ],
    obstacles: [
      { x: 800, y: 120, w: 56, h: 640, kind: 'wall' },
      { x: 800, y: 1040, w: 56, h: 640, kind: 'wall' },
      { x: 1944, y: 120, w: 56, h: 640, kind: 'wall' },
      { x: 1944, y: 1040, w: 56, h: 640, kind: 'wall' },
      { x: 1080, y: 460, w: 80, h: 80, kind: 'pillar' },
      { x: 1640, y: 460, w: 80, h: 80, kind: 'pillar' },
      { x: 1080, y: 880, w: 80, h: 80, kind: 'brazier' },
      { x: 1640, y: 880, w: 80, h: 80, kind: 'brazier' },
    ],
  },
};

export function getRoomNameAt(mapId: string, x: number, y: number): string {
  const layout = MAP_LAYOUTS[mapId];
  if (!layout) return '未知区域';
  for (const r of layout.rooms) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return r.name;
    }
  }
  return '迷宫走廊';
}

export function resolveCircleObstacles(
  x: number,
  y: number,
  radius: number,
  obstacles: MapObstacle[]
): { x: number; y: number } {
  let nx = Math.max(radius + 24, Math.min(WORLD_W - radius - 24, x));
  let ny = Math.max(radius + 24, Math.min(WORLD_H - radius - 24, y));

  for (const ob of obstacles) {
    const closestX = Math.max(ob.x, Math.min(nx, ob.x + ob.w));
    const closestY = Math.max(ob.y, Math.min(ny, ob.y + ob.h));
    const dx = nx - closestX;
    const dy = ny - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.001) {
        const push = radius - dist;
        nx += (dx / dist) * push;
        ny += (dy / dist) * push;
      } else {
        nx += radius;
      }
    }
  }
  return { x: nx, y: ny };
}
