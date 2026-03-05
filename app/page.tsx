"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import WaitlistModal from "@/components/WaitlistModal";
import BottomPhrases from "@/components/BottomPhrases";
import LogoScreensaver from "@/components/LogoScreensaver";
import logoSrc from "@/public/logo.png";

// ShaderGradient uses WebGL (browser-only). Dynamic import with ssr:false
// ensures it never runs on the server — critical to avoid hydration errors.
const MovingBackground = dynamic(
  () => import("@/components/MovingBackground"),
  { ssr: false }
);

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Full-screen animated WebGL gradient */}
      <MovingBackground />

      {/* Navigation + hamburger menu */}
      <Nav onOpenModal={() => setModalOpen(true)} />

      {/* Hero */}
      <main>
        <p className="eyebrow">A New Art Marketplace</p>
        <h1 className="headline">
          <span className="hl">
            <span className="hli">Collect Early,</span>
          </span>
          <span className="hl">
            <span className="hli">Originals Only.</span>
          </span>
        </h1>

        <div className="cta-wrap">
          <div className="cta-trace" />
          <button className="cta-btn" onClick={() => setModalOpen(true)}>
            Claim Your Spot
          </button>
        </div>
      </main>

      {/* Cycling phrases at bottom */}
      <BottomPhrases />

      {/* Waitlist multi-step modal */}
      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* DVD-bounce logo screensaver */}
      <LogoScreensaver logoSrc={logoSrc.src} />
    </>
  );
}
