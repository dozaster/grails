"use client";

import React, { useEffect, useRef } from "react";

/**
 * LogoScreensaver
 * DVD-style bouncing logo with solitaire ghost trail.
 * Activates after 2 min idle. Shift+S to toggle manually.
 */
export default function LogoScreensaver({ logoSrc }: { logoSrc: string }) {
  const saverRef = useRef<HTMLDivElement>(null);
  const bouncerRef = useRef<HTMLImageElement>(null);
  const activeRef = useRef(false);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const trailRef = useRef<ReturnType<typeof setInterval>>();
  const ghostsRef = useRef<HTMLImageElement[]>([]);
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 2.8, y: 2.8 });
  const dimsRef = useRef({ w: 100, h: 44 });

  useEffect(() => {
    const IDLE_MS = 120_000;
    const TRAIL_MS = 55;
    const GHOST_MAX = 28;
    const SPEED = 2.8;

    function startSaver() {
      if (activeRef.current) return;
      activeRef.current = true;

      const real = document.getElementById("grailsLogo") as HTMLImageElement | null;
      const rect = real?.getBoundingClientRect();
      const w = rect?.width ?? 100;
      const h = rect?.height ?? 44;
      dimsRef.current = { w, h };

      if (bouncerRef.current) {
        bouncerRef.current.style.width = w + "px";
        bouncerRef.current.style.height = h + "px";
      }

      posRef.current = {
        x: Math.random() * (window.innerWidth - w),
        y: Math.random() * (window.innerHeight - h),
      };
      velRef.current = {
        x: (Math.random() < 0.5 ? 1 : -1) * SPEED,
        y: (Math.random() < 0.5 ? 1 : -1) * SPEED,
      };

      saverRef.current?.classList.add("active");
      rafRef.current = requestAnimationFrame(tick);
      trailRef.current = setInterval(dropGhost, TRAIL_MS);
    }

    function stopSaver() {
      if (!activeRef.current) return;
      activeRef.current = false;
      saverRef.current?.classList.remove("active");
      cancelAnimationFrame(rafRef.current);
      clearInterval(trailRef.current);
      ghostsRef.current.forEach((g) => g.parentNode?.removeChild(g));
      ghostsRef.current = [];
    }

    function tick() {
      if (!activeRef.current) return;
      const { w, h } = dimsRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = posRef.current;
      const v = velRef.current;

      p.x += v.x;
      p.y += v.y;
      if (p.x <= 0) { p.x = 0; v.x = Math.abs(v.x); }
      if (p.x + w >= vw) { p.x = vw - w; v.x = -Math.abs(v.x); }
      if (p.y <= 0) { p.y = 0; v.y = Math.abs(v.y); }
      if (p.y + h >= vh) { p.y = vh - h; v.y = -Math.abs(v.y); }

      if (bouncerRef.current) {
        bouncerRef.current.style.left = p.x + "px";
        bouncerRef.current.style.top = p.y + "px";
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function dropGhost() {
      if (!activeRef.current || !saverRef.current) return;
      if (ghostsRef.current.length >= GHOST_MAX) {
        const old = ghostsRef.current.shift();
        old?.parentNode?.removeChild(old);
      }
      const g = document.createElement("img");
      g.src = logoSrc;
      g.className = "logo-ghost";
      const { x, y } = posRef.current;
      const { w, h } = dimsRef.current;
      Object.assign(g.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      saverRef.current.appendChild(g);
      ghostsRef.current.push(g);
      g.addEventListener("animationend", () => {
        g.parentNode?.removeChild(g);
        ghostsRef.current = ghostsRef.current.filter((x) => x !== g);
      });
    }

    function resetIdle() {
      if (activeRef.current) stopSaver();
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(startSaver, IDLE_MS);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    events.forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }));

    const shiftS = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "S") {
        if (activeRef.current) { stopSaver(); resetIdle(); }
        else { clearTimeout(timerRef.current); startSaver(); }
      }
    };
    document.addEventListener("keydown", shiftS);

    timerRef.current = setTimeout(startSaver, IDLE_MS);

    return () => {
      stopSaver();
      clearTimeout(timerRef.current);
      events.forEach((ev) => document.removeEventListener(ev, resetIdle));
      document.removeEventListener("keydown", shiftS);
    };
  }, [logoSrc]);

  return (
    <div id="logoScreensaver" ref={saverRef}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img id="bouncingLogo" ref={bouncerRef} src={logoSrc} alt="" />
    </div>
  );
}
