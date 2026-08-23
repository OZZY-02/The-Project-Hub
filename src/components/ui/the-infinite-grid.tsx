"use client";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from "framer-motion";

interface InfiniteGridProps {
  isLight?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function InfiniteGrid({ isLight = false, className, children }: InfiniteGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.4) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.4) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  const baseColor  = isLight ? "rgba(34,88,209,0.05)"  : "rgba(143,183,255,0.05)";
  const activeColor = isLight ? "rgba(34,88,209,0.55)" : "rgba(143,183,255,0.55)";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {/* Base ghost grid — almost invisible */}
      <div className="absolute inset-0">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} color={baseColor} />
      </div>

      {/* Hover spotlight — slightly brighter under cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} color={activeColor} />
      </motion.div>

      {children}
    </div>
  );
}

function GridPattern({
  offsetX,
  offsetY,
  color,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offsetX: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offsetY: any;
  color: string;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={`grid-${id}`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
    </svg>
  );
}
