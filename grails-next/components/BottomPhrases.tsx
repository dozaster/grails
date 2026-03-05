"use client";

import React, { useState, useEffect } from "react";

const PHRASES = ["Artist Royalties", "Zero Seller Fees", "Provenance"];

export default function BottomPhrases() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in the first phrase after intro animation settles
    const show = setTimeout(() => setVisible(true), 1600);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 500);
    }, 2500);

    return () => { clearTimeout(show); clearInterval(interval); };
  }, []);

  return (
    <div className="bottom-bar" aria-live="polite">
      <span className={`phrase${visible ? " visible" : ""}`}>
        {PHRASES[index]}
      </span>
    </div>
  );
}
