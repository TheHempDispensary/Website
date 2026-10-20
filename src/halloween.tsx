/* ======================== HALLOWEEN THEME ========================
 * Seasonal decorations. Active Oct 1 – Nov 1 (Eastern time) and switches
 * itself off afterwards, so nothing has to be reverted by hand.
 * Preview any time with ?halloween=1, or force it off with ?halloween=0.
 */

import type { CSSProperties } from "react";

export const HW = {
  orange: "#FF7A1A",
  orangeDeep: "#E85D04",
  purple: "#5B2A86",
  night: "#140B1F",
  candle: "#FFCB08",
  stem: "#3D8C32",
};

export function isHalloweenSeason(now: Date = new Date()): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("halloween");
    if (q === "1") return true;
    if (q === "0") return false;
  } catch { /* ignore */ }
  // Compare in America/New_York so the switch flips at local midnight.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric" }).formatToParts(now);
  const month = Number(parts.find(p => p.type === "month")?.value);
  const day = Number(parts.find(p => p.type === "day")?.value);
  return month === 10 || (month === 11 && day <= 1);
}

/* ---------- Small SVG pieces ---------- */

export function Pumpkin({ size = 40, face = true, className = "", style }: { size?: number; face?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <path d="M32 14c0-4 2-8 6-9" stroke={HW.stem} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M36 9c5-2 10 0 12 4-5 1-9 0-12-4z" fill={HW.stem} />
      <ellipse cx="20" cy="38" rx="14" ry="20" fill={HW.orangeDeep} />
      <ellipse cx="44" cy="38" rx="14" ry="20" fill={HW.orangeDeep} />
      <ellipse cx="32" cy="38" rx="15" ry="21" fill={HW.orange} />
      {face && (
        <g fill={HW.candle}>
          <path d="M20 32l6-6 4 6z" />
          <path d="M34 32l6-6 4 6z" />
          <path d="M18 42c4 8 24 8 28 0l-4 1-3 4-3-3-4 4-4-4-3 3-3-4z" />
        </g>
      )}
    </svg>
  );
}

export function Bat({ size = 48, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size / 2} viewBox="0 0 64 32" className={className} style={style} aria-hidden="true">
      <path
        fill="currentColor"
        d="M32 9l-2-5-1 5c-2 0-3 1-4 2C21 6 13 4 2 6c6 3 9 7 10 13 3-3 7-3 10 0 2-3 5-4 7-3l3 6 3-6c2-1 5 0 7 3 3-3 7-3 10 0 1-6 4-10 10-13-11-2-19 0-23 5-1-1-2-2-4-2l-1-5z"
      />
    </svg>
  );
}

function Ghost({ size = 44, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 50 60" className={className} style={style} aria-hidden="true">
      <path d="M25 2C12 2 4 12 4 25v33l7-6 7 6 7-6 7 6 7-6 7 6V25C46 12 38 2 25 2z" fill="#FFFFFF" opacity="0.92" />
      <ellipse cx="18" cy="24" rx="3.5" ry="5" fill="#231F20" />
      <ellipse cx="32" cy="24" rx="3.5" ry="5" fill="#231F20" />
      <ellipse cx="25" cy="36" rx="4" ry="3" fill="#231F20" />
    </svg>
  );
}

function SpiderWeb({ size = 140, flip = false, className = "" }: { size?: number; flip?: boolean; className?: string }) {
  // Quarter web anchored in the top-left corner (mirrored for the right side).
  const spokes = [0, 18, 36, 54, 72, 90].map(a => (a * Math.PI) / 180);
  const rings = [0.25, 0.45, 0.65, 0.85];
  const L = 100;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <g stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
        {spokes.map((a, i) => <line key={i} x1="0" y1="0" x2={Math.cos(a) * L} y2={Math.sin(a) * L} />)}
        {rings.map((r, ri) => {
          const pts = spokes.map(a => [Math.cos(a) * L * r, Math.sin(a) * L * r]);
          let d = `M${pts[0][0]},${pts[0][1]}`;
          for (let i = 1; i < pts.length; i++) {
            // sag each strand slightly toward the corner
            const mx = (pts[i - 1][0] + pts[i][0]) / 2 * 0.9;
            const my = (pts[i - 1][1] + pts[i][1]) / 2 * 0.9;
            d += ` Q${mx},${my} ${pts[i][0]},${pts[i][1]}`;
          }
          return <path key={ri} d={d} />;
        })}
      </g>
      {/* little spider on a thread */}
      <line x1="62" y1="38" x2="62" y2="70" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="0.6" />
      <g className="hw-spider" fill="#FFFFFF" fillOpacity="0.85">
        <circle cx="62" cy="72" r="3" />
        <circle cx="62" cy="67.5" r="2" />
      </g>
    </svg>
  );
}

