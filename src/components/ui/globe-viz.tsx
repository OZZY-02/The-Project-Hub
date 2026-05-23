"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { feature } from "topojson-client";

// ─── constants ───────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
const SIZE = 370;
const R = 162;
const CX = SIZE / 2;
const CY = SIZE / 2;
const LAT0 = 18; // tilt view slightly north

// ─── featured countries (ISO-3166-1 numeric ids) ─────────────────────────────
interface Country {
  id: number;
  label: string;
  lat: number;
  lng: number;
  region: "mena" | "eu" | "usa" | "asia";
}

const FEATURED: Country[] = [
  { id: 729, label: "Sudan",        lat: 15.5, lng: 32.5,   region: "mena" },
  { id: 818, label: "Egypt",        lat: 26.8, lng: 30.8,   region: "mena" },
  { id: 682, label: "Saudi Arabia", lat: 24.5, lng: 45.5,   region: "mena" },
  { id: 634, label: "Qatar",        lat: 25.3, lng: 51.2,   region: "mena" },
  { id: 512, label: "Oman",         lat: 21.5, lng: 57.0,   region: "mena" },
  { id: 276, label: "Germany",      lat: 51.2, lng: 10.4,   region: "eu"   },
  { id: 250, label: "France",       lat: 46.2, lng: 2.2,    region: "eu"   },
  { id: 826, label: "UK",           lat: 54.0, lng: -2.0,   region: "eu"   },
  { id: 528, label: "Netherlands",  lat: 52.1, lng: 5.3,    region: "eu"   },
  { id: 752, label: "Sweden",       lat: 60.1, lng: 18.6,   region: "eu"   },
  { id: 840, label: "USA",          lat: 37.1, lng: -95.7,  region: "usa"  },
  { id: 392, label: "Japan",        lat: 36.2, lng: 138.2,  region: "asia" },
  { id: 356, label: "India",        lat: 20.6, lng: 78.9,   region: "asia" },
  { id: 702, label: "Singapore",    lat: 1.3,  lng: 103.8,  region: "asia" },
  { id: 410, label: "S. Korea",     lat: 37.5, lng: 127.0,  region: "asia" },
];

const FEATURED_COLOR = "#E8603A";


// ─── projection ──────────────────────────────────────────────────────────────
function project(lat: number, lng: number, lon0: number) {
  const phi  = lat  * DEG;
  const lam  = lng  * DEG;
  const phi0 = LAT0 * DEG;
  const lam0 = lon0 * DEG;
  const depth =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lam - lam0);
  const x =  R * Math.cos(phi) * Math.sin(lam - lam0);
  const y = -R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam - lam0));
  return { x, y, depth, visible: depth > 0 };
}

