"use client";
import { useEffect, useRef } from "react";

const BUBBLES = [
  { text: "I don't have any experience yet.", delay: 0 },
  { text: "I have experience, but I don't know where to apply it.", delay: 0.18 },
  { text: "I need mentorship and real opportunities, but I can't find them.", delay: 0.36 },
];

export default function ProblemAnimation({ isLight = false }: { isLight?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.72;
  }, []);

  return (
    <div className="problem-anim-wrap">
      {/* Speech bubbles — HTML overlay with correct text */}
      <div className="problem-bubbles-row" aria-label="Character speech bubbles">
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="problem-bubble-item"
            style={{ animationDelay: `${b.delay + 0.3}s` }}
          >
            <div className={`problem-bubble-box ${isLight ? "pb-light" : "pb-dark"}`}>
              {b.text}
            </div>
            <div className={`problem-bubble-tail ${isLight ? "pbt-light" : "pbt-dark"}`} />
          </div>
        ))}
      </div>

      {/* Video — mix-blend-mode:multiply makes white bg transparent in light mode */}
      <div
        className="problem-video-wrap"
        style={isLight ? {} : { borderRadius: "1rem", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}
      >
        <video
          ref={videoRef}
          src="/videos/problem-animation.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="problem-video"
          style={isLight ? { mixBlendMode: "multiply" } : { opacity: 0.92 }}
        />
      </div>
    </div>
  );
}
