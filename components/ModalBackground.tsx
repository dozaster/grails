"use client";

import { useEffect, useRef } from "react";

/**
 * ModalBackground
 * Same drifting white-blob canvas effect, tuned for the smaller modal viewport.
 * Rendered behind modal content, above the dark overlay.
 */
export default function ModalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d")!;
    let W = 0, H = 0, t = 0, rafId: number;

    const orbs = [
      { px: 0.15, py: 0.25, rr: 0.70, sx: 0.00012, sy: 0.00009, ax: 0.20, ay: 0.15, ph: 0.0, op: 0.65 },
      { px: 0.85, py: 0.55, rr: 0.65, sx: 0.00009, sy: 0.00013, ax: 0.16, ay: 0.20, ph: 2.4, op: 0.58 },
      { px: 0.50, py: 0.82, rr: 0.55, sx: 0.00011, sy: 0.00008, ax: 0.18, ay: 0.12, ph: 1.2, op: 0.45 },
    ];

    function resize() {
      const rect = cv!.parentElement!.getBoundingClientRect();
      W = cv!.width  = rect.width  || 480;
      H = cv!.height = rect.height || 600;
    }
    resize();

    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    function draw() {
      t++;
      cx.fillStyle = "#080808";
      cx.fillRect(0, 0, W, H);

      const minDim = Math.min(W, H);
      orbs.forEach((o) => {
        const ox = (o.px + Math.sin(t * o.sx + o.ph) * o.ax) * W;
        const oy = (o.py + Math.cos(t * o.sy + o.ph * 1.3) * o.ay) * H;
        const r  = o.rr * minDim;

        const g = cx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0,    `rgba(255,255,255,${o.op})`);
        g.addColorStop(0.20, `rgba(210,210,210,${o.op * 0.50})`);
        g.addColorStop(0.50, `rgba(140,140,140,${o.op * 0.15})`);
        g.addColorStop(1,    `rgba(8,8,8,0)`);

        cx.save();
        cx.translate(ox, oy);
        cx.scale(1, 0.70);
        cx.translate(-ox, -oy);
        cx.beginPath();
        cx.arc(ox, oy, r, 0, Math.PI * 2);
        cx.fillStyle = g;
        cx.fill();
        cx.restore();
      });

      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        pointerEvents: "none",
        filter: "blur(36px)",
        zIndex: 0,
      }}
    />
  );
}