/* ---------- Composed decorations ---------- */

/** Layer placed inside the hero section (absolute, behind the text). */
export function HalloweenHeroDecor() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
      {/* moon */}
      <div className="absolute right-3 top-3 w-12 h-12 sm:right-[8%] sm:top-10 sm:w-32 sm:h-32 rounded-full hw-moon" />
      {/* webs */}
      <SpiderWeb size={120} className="absolute left-0 top-0 hidden sm:block" />
      <SpiderWeb size={120} flip className="absolute right-0 top-0 hidden md:block opacity-60" />
      {/* bats */}
      <Bat size={56} className="absolute text-[#4A2370] hw-bat hw-bat-1" style={{ left: "12%", top: "22%" }} />
      <Bat size={36} className="absolute text-[#4A2370] hw-bat hw-bat-2" style={{ left: "70%", top: "48%" }} />
      <Bat size={28} className="absolute text-[#4A2370] hw-bat hw-bat-3 hidden sm:block" style={{ left: "82%", top: "18%" }} />
      <Bat size={22} className="absolute text-[#4A2370] hw-bat hw-bat-2 hidden sm:block" style={{ left: "28%", top: "12%" }} />
      {/* ghost */}
      <Ghost size={40} className="absolute hw-ghost hidden sm:block" style={{ left: "6%", top: "55%" }} />
      {/* ground fog */}
      <div className="absolute bottom-0 left-0 right-0 h-16 hw-fog" />
      {/* pumpkins along the bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-2 sm:px-10">
        <div className="flex items-end gap-1">
          <Pumpkin size={58} className="hw-glow" />
          <Pumpkin size={36} face={false} className="hidden sm:block" />
        </div>
        <div className="flex items-end gap-1">
          <Pumpkin size={34} face={false} className="hidden sm:block" />
          <Pumpkin size={66} className="hw-glow hw-flicker" />
        </div>
      </div>
    </div>
  );
}

/** Thin string of hanging bats & pumpkins under the header. */
export function HalloweenGarland() {
  const items = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="relative h-7 overflow-hidden bg-[#140B1F] pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-x-0 top-0 w-full h-3" preserveAspectRatio="none" viewBox="0 0 100 10">
        <path d="M0,1 Q12.5,9 25,1 T50,1 T75,1 T100,1" stroke={HW.orange} strokeOpacity="0.6" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-0 flex justify-around items-start pt-1">
        {items.map(i => (
          <span key={i} className={`hw-swing ${i > 7 ? "hidden sm:inline-flex" : "inline-flex"}`} style={{ animationDelay: `${(i % 4) * 0.4}s` }}>
            {i % 2 === 0
              ? <Pumpkin size={18} face={i % 4 === 0} />
              : <Bat size={22} className="text-[#FF7A1A] mt-1" />}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Witch hat that sits on Bud's head. */
export function WitchHat({ size }: { size: number }) {
  const w = size * 0.62;
  return (
    <svg
      width={w}
      height={w}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ position: "absolute", left: "50%", top: -size * 0.3, transform: "translateX(-46%) rotate(-10deg)", pointerEvents: "none", overflow: "visible" }}
    >
      <path d="M30 4C38 10 42 24 46 44H18C22 30 22 14 30 4z" fill="#2A123D" />
      <path d="M30 4c4 2 6 4 7 7-3-1-5-3-7-7z" fill="#3B1B55" />
      <rect x="18" y="38" width="28" height="6" fill={HW.orange} />
      <rect x="29" y="38" width="6" height="6" fill={HW.candle} />
      <ellipse cx="32" cy="46" rx="28" ry="6" fill="#2A123D" />
    </svg>
  );
}

/** Row of pumpkins & message used at the top of the footer. */
export function HalloweenFooterBand() {
  return (
    <div className="relative border-b border-[#FFFFFF]/10 bg-gradient-to-b from-[#140B1F] to-[#231F20]">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
        <div className="flex items-end gap-1" aria-hidden="true">
          <Pumpkin size={30} face={false} />
          <Pumpkin size={40} className="hw-glow hw-flicker" />
        </div>
        <p className="text-[#FFFFFF] font-semibold">
          Happy Halloween from Spring Hill! <span className="text-[#FF7A1A]">Both stores open daily for your treats.</span>
        </p>
        <div className="flex items-end gap-1" aria-hidden="true">
          <Pumpkin size={40} className="hw-glow" />
          <Bat size={30} className="text-[#FF7A1A]" />
        </div>
      </div>
    </div>
  );
}
