"use client";

import { useEffect, useRef } from "react";

/**
 * MovingBackground
 * Replicates the large soft drifting white-blob look from grails.framer.website.
 * Pure canvas — no WebGL dependency.
 */
export default function MovingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d")!;
    let W = 0, H = 0, t = 0, rafId: number;

    // drift: slow upward pull applied every frame (fraction of H)
    const DRIFT = -0.00018;

    // Each orb: position (0-1), radius ratio, x/y oscillation speed,
    // x/y amplitude, phase offset, peak opacity, and individual y-drift multiplier
    const orbs = [
      { px: 0.08, py: 0.55, rr: 0.72, sx: 0.00018, sy: 0.00012, ax: 0.20, ay: 0.09, ph: 0.0, op: 0.82, drift: 1.0  },
      { px: 0.88, py: 0.65, rr: 0.65, sx: 0.00014, sy: 0.00016, ax: 0.16, ay: 0.08, ph: 2.1, op: 0.75, drift: 1.3  },
      { px: 0.52, py: 0.90, rr: 0.68, sx: 0.00020, sy: 0.00010, ax: 0.22, ay: 0.07, ph: 4.3, op: 0.70, drift: 0.9  },
      { px: 0.46, py: 0.75, rr: 0.45, sx: 0.00016, sy: 0.00014, ax: 0.12, ay: 0.06, ph: 1.5, op: 0.38, drift: 1.15 },
    ];

    // Track accumulated y offset per orb so they loop seamlessly
    const orbY = orbs.map((o) => o.py);

    function resize() {
      W = cv!.width  = window.innerWidth;
      H = cv!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      t++;
      cx.fillStyle = "#060606";
      cx.fillRect(0, 0, W, H);

      const minDim = Math.min(W, H);

      orbs.forEach((o, i) => {
        // Apply upward drift — accumulate and wrap so orbs loop back from bottom
        orbY[i] += DRIFT * o.drift;
        if (orbY[i] < -0.6) orbY[i] = 1.3; // reset below viewport

        // Horizontal sway + gentle vertical oscillation layered on top of drift
        const ox = (o.px + Math.sin(t * o.sx + o.ph) * o.ax) * W;
        const oy = (orbY[i]  + Math.sin(t * o.sy + o.ph * 1.3) * o.ay) * H;
        const r  = o.rr * minDim;

        const g = cx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0,    `rgba(255,255,255,${o.op})`);
        g.addColorStop(0.18, `rgba(220,220,220,${o.op * 0.55})`);
        g.addColorStop(0.45, `rgba(160,160,160,${o.op * 0.18})`);
        g.addColorStop(0.72, `rgba(80,80,80,${o.op * 0.05})`);
        g.addColorStop(1,    `rgba(6,6,6,0)`);

        cx.save();
        cx.translate(ox, oy);
        cx.scale(1, 0.72);
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
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        // CSS blur replicates the soft feathered look of the ShaderGradient
        filter: "blur(48px) saturate(1.1)",
      }}
    />
  );
}
