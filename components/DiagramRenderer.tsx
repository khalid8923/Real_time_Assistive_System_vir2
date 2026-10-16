"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ArrowRight, Circle, Square, Triangle, Zap, Star, Flag, Check, X,
  Cpu, Database, Cloud, Server, Code, Terminal, GitBranch, GitMerge,
  Layers, Box, Boxes, Package, File, Folder, Brain, Network, Share2,
  Link2, Workflow, Activity, TrendingUp, RefreshCw, RotateCw, Repeat,
  Hash, Binary, Key, Lock, Settings, Wrench, Hammer, Beaker, Atom,
  FunctionSquare, Pi, Sigma, Plus, Minus, Divide, Equal, Calculator,
  Book, Lightbulb, Target, Compass, Map,
} from "lucide-react";
import type { GeneratedDiagram, DiagramNode } from "@/lib/ai-types";

/* ------------------------------------------------------------------ */
/* Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, React.ElementType> = {
  "arrow-right": ArrowRight, circle: Circle, square: Square, triangle: Triangle,
  zap: Zap, star: Star, flag: Flag, check: Check, x: X,
  cpu: Cpu, database: Database, cloud: Cloud, server: Server,
  code: Code, terminal: Terminal, "git-branch": GitBranch,
  "git-merge": GitMerge, layers: Layers, box: Box, boxes: Boxes,
  package: Package, file: File, folder: Folder, brain: Brain,
  network: Network, share: Share2, link: Link2, workflow: Workflow,
  activity: Activity, "trending-up": TrendingUp, "refresh-cw": RefreshCw,
  "rotate-cw": RotateCw, repeat: Repeat, hash: Hash, binary: Binary,
  key: Key, lock: Lock, settings: Settings, wrench: Wrench,
  hammer: Hammer, beaker: Beaker, atom: Atom,
  "function-square": FunctionSquare, pi: Pi, sigma: Sigma,
  plus: Plus, minus: Minus, divide: Divide, equal: Equal,
  calculator: Calculator, book: Book, lightbulb: Lightbulb,
  target: Target, compass: Compass, map: Map,
};

function getIcon(name?: string): React.ElementType {
  if (name && ICONS[name]) return ICONS[name];
  return Circle;
}

/* ------------------------------------------------------------------ */
/* Node pill                                                          */
/* ------------------------------------------------------------------ */

