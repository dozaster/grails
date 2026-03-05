"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import logoSrc from "@/public/logo.png";

interface NavProps {
  onOpenModal: () => void;
}

export default function Nav({ onOpenModal }: NavProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  const handleCtaClick = () => {
    close();
    onOpenModal();
  };

  return (
    <>
      <nav>
        <a className="nav-logo" href="/">
          <Image
            src={logoSrc}
            alt="Grails"
            className="nav-logo-img"
            priority
          />
        </a>

        <button
          className={`hamburger${open ? " open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={toggle}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </nav>

      {/* Backdrop */}
      <div
        className={`menu-backdrop${open ? " open" : ""}`}
        onClick={close}
      />

      {/* Slide-in panel */}
      <div
        className={`menu-panel${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="menu-close-row">
          <button className="menu-close-btn" onClick={close} aria-label="Close menu">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        <p className="menu-eyebrow">Navigation</p>

        <ul className="menu-links">
          {[
            { href: "/about", label: "About" },
            { href: "/features", label: "Features" },
            { href: "/contact", label: "Contact" },
          ].map(({ href, label }) => (
            <li key={href}>
              <a className="menu-link" href={href} onClick={close}>
                {label} <span className="menu-link-arr">→</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Social links */}
        <div className="menu-social">
          <a
            className="social-link"
            href="https://www.instagram.com/grails.hq/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Grails on Instagram"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            className="social-link"
            href="https://x.com/GrailsHQ"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Grails on X"
          >
            <svg viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.256 5.622 5.908-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>

        <div className="menu-footer">
          Grails — A New Art Marketplace<br />© 2026 All rights reserved.
        </div>
      </div>
    </>
  );
}
