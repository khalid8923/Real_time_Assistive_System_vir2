"use client";

import React, { memo, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Brain, Sparkles, Clock, Play, Pause, RotateCcw, History } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Layout constants                                                    */
/* ------------------------------------------------------------------ */
const PARENT_WIDTH = 220;
const PARENT_HEIGHT = 70;
const CHILD_WIDTH = 170;
const CHILD_HEIGHT = 54;
const MIN_RADIUS = 240;
const RADIUS_PER_CHILD = 26;
const CLUSTER_PADDING = 220;

type HandleSide = "top" | "right" | "bottom" | "left";
const HANDLE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};
const ALL_SIDES: HandleSide[] = ["top", "right", "bottom", "left"];

function angleToSide(angle: number): HandleSide {
  const twoPi = Math.PI * 2;
  const normalized = ((angle % twoPi) + twoPi) % twoPi;
  const deg = (normalized * 180) / Math.PI;
  if (deg >= 45 && deg < 135) return "bottom";
  if (deg >= 135 && deg < 225) return "left";
  if (deg >= 225 && deg < 315) return "top";
  return "right";
}

interface NodeLabelData {
  label: string;
  isNew?: boolean;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Custom Node Renderers                                              */
/* ------------------------------------------------------------------ */

const ParentNode = memo(function ParentNode({
  data,
}: NodeProps<NodeLabelData>) {
  return (
    <div style={{ width: PARENT_WIDTH }} className="relative">
      {ALL_SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={HANDLE_POSITION[side]}
          className="h-2 w-2 border-0 bg-primary opacity-0"
        />
      ))}
      <div
        className={cn(
          "glow-primary flex min-h-16 items-center justify-center rounded-2xl border border-primary/40 bg-linear-to-br from-primary via-primary to-accent-1 px-5 py-4 text-center shadow-lg",
          data.isNew && "ring-4 ring-emerald-500/40"
        )}
      >
        <p className="text-[15px] leading-snug font-bold tracking-wide text-white">
          {data.label}
        </p>
      </div>
    </div>
  );
});
ParentNode.displayName = "ParentNode";

const ChildNode = memo(function ChildNode({
  data,
}: NodeProps<NodeLabelData>) {
  return (
    <div style={{ width: CHILD_WIDTH }} className="relative">
      {ALL_SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="target"
          position={HANDLE_POSITION[side]}
          className="h-1.5 w-1.5 border-0 bg-primary/40 opacity-0"
        />
      ))}
      <div
        className={cn(
          "flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-3.5 py-2.5 text-center shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/60",
          data.isNew && "ring-2 ring-emerald-500/40 border-emerald-500/60"
        )}
      >
        <p className="text-[13px] leading-snug text-foreground">
          {data.label}
        </p>
      </div>
    </div>
  );
});
ChildNode.displayName = "ChildNode";

const nodeTypes: NodeTypes = {
  parentNode: ParentNode,
  childNode: ChildNode,
};

/* ------------------------------------------------------------------ */
/* Public types                                                       */
/* ------------------------------------------------------------------ */

export interface MindMapTopic {
  topic: string;
  children: string[];
  firstSeenAt?: number; // NEW: timestamp when this topic was first detected
}

/* ------------------------------------------------------------------ */
/* Layout builder                                                     */
/* ------------------------------------------------------------------ */

