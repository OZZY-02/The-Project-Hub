"use client";
import { useEffect, useState } from "react";

const BUBBLES = [
  "I don't have any experience yet.",
  "I have experience, but I don't know where to apply it.",
  "I need mentorship and real opportunities, but I can't find them.",
];
const PHASE_MS = 3600;

export default function ProblemCharacters({ isLight = false }: { isLight?: boolean }) {
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const boot = setTimeout(() => {
      setPhase(0);
      interval = setInterval(() => setPhase((p) => (p + 1) % 3), PHASE_MS);
    }, 500);
    return () => { clearTimeout(boot); clearInterval(interval); };
  }, []);

  const bubbleStyle = (i: number): React.CSSProperties => ({
    opacity: phase === i ? 1 : 0,
    transform: phase === i ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
    pointerEvents: "none",
  });

  const boxCls = isLight
    ? "bg-white border border-slate-200 shadow-lg text-slate-800"
    : "bg-slate-800/95 border border-white/15 text-white shadow-xl backdrop-blur-md";
  const tailClr = isLight ? "white" : "rgb(30,41,59)";

  return (
    <div className="relative w-full select-none overflow-visible">

      {/* Floating "?" decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {([
          { l: "2%",  t: "40%", size: 62, delay: 0,    dur: 3.2 },
          { l: "25%", t: "18%", size: 40, delay: 0.9,  dur: 2.7 },
          { l: "65%", t: "15%", size: 44, delay: 0.4,  dur: 3.5 },
          { l: "88%", t: "35%", size: 64, delay: 1.3,  dur: 3.0 },
        ] as { l: string; t: string; size: number; delay: number; dur: number }[]).map((q, i) => (
          <span
            key={i}
            className={`absolute font-black leading-none ${isLight ? "text-slate-200/80" : "text-white/12"}`}
            style={{ left: q.l, top: q.t, fontSize: q.size, animation: `floatQ ${q.dur}s ease-in-out ${q.delay}s infinite alternate` }}
          >?</span>
        ))}
      </div>

      {/* Characters + speech bubbles row */}
      <div className="flex items-end justify-around w-full">
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>

            {/* Bubble slot — fixed height so all chars align at bottom */}
            <div className="flex items-end justify-center w-full pb-2" style={{ height: 104 }}>
              <div
                className={`relative rounded-2xl px-3.5 py-2.5 font-semibold leading-snug text-center ${boxCls}`}
                style={{ ...bubbleStyle(i), maxWidth: 148, fontSize: "0.695rem" }}
              >
                {BUBBLES[i]}
                {/* Tail */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{
                  bottom: -9, width: 0, height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: `9px solid ${tailClr}`,
                }} />
              </div>
            </div>

            {/* Character image — fixed height so all align consistently */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {i === 0 && <WomanChar   active={phase === 0} />}
              {i === 1 && <ManChar     active={phase === 1} />}
              {i === 2 && <GlassesChar active={phase === 2} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Shared char image style — fixed height keeps all 3 the same size */
const CHAR_H = 200;

function CharImg({ src, anim, animKey }: { src: string; anim?: string; animKey?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        height: CHAR_H,
        width: "auto",
        objectFit: "contain",
        display: "block",
        animation: anim,
        transformOrigin: "bottom center",
      }}
      key={animKey}
    />
  );
}

/* ─── Character 1: Woman with hijab ──────────────────────────────────────── */
function WomanChar({ active }: { active: boolean }) {
  return <CharImg src="/images/woman-char.png" anim={active ? "womanTalk 1s ease-in-out infinite alternate" : undefined} />;
}

/* ─── Character 2: Man scratching head ───────────────────────────────────── */
function ManChar({ active }: { active: boolean }) {
  return <CharImg src="/images/man-char.png" anim={active ? "womanTalk 0.85s ease-in-out 0.1s infinite alternate" : undefined} />;
}

/* ─── Character 3: Man with glasses ──────────────────────────────────────── */
function GlassesChar({ active }: { active: boolean }) {
  return <CharImg src="/images/glasses-char.png" anim={active ? "womanTalk 1.05s ease-in-out 0.05s infinite alternate" : undefined} />;
}