// ─── colour helper ────────────────────────────────────────────────────────────
function hex2rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ─── draw a projected polygon ring onto canvas ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traceRings(ctx: CanvasRenderingContext2D, rings: number[][][], lon0: number) {
  for (const ring of rings) {
    let drawing = false;
    for (const [lng, lat] of ring) {
      const p = project(lat, lng, lon0);
      const sx = CX + p.x, sy = CY + p.y;
      if (p.visible) {
        drawing ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
        drawing = true;
      } else {
        drawing = false;
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traceFeature(ctx: CanvasRenderingContext2D, geom: any, lon0: number) {
  if (!geom) return;
  if (geom.type === "Polygon") {
    traceRings(ctx, geom.coordinates, lon0);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) traceRings(ctx, poly, lon0);
  }
}

// ─── draw grid lines ──────────────────────────────────────────────────────────
function drawGrid(ctx: CanvasRenderingContext2D, lon0: number, isLight: boolean) {
  ctx.strokeStyle = isLight ? "rgba(71,85,105,0.14)" : "rgba(143,183,255,0.09)";
  ctx.lineWidth = 0.55;
  const STEPS = 80;
  // latitude lines
  for (const lat of [-60, -30, 0, 30, 60]) {
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i <= STEPS; i++) {
      const lng = -180 + (360 / STEPS) * i;
      const p = project(lat, lng, lon0);
      if (p.visible) {
        p.visible && drawing ? ctx.lineTo(CX + p.x, CY + p.y) : ctx.moveTo(CX + p.x, CY + p.y);
        drawing = true;
      } else drawing = false;
    }
    ctx.stroke();
  }
  // longitude lines
  for (let lng = -150; lng <= 180; lng += 30) {
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i <= STEPS; i++) {
      const lat = -88 + (176 / STEPS) * i;
      const p = project(lat, lng, lon0);
      if (p.visible) {
        drawing ? ctx.lineTo(CX + p.x, CY + p.y) : ctx.moveTo(CX + p.x, CY + p.y);
        drawing = true;
      } else drawing = false;
    }
    ctx.stroke();
  }
}

// ─── main draw ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawGlobe(
  ctx: CanvasRenderingContext2D,
  lon0: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoFeatures: any[],
  hoveredId: number | null,
  isLight: boolean,
) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // sphere bg
  const bg = ctx.createRadialGradient(CX - 45, CY - 45, 0, CX, CY, R);
  if (isLight) {
    bg.addColorStop(0, "#dbeafe"); bg.addColorStop(1, "#f8fbff");
  } else {
    bg.addColorStop(0, "#0c1e3c"); bg.addColorStop(1, "#050816");
  }
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();

  // clip everything to sphere
  ctx.save();
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.clip();

  // grid
  drawGrid(ctx, lon0, isLight);

  // ── land: draw non-featured countries in one batched path ────────────────
  const featuredIds = new Set(FEATURED.map((c) => c.id));
  ctx.beginPath();
  for (const feat of geoFeatures) {
    if (featuredIds.has(Number(feat.id))) continue;
    traceFeature(ctx, feat.geometry, lon0);
  }
  ctx.fillStyle   = isLight ? "rgba(148,163,184,0.18)" : "rgba(255,255,255,0.07)";
  ctx.strokeStyle = isLight ? "rgba(148,163,184,0.4)"  : "rgba(255,255,255,0.14)";
  ctx.lineWidth = 0.45;
  ctx.fill(); ctx.stroke();

  // ── featured country fills (one per country) ─────────────────────────────
  for (const c of FEATURED) {
    const feat = geoFeatures.find((f) => Number(f.id) === c.id);
    if (!feat) continue;
    const isH = hoveredId === c.id;
    const col = FEATURED_COLOR;
    ctx.beginPath();
    traceFeature(ctx, feat.geometry, lon0);
    ctx.fillStyle   = hex2rgba(col, isH ? 0.38 : 0.2);
    ctx.strokeStyle = hex2rgba(col, isH ? 0.9  : 0.55);
    ctx.lineWidth   = isH ? 1.6 : 0.85;
    ctx.fill(); ctx.stroke();
  }

  ctx.restore(); // end sphere clip

  // sphere edge ring
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.strokeStyle = isLight ? "rgba(148,163,184,0.45)" : "rgba(143,183,255,0.22)";
  ctx.lineWidth = 1.5; ctx.stroke();

  // ── dots + labels ────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.clip();

  const projected = FEATURED.map((c) => ({ ...c, ...project(c.lat, c.lng, lon0) }))
    .sort((a, b) => b.depth - a.depth);

  for (const c of projected) {
    if (!c.visible) continue;
    const sx = CX + c.x, sy = CY + c.y;
    const alpha = 0.3 + 0.7 * Math.max(0, c.depth);
    const isH = hoveredId === c.id;
    const isSudan = c.id === 729;
    const baseR = isSudan ? 5.5 : 3.5;
    const dotR  = isH ? baseR * 1.5 : baseR;
    const col   = FEATURED_COLOR;

    // glow halo
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, dotR * 4);
    glow.addColorStop(0, hex2rgba(col, 0.22 * alpha));
    glow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(sx, sy, dotR * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // outer ring
    ctx.beginPath(); ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(col, 0.28 * alpha); ctx.fill();

    // inner core
    ctx.beginPath(); ctx.arc(sx, sy, dotR * 0.58, 0, Math.PI * 2);
    ctx.fillStyle = hex2rgba(col, Math.min(1, alpha)); ctx.fill();

    // label — Sudan only, visible when facing user
    if (isSudan && c.depth > 0.15) {
      const labelAlpha = isH ? 1 : alpha * 0.92;
      const onRight = c.x >= 0;
      const tx = onRight ? sx + dotR + 5 : sx - dotR - 5;
      ctx.font = `700 ${isH ? "11px" : "9.5px"} system-ui,sans-serif`;
      ctx.fillStyle    = isLight ? `rgba(15,23,42,${labelAlpha * 0.88})` : `rgba(223,232,255,${labelAlpha})`;
      ctx.textAlign    = onRight ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText(c.label, tx, sy);
    }
  }

  ctx.restore();
}

