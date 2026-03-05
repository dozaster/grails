"use client";

import ModalBackground from "@/components/ModalBackground";
import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "collector" | "artist";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// ─── Country Picker ───────────────────────────────────────────────────────────
function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const pick = (c: string) => {
    setQuery(c);
    onChange(c);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="country-wrap" ref={wrapRef}>
      <input
        className="country-input"
        type="text"
        placeholder="Search your country..."
        value={query}
        readOnly={!open}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {open && (
        <div className="country-dropdown open">
          {filtered.length === 0 ? (
            <div className="country-opt no-results">No results</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c}
                className="country-opt"
                onMouseDown={() => pick(c)}
              >
                {c}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [role, setRole] = useState<Role>("collector");

  // Collector state
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCountry, setCCountry] = useState("");
  const [cBudget, setCBudget] = useState("");
  const [cPriority, setCPriority] = useState("");
  const [cStep, setCStep] = useState(1);
  const [cSuccess, setCSuccess] = useState(false);
  const [cRef, setCRef] = useState("");
  const [cShake, setCShake] = useState(false);

  // Artist state
  const [aName, setAName] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aCountry, setACountry] = useState("");
  const [aStage, setAStage] = useState("");
  const [aPrice, setAPrice] = useState("");
  const [aPriority, setAPriority] = useState("");
  const [aStep, setAStep] = useState(1);
  const [aSuccess, setASuccess] = useState(false);
  const [aRef, setARef] = useState("");
  const [aShake, setAShake] = useState(false);

  const [copied, setCopied] = useState<"c" | "a" | null>(null);

  const cReady = cName.trim() && cEmail.trim() && cCountry.trim();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Block body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function shake(which: "c" | "a") {
    if (which === "c") { setCShake(true); setTimeout(() => setCShake(false), 400); }
    else { setAShake(true); setTimeout(() => setAShake(false), 400); }
  }

  function cNext(s: number) {
    if (s === 1 && !cReady) { shake("c"); return; }
    if (s === 2 && !cBudget) { shake("c"); return; }
    setCStep(s + 1);
  }
  function aNext(s: number) {
    if (s === 1 && (!aName.trim() || !aEmail.trim() || !aCountry.trim())) { shake("a"); return; }
    if (s === 2 && !aStage) { shake("a"); return; }
    if (s === 3 && !aPrice) { shake("a"); return; }
    setAStep(s + 1);
  }

  function Dots({ current, total }: { current: number; total: number }) {
    return (
      <div className="progress-bar">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`dot${i + 1 < current ? " done" : i + 1 === current ? " active" : ""}`}
          />
        ))}
      </div>
    );
  }

  async function submitForm(r: Role) {
    const p = r === "artist" ? "a" : "c";
    const priority = r === "artist" ? aPriority : cPriority;
    const lastStep = r === "artist" ? 4 : 3;
    if (!priority) { shake(p as "c" | "a"); return; }

    const name = r === "artist" ? aName : cName;
    const email = r === "artist" ? aEmail : cEmail;
    const country = r === "artist" ? aCountry : cCountry;
    const code =
      name.toLowerCase().replace(/\s+/g, "").slice(0, 8) +
      Math.random().toString(36).slice(2, 6);
    const refUrl = `${window.location.origin}/?ref=${code}`;

    const payload: Record<string, unknown> = {
      name, email, country, role: r,
      referral_code: code,
      referred_by: new URLSearchParams(window.location.search).get("ref") || null,
      submitted_at: new Date().toISOString(),
    };
    if (r === "collector") { payload.budget = cBudget; payload.priority = cPriority; }
    else { payload.stage = aStage; payload.price_range = aPrice; payload.priority = aPriority; }

    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("API:", e);
    }

    if (r === "collector") { setCSuccess(true); setCRef(refUrl); }
    else { setASuccess(true); setARef(refUrl); }
  }

  function copyRef(text: string, which: "c" | "a") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  function OptionCard({
    icon, label, sub, selected, onClick,
  }: { icon: string; label: string; sub?: string; selected: boolean; onClick: () => void }) {
    return (
      <button className={`opt-card${selected ? " selected" : ""}`} onClick={onClick}>
        <span className="opt-icon">{icon}</span>
        <span className="opt-label">{label}</span>
        {sub && <span className="opt-sub">{sub}</span>}
      </button>
    );
  }

  return (
    <div
      className={`modal-overlay${open ? " open" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal" style={{position:"relative", overflow:"hidden"}}>
        <ModalBackground />
        <div className="modal-inner" style={{position:"relative", zIndex:1}}>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            &#x2715;
          </button>

          <h2 className="modal-title">Join the Waitlist</h2>
          <p className="modal-sub">Be among the first to collect or sell on Grails.</p>

          {/* Role Toggle */}
          <div className="role-toggle">
            <div className={`toggle-pill${role === "artist" ? " artist" : ""}`} />
            <button
              className={`role-btn${role === "collector" ? " active" : ""}`}
              onClick={() => setRole("collector")}
            >
              Collector
            </button>
            <button
              className={`role-btn${role === "artist" ? " active" : ""}`}
              onClick={() => setRole("artist")}
            >
              Artist
            </button>
          </div>

          {/* ── COLLECTOR FLOW ─────────────────────────────────────────── */}
          {role === "collector" && !cSuccess && (
            <>
              <Dots current={cStep} total={3} />

              {cStep === 1 && (
                <div className={`step active${cShake ? " shake" : ""}`}>
                  <div className="step-counter">01 / 03</div>
                  <div className="step-title">The basics.</div>
                  <div className="field">
                    <label>Full Name</label>
                    <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="jane@example.com" />
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <CountryPicker value={cCountry} onChange={setCCountry} />
                  </div>
                  <div className="step-actions">
                    <button
                      className={`btn-next${cReady ? " ready" : ""}`}
                      onClick={() => cNext(1)}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {cStep === 2 && (
                <div className={`step active${cShake ? " shake" : ""}`}>
                  <div className="step-counter">02 / 03</div>
                  <div className="step-title">Collecting budget?</div>
                  <div className="options">
                    {[
                      { icon: "🌱", label: "Under $1K" },
                      { icon: "💼", label: "$1K – $5K" },
                      { icon: "🏛️", label: "$5K – $20K" },
                      { icon: "💎", label: "$20K+" },
                    ].map(({ icon, label }) => (
                      <OptionCard key={label} icon={icon} label={label} selected={cBudget === label} onClick={() => setCBudget(label)} />
                    ))}
                  </div>
                  <div className="step-actions">
                    <button className="btn-back" onClick={() => setCStep(1)}>←</button>
                    <button className="btn-next" onClick={() => cNext(2)}>Continue →</button>
                  </div>
                </div>
              )}

              {cStep === 3 && (
                <div className={`step active${cShake ? " shake" : ""}`}>
                  <div className="step-counter">03 / 03</div>
                  <div className="step-title">What matters most?</div>
                  <div className="options">
                    {[
                      { icon: "🔍", label: "Discovering artists" },
                      { icon: "📈", label: "Investment & resale" },
                      { icon: "🤝", label: "Supporting artists" },
                      { icon: "🏆", label: "Building a collection" },
                    ].map(({ icon, label }) => (
                      <OptionCard key={label} icon={icon} label={label} selected={cPriority === label} onClick={() => setCPriority(label)} />
                    ))}
                  </div>
                  <div className="step-actions">
                    <button className="btn-back" onClick={() => setCStep(2)}>←</button>
                    <button className="btn-next submit-btn" onClick={() => submitForm("collector")}>
                      Reserve My Spot →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {role === "collector" && cSuccess && (
            <div className="success-screen active">
              <div className="success-icon">✶</div>
              <div className="success-title">You&apos;re on the list.</div>
              <div className="success-body">
                We&apos;ll be in touch before launch. Share your link — every referral moves you up.
              </div>
              <div className="referral-box">
                <div className="referral-label">Your referral link</div>
                <div className="referral-url">{cRef}</div>
                <button
                  className={`btn-copy${copied === "c" ? " copied" : ""}`}
                  onClick={() => copyRef(cRef, "c")}
                >
                  {copied === "c" ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="share-row">
                <button
                  className="share-btn"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent("Just joined the Grails waitlist — a new marketplace for original art →")}&url=${encodeURIComponent(cRef)}`,
                      "_blank"
                    )
                  }
                >
                  𝕏 Share
                </button>
                <button className="share-btn" onClick={() => { navigator.clipboard.writeText(cRef); alert("Link copied — paste it into your Instagram Story!"); }}>
                  IG Story
                </button>
              </div>
            </div>
          )}

          {/* ── ARTIST FLOW ────────────────────────────────────────────── */}
          {role === "artist" && !aSuccess && (
            <>
              <Dots current={aStep} total={4} />

              {aStep === 1 && (
                <div className={`step active${aShake ? " shake" : ""}`}>
                  <div className="step-counter">01 / 04</div>
                  <div className="step-title">Tell us about you.</div>
                  <div className="field">
                    <label>Full Name</label>
                    <input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="studio@example.com" />
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <CountryPicker value={aCountry} onChange={setACountry} />
                  </div>
                  <div className="step-actions">
                    <button
                      className={`btn-next${aName.trim() && aEmail.trim() && aCountry.trim() ? " ready" : ""}`}
                      onClick={() => aNext(1)}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {aStep === 2 && (
                <div className={`step active${aShake ? " shake" : ""}`}>
                  <div className="step-counter">02 / 04</div>
                  <div className="step-title">Where are you in your career?</div>
                  <div className="options">
                    {[
                      { icon: "🎓", label: "Student" },
                      { icon: "🌿", label: "Emerging", sub: "0–3 yrs selling" },
                      { icon: "🎨", label: "Mid-career" },
                      { icon: "🏛️", label: "Gallery represented" },
                    ].map(({ icon, label, sub }) => (
                      <OptionCard key={label} icon={icon} label={label} sub={sub} selected={aStage === label} onClick={() => setAStage(label)} />
                    ))}
                  </div>
                  <div className="step-actions">
                    <button className="btn-back" onClick={() => setAStep(1)}>←</button>
                    <button className="btn-next" onClick={() => aNext(2)}>Continue →</button>
                  </div>
                </div>
              )}

              {aStep === 3 && (
                <div className={`step active${aShake ? " shake" : ""}`}>
                  <div className="step-counter">03 / 04</div>
                  <div className="step-title">Average artwork price?</div>
                  <div className="options">
                    {[
                      { icon: "💵", label: "Under $1K" },
                      { icon: "💳", label: "$1K – $3K" },
                      { icon: "💰", label: "$3K – $10K" },
                      { icon: "💎", label: "$10K+" },
                    ].map(({ icon, label }) => (
                      <OptionCard key={label} icon={icon} label={label} selected={aPrice === label} onClick={() => setAPrice(label)} />
                    ))}
                  </div>
                  <div className="step-actions">
                    <button className="btn-back" onClick={() => setAStep(2)}>←</button>
                    <button className="btn-next" onClick={() => aNext(3)}>Continue →</button>
                  </div>
                </div>
              )}

              {aStep === 4 && (
                <div className={`step active${aShake ? " shake" : ""}`}>
                  <div className="step-counter">04 / 04</div>
                  <div className="step-title">What matters most?</div>
                  <div className="options">
                    {[
                      { icon: "💸", label: "Selling more work" },
                      { icon: "🤝", label: "Building collectors" },
                      { icon: "♻️", label: "Resale + royalties" },
                      { icon: "📊", label: "Analytics + growth" },
                    ].map(({ icon, label }) => (
                      <OptionCard key={label} icon={icon} label={label} selected={aPriority === label} onClick={() => setAPriority(label)} />
                    ))}
                  </div>
                  <div className="step-actions">
                    <button className="btn-back" onClick={() => setAStep(3)}>←</button>
                    <button className="btn-next submit-btn" onClick={() => submitForm("artist")}>
                      Reserve My Spot →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {role === "artist" && aSuccess && (
            <div className="success-screen active">
              <div className="success-icon">✶</div>
              <div className="success-title">Welcome to Grails.</div>
              <div className="success-body">
                You&apos;re in. We&apos;ll reach out before launch. Every collector you refer moves you higher.
              </div>
              <div className="referral-box">
                <div className="referral-label">Your referral link</div>
                <div className="referral-url">{aRef}</div>
                <button
                  className={`btn-copy${copied === "a" ? " copied" : ""}`}
                  onClick={() => copyRef(aRef, "a")}
                >
                  {copied === "a" ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="share-row">
                <button
                  className="share-btn"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent("Just joined the Grails waitlist →")}&url=${encodeURIComponent(aRef)}`,
                      "_blank"
                    )
                  }
                >
                  𝕏 Share
                </button>
                <button className="share-btn" onClick={() => { navigator.clipboard.writeText(aRef); alert("Link copied — paste it into your Instagram Story!"); }}>
                  IG Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
