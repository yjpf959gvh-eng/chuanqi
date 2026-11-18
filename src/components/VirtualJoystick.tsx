import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ joystickRef }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 32;

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnob({ x: dx, y: dy });
    joystickRef.current = { x: dx / maxRadius, y: dy / maxRadius };
  };

  const reset = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    joystickRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        activePointerId.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        reset();
      }}
      onPointerCancel={reset}
      className="relative w-24 h-24 rounded-full bg-slate-950/60 border border-amber-500/35 backdrop-blur-sm flex items-center justify-center touch-none select-none"
    >
      <div className="w-10 h-10 rounded-full border border-white/10 pointer-events-none" />
      <div
        className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 pointer-events-none"
        style={{
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
};
