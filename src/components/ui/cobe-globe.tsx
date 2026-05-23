"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"

interface Marker {
  id: string
  location: [number, number]
  label: string
}

interface GlobeProps {
  markers?: Marker[]
  className?: string
  markerColor?: [number, number, number]
  baseColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  markerSize?: number
  markerElevation?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
}

export function CobeGlobe({
  markers = [],
  className = "",
  markerColor = [0.3, 0.45, 0.85],
  baseColor = [1, 1, 1],
  glowColor = [0.94, 0.93, 0.91],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.025,
  markerElevation = 0.01,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!pointerInteracting.current) return
    const deltaX = e.clientX - pointerInteracting.current.x
    const deltaY = e.clientY - pointerInteracting.current.y
    dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
    const now = Date.now()
    if (lastPointer.current) {
      const dt = Math.max(now - lastPointer.current.t, 1)
      const cap = 0.15
      velocity.current = {
        phi:   Math.max(-cap, Math.min(cap, ((e.clientX - lastPointer.current.x) / dt) * 0.3)),
        theta: Math.max(-cap, Math.min(cap, ((e.clientY - lastPointer.current.y) / dt) * 0.08)),
      }
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup",   handlePointerUp,   { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup",   handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas!.offsetWidth
      if (width === 0 || globe) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      globe = createGlobe(canvas!, {
        devicePixelRatio: dpr,
        width,
        height: width,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markers.map((m) => ({ location: m.location, size: markerSize, id: m.id })),
        arcs: [],
        arcColor: [0, 0, 0],
        arcWidth: 0,
        arcHeight: 0,
        opacity: 0.85,
      })

      function animate() {
        if (!isPausedRef.current) {
          phi += speed
          if (Math.abs(velocity.current.phi) > 0.0001 || Math.abs(velocity.current.theta) > 0.0001) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi   *= 0.95
            velocity.current.theta *= 0.95
          }
          const tMin = -0.4, tMax = 0.4
          if (thetaOffsetRef.current < tMin) thetaOffsetRef.current += (tMin - thetaOffsetRef.current) * 0.1
          if (thetaOffsetRef.current > tMax) thetaOffsetRef.current += (tMax - thetaOffsetRef.current) * 0.1
        }
        globe!.update({
          phi:   phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark,
          mapBrightness,
          markerColor,
          baseColor,
          markerElevation,
          markers: markers.map((m) => ({ location: m.location, size: markerSize, id: m.id })),
        })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => { if (canvas) canvas.style.opacity = "1" })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init() }
      })
      ro.observe(canvas)
      return () => ro.disconnect()
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%", height: "100%",
          cursor: "grab", opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {/* Marker labels */}
      {markers.map((m) => {
        const isDarkGlobe = dark === 1; // dark=1 means website light mode (dark ocean globe)
        const boxBg   = isDarkGlobe ? "#0f172a" : "#ffffff";
        const textClr = isDarkGlobe ? "#ffffff" : "#0f172a";
        const tailClr = boxBg;
        return (
          <div
            key={m.id}
            style={{
              position: "absolute",
              // @ts-ignore CSS Anchor Positioning (Chrome 125+)
              positionAnchor: `--cobe-${m.id}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              translate: "-50% 0",
              marginBottom: 12,
              pointerEvents: "none" as const,
              opacity: `var(--cobe-visible-${m.id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
              transition: "opacity 0.6s, filter 0.6s",
            }}
          >
            {/* Label box */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px 5px 8px",
              borderRadius: 7,
              background: boxBg,
              color: textClr,
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              whiteSpace: "nowrap" as const,
              boxShadow: isDarkGlobe
                ? "0 2px 10px rgba(0,0,0,0.35)"
                : "0 2px 10px rgba(0,0,0,0.15)",
            }}>
              {/* Blinking live dot */}
              <span style={{
                width: 7, height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                flexShrink: 0,
                animation: "sudanLiveBlink 1.5s ease-in-out infinite",
              }} />
              {m.label}
            </div>
            {/* Downward tail */}
            <div style={{
              margin: "0 auto",
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${tailClr}`,
            }} />
          </div>
        );
      })}
    </div>
  )
}