function buildLayout(
  topics: MindMapTopic[],
  highlightNew: Set<string>
): { nodes: Node<NodeLabelData>[]; edges: Edge[] } {
  const nodes: Node<NodeLabelData>[] = [];
  const edges: Edge[] = [];
  const clusterCount = topics.length;
  if (clusterCount === 0) return { nodes, edges };

  const radii = topics.map((t) =>
    Math.max(MIN_RADIUS, 90 + t.children.length * RADIUS_PER_CHILD)
  );
  const maxRadius = Math.max(...radii);
  const cellSize = maxRadius * 2 + CLUSTER_PADDING;
  const columns = Math.max(1, Math.ceil(Math.sqrt(clusterCount)));

  topics.forEach((topicData, clusterIndex) => {
    const col = clusterIndex % columns;
    const row = Math.floor(clusterIndex / columns);
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const radius = radii[clusterIndex];

    const parentId = `topic-${clusterIndex}`;
    nodes.push({
      id: parentId,
      type: "parentNode",
      position: {
        x: centerX - PARENT_WIDTH / 2,
        y: centerY - PARENT_HEIGHT / 2,
      },
      data: {
        label: topicData.topic,
        isNew: highlightNew.has(topicData.topic),
      },
    });

    const childCount = topicData.children.length;
    topicData.children.forEach((childLabel, childIndex) => {
      const angle =
        childCount > 0
          ? (2 * Math.PI * childIndex) / childCount - Math.PI / 2
          : 0;
      const childX = centerX + radius * Math.cos(angle);
      const childY = centerY + radius * Math.sin(angle);
      const childId = `topic-${clusterIndex}-child-${childIndex}`;

      nodes.push({
        id: childId,
        type: "childNode",
        position: {
          x: childX - CHILD_WIDTH / 2,
          y: childY - CHILD_HEIGHT / 2,
        },
        data: {
          label: childLabel,
          isNew: highlightNew.has(childLabel),
        },
      });

      const sourceSide = angleToSide(angle);
      const targetSide = angleToSide(angle + Math.PI);

      edges.push({
        id: `edge-${clusterIndex}-${childIndex}`,
        source: parentId,
        target: childId,
        sourceHandle: sourceSide,
        targetHandle: targetSide,
        type: "smoothstep",
        style: {
          stroke: "var(--color-violet-500)",
          strokeWidth: 1.75,
          opacity: 0.6,
        },
      });
    });
  });

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* Time-lapse helpers                                                 */
/* ------------------------------------------------------------------ */

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

interface MindMapProps {
  topics: MindMapTopic[];
}

export default function MindMap({ topics }: MindMapProps) {
  const [timelineMode, setTimelineMode] = useState(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [playing, setPlaying] = useState(false);

  // احسب النطاق الزمني
  const timeRange = useMemo(() => {
    const times = topics
      .map((t) => t.firstSeenAt ?? 0)
      .filter((t) => t > 0);
    if (times.length === 0) return { min: 0, max: 0, span: 0 };
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { min, max, span: max - min };
  }, [topics]);

  // الخريطة اللي بتظهر حسب الوقت
  const visibleTopics = useMemo(() => {
    if (!timelineMode || timeRange.span === 0) return topics;
    const cutoff = timeRange.min + playbackTime;
    return topics.filter((t) => (t.firstSeenAt ?? 0) <= cutoff);
  }, [topics, timelineMode, playbackTime, timeRange]);

  // العقد الجديدة (ظهرت في آخر 15% من الـ slider)
  const highlightNew = useMemo(() => {
    if (!timelineMode || timeRange.span === 0) return new Set<string>();
    const cutoff = timeRange.min + playbackTime;
    const recent = timeRange.span * 0.15;
    const highlight = new Set<string>();
    for (const t of topics) {
      const ts = t.firstSeenAt ?? 0;
      if (ts <= cutoff && ts > cutoff - recent) {
        highlight.add(t.topic);
      }
    }
    return highlight;
  }, [topics, timelineMode, playbackTime, timeRange]);

  // Auto-play
  React.useEffect(() => {
    if (!playing || !timelineMode) return;
    if (playbackTime >= timeRange.span) {
      setPlaying(false);
      return;
    }
    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + timeRange.span * 0.03;
        if (next >= timeRange.span) {
          setPlaying(false);
          return timeRange.span;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, timelineMode, playbackTime, timeRange.span]);

  // Reset playback when entering timeline mode
  React.useEffect(() => {
    if (timelineMode) {
      setPlaybackTime(timeRange.span);
    } else {
      setPlaybackTime(0);
      setPlaying(false);
    }
  }, [timelineMode, timeRange.span]);

  const { nodes, edges } = useMemo(
    () => buildLayout(visibleTopics, highlightNew),
    [visibleTopics, highlightNew]
  );

  const isEmpty = topics.length === 0;
  const canTimeline = timeRange.span > 0;
  const currentTime = timelineMode ? timeRange.min + playbackTime : 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">الخريطة الذهنية</h2>
            <p className="text-[10px] text-muted-foreground">
              {isEmpty
                ? "في انتظار المحتوى"
                : timelineMode
                ? `${visibleTopics.length} / ${topics.length} موضوع · ${formatTime(currentTime)}`
                : `${topics.length} موضوع`}
            </p>
          </div>
        </div>

        {canTimeline && !isEmpty && (
          <button
            type="button"
            onClick={() => setTimelineMode((m) => !m)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-colors",
              timelineMode
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-primary"
            )}
          >
            <History className="h-3.5 w-3.5" />
            {timelineMode ? "وضع عادي" : "Time-lapse"}
          </button>
        )}
      </div>

      <div className="p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              في انتظار بدء الشرح لرسم الخريطة الذهنية...
            </p>
          </div>
        ) : (
          <>
            <div className="h-150 w-full overflow-hidden rounded-xl border border-border bg-muted/20">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                nodesConnectable={false}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.1}
                maxZoom={1.5}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  color="var(--color-gray-300)"
                />
                <Controls className="rounded-lg! border! border-border! shadow-md!" />
                <MiniMap
                  nodeColor={(node) =>
                    node.type === "parentNode"
                      ? "var(--color-violet-500)"
                      : "var(--color-sky-500)"
                  }
                  maskColor="rgba(0,0,0,0.4)"
                  className="rounded-lg! border! border-border!"
                />
              </ReactFlow>
            </div>

            {/* Timeline slider */}
            {timelineMode && canTimeline && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-linear-to-l from-primary/5 to-accent-2/5 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (playbackTime >= timeRange.span) {
                          setPlaybackTime(0);
                          setPlaying(true);
                        } else {
                          setPlaying((p) => !p);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-md transition-transform hover:scale-105"
                      aria-label={playing ? "إيقاف" : "تشغيل"}
                    >
                      {playing ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackTime(0);
                        setPlaying(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
                      aria-label="من البداية"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono font-bold text-foreground" dir="ltr">
                        {formatTime(currentTime)}
                      </span>
                      <span>/</span>
                      <span className="font-mono" dir="ltr">
                        {formatTime(timeRange.max)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                      {visibleTopics.length} / {topics.length}
                    </span>
                    <span className="text-muted-foreground">موضوع</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={timeRange.span}
                  step={timeRange.span / 200}
                  value={playbackTime}
                  onChange={(e) => {
                    setPlaybackTime(Number(e.target.value));
                    setPlaying(false);
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}