function NodePill({
  node,
  emphasis,
  compact = false,
}: {
  node: DiagramNode;
  emphasis: boolean;
  compact?: boolean;
}) {
  const Icon = getIcon(node.icon);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex ${compact ? "flex-row" : "flex-col"} items-center gap-2 rounded-xl border-2 px-3 py-2 transition-all ${
        emphasis
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          emphasis ? "bg-primary text-white" : "bg-muted text-primary"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className={compact ? "text-right" : "text-center"}>
        <p className="text-[11px] font-bold leading-tight text-foreground">
          {node.label}
        </p>
        {node.detail && (
          <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground line-clamp-2">
            {node.detail}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. SEQUENCE                                                        */
/* ------------------------------------------------------------------ */

function SequenceRenderer({
  diagram,
  emphasisSet,
}: {
  diagram: GeneratedDiagram;
  emphasisSet: Set<string>;
}) {
  const { nodes } = diagram;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4">
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <NodePill node={node} emphasis={emphasisSet.has(node.id)} />
          {i < nodes.length - 1 && (
            <ArrowRight className="h-5 w-5 shrink-0 text-primary/60" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. CYCLE                                                           */
/* ------------------------------------------------------------------ */

function CycleRenderer({
  diagram,
  emphasisSet,
}: {
  diagram: GeneratedDiagram;
  emphasisSet: Set<string>;
}) {
  const { nodes } = diagram;
  const count = nodes.length;
  const radius = 130;
  const size = 340;
  const center = size / 2;

  return (
    <div className="flex justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#8470ff" opacity={0.6} />
            </marker>
          </defs>
          {nodes.map((_, i) => {
            const angle1 = (2 * Math.PI * i) / count - Math.PI / 2;
            const angle2 = (2 * Math.PI * (i + 1)) / count - Math.PI / 2;
            const x1 = center + radius * Math.cos(angle1);
            const y1 = center + radius * Math.sin(angle1);
            const x2 = center + radius * Math.cos(angle2);
            const y2 = center + radius * Math.sin(angle2);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#8470ff"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.4}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>
        {nodes.map((node, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <NodePill node={node} emphasis={emphasisSet.has(node.id)} />
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5">
            <Repeat className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. HIERARCHY                                                       */
/* ------------------------------------------------------------------ */

function HierarchyRenderer({
  diagram,
  emphasisSet,
}: {
  diagram: GeneratedDiagram;
  emphasisSet: Set<string>;
}) {
  const { nodes, relations } = diagram;

  // Find root: node with no incoming "part_of" relations
  const incoming = new Set(
    relations.filter((r) => r.type === "part_of" || r.type === "contains").map((r) => r.to)
  );
  const root = nodes.find((n) => !incoming.has(n.id)) ?? nodes[0];
  const children = relations
    .filter((r) => r.from === root.id && (r.type === "part_of" || r.type === "contains"))
    .map((r) => nodes.find((n) => n.id === r.to))
    .filter((n): n is DiagramNode => !!n);

  const rest = children.length > 0
    ? children
    : nodes.filter((n) => n.id !== root.id);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <NodePill node={root} emphasis={emphasisSet.has(root.id)} />
      <div className="h-6 w-px bg-primary/40" />
      <div className="flex flex-wrap items-start justify-center gap-4">
        {rest.map((node) => (
          <div key={node.id} className="flex flex-col items-center">
            <div className="h-4 w-px bg-primary/40" />
            <NodePill node={node} emphasis={emphasisSet.has(node.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. COMPARISON                                                      */
/* ------------------------------------------------------------------ */

function ComparisonRenderer({
  diagram,
  emphasisSet,
}: {
  diagram: GeneratedDiagram;
  emphasisSet: Set<string>;
}) {
  const { nodes } = diagram;
  const half = Math.ceil(nodes.length / 2);
  const left = nodes.slice(0, half);
  const right = nodes.slice(half);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="space-y-3 rounded-xl border-2 border-sky-500/30 bg-sky-500/5 p-3">
        {left.map((n) => (
          <NodePill key={n.id} node={n} emphasis={emphasisSet.has(n.id)} />
        ))}
      </div>
      <div className="flex items-center justify-center">
        <div className="rounded-full border-2 border-primary/40 bg-background px-3 py-1.5 text-xs font-bold text-primary">
          VS
        </div>
      </div>
      <div className="space-y-3 rounded-xl border-2 border-violet-500/30 bg-violet-500/5 p-3">
        {right.map((n) => (
          <NodePill key={n.id} node={n} emphasis={emphasisSet.has(n.id)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. LAYERS                                                          */
/* ------------------------------------------------------------------ */

function LayersRenderer({
  diagram,
  emphasisSet,
}: {
  diagram: GeneratedDiagram;
  emphasisSet: Set<string>;
}) {
  const { nodes } = diagram;
  return (
    <div className="space-y-2 p-4">
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`rounded-xl border-2 p-3 transition-all ${
            emphasisSet.has(node.id)
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/40"
          }`}
          style={{
            background: `linear-gradient(135deg, rgba(132,112,255,${0.05 + i * 0.04}) 0%, rgba(103,191,255,${0.03 + i * 0.03}) 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background font-mono text-[10px] font-bold text-primary shadow-sm">
              L{i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getIcon(node.icon);
                  return <Icon className="h-3.5 w-3.5 text-primary" />;
                })()}
                <p className="text-xs font-bold text-foreground">{node.label}</p>
              </div>
              {node.detail && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {node.detail}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main dispatcher                                                    */
/* ------------------------------------------------------------------ */

export default function DiagramRenderer({
  diagram,
}: {
  diagram: GeneratedDiagram;
}) {
  const emphasisSet = new Set(diagram.emphasis ?? []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/10">
      {diagram.shape === "sequence" && (
        <SequenceRenderer diagram={diagram} emphasisSet={emphasisSet} />
      )}
      {diagram.shape === "cycle" && (
        <CycleRenderer diagram={diagram} emphasisSet={emphasisSet} />
      )}
      {diagram.shape === "hierarchy" && (
        <HierarchyRenderer diagram={diagram} emphasisSet={emphasisSet} />
      )}
      {diagram.shape === "comparison" && (
        <ComparisonRenderer diagram={diagram} emphasisSet={emphasisSet} />
      )}
      {diagram.shape === "layers" && (
        <LayersRenderer diagram={diagram} emphasisSet={emphasisSet} />
      )}
    </div>
  );
}