"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  isLight?: boolean;
}

export default function RadialOrbitalTimeline({
  timelineData,
  isLight = false,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulse: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulse[relId] = true; });
        setPulseEffect(newPulse);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => Number(((prev + 0.25) % 360).toFixed(3)));
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 180;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const item = timelineData.find((i) => i.id === itemId);
    return item ? item.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusLabel = (status: TimelineItem["status"]) => {
    if (status === "completed") return "DONE";
    if (status === "in-progress") return "ACTIVE";
    return "NEXT";
  };

  const getNodeColors = (isExpanded: boolean, isRelated: boolean, isLight: boolean) => {
    if (isExpanded) {
      return isLight
        ? "bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-900/20"
        : "bg-white text-slate-950 border-white shadow-lg shadow-white/20";
    }
    if (isRelated) {
      return isLight
        ? "bg-[#2258d1]/20 text-[#2258d1] border-[#2258d1] animate-pulse"
        : "bg-[#8fb7ff]/20 text-[#8fb7ff] border-[#8fb7ff] animate-pulse";
    }
    return isLight
      ? "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
      : "bg-white/5 text-[#8d9ab5] border-white/20 hover:border-white/40";
  };

  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: "520px" }}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div
        className="absolute w-full h-full flex items-center justify-center"
        ref={orbitRef}
        style={{ perspective: "1000px" }}
      >
        {/* Center orb */}
        <div className="absolute z-10 flex items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center relative ${
              isLight
                ? "bg-gradient-to-br from-[#2258d1] via-[#4a7ee8] to-[#18c29c]"
                : "bg-gradient-to-br from-[#1a46ab] via-[#8fb7ff] to-[#18c29c]"
            } animate-pulse`}
          >
            <div className="absolute w-20 h-20 rounded-full border border-current opacity-20 animate-ping" />
            <div
              className="absolute w-28 h-28 rounded-full border border-current opacity-10 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
            <div className={`w-7 h-7 rounded-full backdrop-blur-md ${isLight ? "bg-white/90" : "bg-white/70"}`} />
          </div>
        </div>

        {/* Orbit ring */}
        <div
          className={`absolute w-[360px] h-[360px] rounded-full border ${
            isLight ? "border-slate-200" : "border-white/10"
          }`}
        />

        {/* Nodes */}
        {timelineData.map((item, index) => {
          const position = calculateNodePosition(index, timelineData.length);
          const isExpanded = expandedItems[item.id];
          const isRelated = isRelatedToActive(item.id);
          const isPulsing = pulseEffect[item.id];
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              ref={(el) => { nodeRefs.current[item.id] = el; }}
              className="absolute transition-all duration-700 cursor-pointer select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: isExpanded ? 200 : position.zIndex,
                opacity: isExpanded ? 1 : position.opacity,
              }}
              onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
            >
              {/* Energy glow */}
              {isPulsing && (
                <div
                  className="absolute rounded-full animate-pulse pointer-events-none"
                  style={{
                    background: isLight
                      ? `radial-gradient(circle, rgba(34,88,209,0.15) 0%, transparent 70%)`
                      : `radial-gradient(circle, rgba(143,183,255,0.15) 0%, transparent 70%)`,
                    width: `${item.energy * 0.4 + 44}px`,
                    height: `${item.energy * 0.4 + 44}px`,
                    left: `-${(item.energy * 0.4 + 44 - 40) / 2}px`,
                    top: `-${(item.energy * 0.4 + 44 - 40) / 2}px`,
                  }}
                />
              )}

              {/* Icon button */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isExpanded ? "scale-150" : ""
                } ${getNodeColors(isExpanded, isRelated, isLight)}`}
              >
                <Icon size={15} />
              </div>

              {/* Label */}
              <div
                className={`absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isExpanded
                    ? isLight ? "text-slate-950 scale-110" : "text-white scale-110"
                    : isLight ? "text-slate-500" : "text-white/60"
                }`}
              >
                {item.title}
              </div>

              {/* Expanded card */}
              {isExpanded && (
                <Card
                  className={`absolute top-20 left-1/2 -translate-x-1/2 w-60 backdrop-blur-lg overflow-visible shadow-xl ${
                    isLight
                      ? "bg-white/95 border-slate-200 shadow-slate-200/60"
                      : "bg-[#050816]/95 border-white/20 shadow-white/5"
                  }`}
                >
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 ${
                      isLight ? "bg-slate-300" : "bg-white/30"
                    }`}
                  />
                  <CardHeader className="pb-2 px-4 pt-4">
                    <div className="flex justify-between items-center">
                      <Badge
                        className={`px-2 text-[10px] border ${
                          item.status === "completed"
                            ? isLight ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-950 border-white"
                            : item.status === "in-progress"
                            ? isLight ? "bg-[#2258d1] text-white border-[#2258d1]" : "bg-[#8fb7ff] text-slate-950 border-[#8fb7ff]"
                            : isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-white/10 text-white/50 border-white/20"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                      <span className={`text-[10px] font-mono ${isLight ? "text-slate-400" : "text-white/40"}`}>
                        {item.date}
                      </span>
                    </div>
                    <CardTitle className={`text-sm mt-2 ${isLight ? "text-slate-950" : "text-white"}`}>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`text-xs px-4 pb-4 ${isLight ? "text-slate-500" : "text-white/70"}`}>
                    <p>{item.content}</p>

                    <div className={`mt-3 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/10"}`}>
                      <div className={`flex justify-between text-[10px] mb-1 ${isLight ? "text-slate-400" : "text-white/40"}`}>
                        <span className="flex items-center gap-1">
                          <Zap size={9} />
                          Signal strength
                        </span>
                        <span className="font-mono">{item.energy}%</span>
                      </div>
                      <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-white/10"}`}>
                        <div
                          className="h-full bg-gradient-to-r from-[#2258d1] to-[#18c29c]"
                          style={{ width: `${item.energy}%` }}
                        />
                      </div>
                    </div>

                    {item.relatedIds.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/10"}`}>
                        <div className="flex items-center gap-1 mb-2">
                          <Link size={9} className={isLight ? "text-slate-400" : "text-white/40"} />
                          <span className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/40"}`}>
                            Connected steps
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.relatedIds.map((relId) => {
                            const rel = timelineData.find((i) => i.id === relId);
                            return (
                              <Button
                                key={relId}
                                variant="outline"
                                size="sm"
                                className={`h-6 px-2 text-[10px] rounded-full border transition-all ${
                                  isLight
                                    ? "border-slate-200 bg-transparent hover:bg-slate-50 text-slate-600"
                                    : "border-white/20 bg-transparent hover:bg-white/10 text-white/60"
                                }`}
                                onClick={(e) => { e.stopPropagation(); toggleItem(relId); }}
                              >
                                {rel?.title}
                                <ArrowRight size={8} className="ml-1 opacity-50" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
