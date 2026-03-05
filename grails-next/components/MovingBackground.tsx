"use client";

import React from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * MovingBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen animated WebGL gradient using ShaderGradient v2.
 * Positioned fixed behind all content (z-index: -1).
 *
 * USAGE:
 *   Import and render inside a Client Component only.
 *   It is dynamically imported in layout.tsx with { ssr: false } so the
 *   WebGL/Three.js code never runs on the server.
 *
 * CUSTOMIZATION:
 *   Option A (props): Tweak the values below directly.
 *   Option B (URL):   Go to https://shadergradient.co/customize, dial in
 *                     your look, copy the URL string, swap to control="query"
 *                     and paste it as urlString prop — see commented block.
 *
 * PERFORMANCE NOTES:
 *   - pixelDensity 1.0–1.25 is the sweet spot. Higher = sharper on Retina
 *     but meaningfully slower on mobile. Consider reducing to 1.0 on mobile
 *     by reading window.devicePixelRatio at runtime.
 *   - uSpeed 0.25–0.35 feels premium; anything above 0.5 reads as frantic.
 *   - grain="on" is responsible for ~50% of the "cinematic Framer feel".
 */
export default function MovingBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        /* Optional: add a very light CSS blur for a softer glow effect.
           Keep it subtle — anything over 4px gets muddy. */
        // filter: "blur(2px)",
      }}
    >
      <ShaderGradientCanvas
        style={{ position: "absolute", inset: 0 }}
        pixelDensity={1.25}
        fov={45}
      >
        {/*
         * Option A — direct props (active by default)
         * Color palette is near-black + deep purple + magenta, matching
         * the existing Grails dark aesthetic. Swap colors freely.
         */}
        <ShaderGradient
          control="props"
          type="plane"
          animate="on"
          grain="on"
          // ── Motion feel ────────────────────────────────────────────────
          uSpeed={0.28}       // 0.25–0.35 feels premium
          uStrength={3.5}     // wave amplitude
          uDensity={1.2}      // how tight the waves are
          uFrequency={4.5}    // spatial frequency of the gradient
          // ── Color palette ──────────────────────────────────────────────
          color1="#060606"    // near-black (matches --bg)
          color2="#1a1060"    // deep indigo/purple
          color3="#3d0a3d"    // dark magenta
          // ── Camera / lighting ─────────────────────────────────────────
          lightType="3d"
          brightness={1.0}
          cDistance={3.6}
          cPolarAngle={90}
          cAzimuthAngle={180}
        />

        {/*
         * Option B — ShaderGradient URL string (uncomment to use)
         * Generate your look at https://shadergradient.co/customize
         * then paste the full URL here. This overrides all props above.
         *
        <ShaderGradient
          control="query"
          urlString="https://www.shadergradient.co/customize?animate=on&grain=on&type=plane&uSpeed=0.28&color1=%23060606&color2=%231a1060&color3=%233d0a3d"
        />
        */}
      </ShaderGradientCanvas>
    </div>
  );
}