// ─── component ───────────────────────────────────────────────────────────────
export default function GlobeViz({ isLight = false }: { isLight?: boolean }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const lon0Ref    = useRef(32);
  const lastTRef   = useRef(0);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featuresRef  = useRef<any[]>([]);
  const hoveredIdRef = useRef<number | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);

  // load world data once
  useEffect(() => {
    import("world-atlas/countries-110m.json").then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = mod.default as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const col = feature(data, data.objects.countries) as any;
      featuresRef.current = col.features ?? [];
    });
  }, []);

  // setup canvas (DPR-aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width  = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = (t: number) => {
      if (t - lastTRef.current > 38) {
        lon0Ref.current = (lon0Ref.current + 0.17) % 360;
        lastTRef.current = t;

        drawGlobe(ctx, lon0Ref.current, featuresRef.current, hoveredIdRef.current, isLightRef.current);

        // update hover card position live (follows the rotating dot)
        if (cardRef.current && hoveredIdRef.current !== null) {
          const c = FEATURED.find((f) => f.id === hoveredIdRef.current);
          if (c) {
            const p = project(c.lat, c.lng, lon0Ref.current);
            cardRef.current.style.display = p.visible ? "block" : "none";
            cardRef.current.style.left = `${CX + p.x}px`;
            cardRef.current.style.top  = `${CY + p.y - 72}px`;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // intentionally empty — reads via refs

  // mouse move — find nearest featured country
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let closest: Country | null = null;
    let minDist = 22;
    for (const c of FEATURED) {
      const p = project(c.lat, c.lng, lon0Ref.current);
      if (!p.visible) continue;
      const d = Math.hypot(mx - (CX + p.x), my - (CY + p.y));
      if (d < minDist) { minDist = d; closest = c; }
    }
    hoveredIdRef.current = closest?.id ?? null;
    setHoveredCountry(closest);
    if (cardRef.current) {
      cardRef.current.style.display = closest ? "block" : "none";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredIdRef.current = null;
    setHoveredCountry(null);
    if (cardRef.current) cardRef.current.style.display = "none";
  }, []);

  return (
    <div className="relative select-none" style={{ width: SIZE, height: SIZE }}>
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        style={{ width: SIZE, height: SIZE }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover card — positioned via ref for zero-React-overhead updates */}
      <div
        ref={cardRef}
        style={{ display: "none", position: "absolute", transform: "translateX(-50%)", pointerEvents: "none", zIndex: 30 }}
      >
        <div
          className={`rounded-xl border px-3 py-2 shadow-xl backdrop-blur-sm text-left transition-transform duration-150 scale-105 ${
            isLight
              ? "bg-white/95 border-slate-200 shadow-slate-200/60 text-slate-900"
              : "bg-[#070e1f]/95 border-white/20 shadow-black/40 text-white"
          }`}
          style={{ minWidth: 100 }}
        >
          {hoveredCountry && (
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: FEATURED_COLOR }}
              />
              <span className="text-xs font-bold">{hoveredCountry.label}</span>
            </div>
          )}
        </div>
        {/* Connector line */}
        <div className={`mx-auto w-px h-3 ${isLight ? "bg-slate-300" : "bg-white/25"}`} />
      </div>

    </div>
  );
}
