/* ============ Keywords ============ */

export type KeywordCategory =
  | "term"
  | "concept"
  | "person"
  | "place"
  | "number"
  | "tool";

export interface Keyword {
  word: string;
  category: KeywordCategory;
  importance: number;
  context: string;
}

/* ============ Flashcards ============ */

export type FlashcardDifficulty = "easy" | "medium" | "hard";

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: FlashcardDifficulty;
}

/* ============ Action Items ============ */

export interface ActionItem {
  id: string;
  type: "exam" | "assignment" | "deadline" | "page" | "important" | "note";
  title: string;
  details: string;
  urgency: "high" | "medium" | "low";
  detectedAt: number;
}

/* ============ Classroom Questions ============ */

export interface ClassroomQuestion {
  id: string;
  inferredQuestion: string;
  answer: string;
  confidence: "high" | "medium" | "low";
  detectedAt: number;
}

/* ============ Translation ============ */

export type TranslationType =
  | "technical"
  | "concept"
  | "tool"
  | "framework"
  | "general";

export interface Translation {
  original: string;
  translated: string;
  type: TranslationType;
  context: string;
  pronunciation?: string;
}

/* ============ Comparison Tables (Feature #1) ============ */

export type CellSource = "lecture" | "inferred";

export interface ComparisonItem {
  name: string;
  source: CellSource;
}

export interface ComparisonCell {
  value: string;
  source: CellSource;
  quote?: string;
}

export interface ComparisonCriterion {
  name: string;
  values: ComparisonCell[];
}

export interface ComparisonTable {
  id: string;
  title: string;
  subtitle?: string;
  items: ComparisonItem[];
  criteria: ComparisonCriterion[];
  detectedAt: number;
}

/* ============ Visualizations (Infographic) ============ */

export type VisualizationType =
  | "flowchart"
  | "bar-chart"
  | "line-chart"
  | "pie-chart"
  | "comparison-table"
  | "timeline"
  | "none";

export interface FlowchartData {
  mermaidCode: string;
  title: string;
  description: string;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "radar";
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface InfographicComparisonTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
}

export interface Visualization {
  type: VisualizationType;
  flowchart?: FlowchartData;
  chart?: ChartData;
  table?: InfographicComparisonTable;
  timeline?: TimelineEvent[];
  rawText?: string;
}

export interface InfographicSection {
  id: string;
  title: string;
  type: VisualizationType;
  visualization: Visualization;
}
/* ============ Analogy Map (Feature #2) ============ */

export interface AnalogyMapping {
  sourceTerm: string;
  targetTerm: string;
  note?: string;
}

export interface AnalogyMap {
  id: string;
  title: string;
  sourceConcept: string;
  sourceEmoji: string;
  targetConcept: string;
  targetEmoji: string;
  mappings: AnalogyMapping[];
  breaks: string[];
  quote?: string;
  detectedAt: number;
}

/* ============ Lecture Timeline (Feature #3) ============ */

export interface TimelineSegment {
  index: number;
  startMs: number;
  endMs: number;
  wordCount: number;
  density: number;
  preview: string;
}

export interface TimelineMarker {
  id: string;
  type: "exam" | "assignment" | "important" | "board";
  label: string;
  timestampMs: number;
}

/* ============ Equations (Feature #4) ============ */

export interface EquationVariable {
  name: string;
  meaning: string;
  default: number;
  min: number;
  max: number;
  unit?: string;
}

export interface CapturedEquation {
  id: string;
  name: string;
  spoken: string;
  latex: string;
  expression: string;
  outputLabel: string;
  outputUnit?: string;
  variables: EquationVariable[];
  confidence: "high" | "medium" | "low";
  sourceQuote?: string;
  detectedAt: number;
}

/* ============ Cloze Progress (Feature #5) ============ */

export interface ClozeCell {
  id: string;
  originalValue: string;
  hint?: string;
}

/* ============ Equations (Feature #4) ============ */

export interface EquationVariable {
  name: string;
  meaning: string;
  default: number;
  min: number;
  max: number;
  unit?: string;
}

export interface CapturedEquation {
  id: string;
  name: string;
  spoken: string;
  latex: string;
  expression: string;
  outputLabel: string;
  outputUnit?: string;
  variables: EquationVariable[];
  confidence: "high" | "medium" | "low";
  sourceQuote?: string;
  detectedAt: number;
}

/* ============ Cloze Progress (Feature #5) ============ */

export interface ClozeCell {
  id: string;
  originalValue: string;
  hint?: string;
}

/* ============ Exploded System View (Feature #6) ============ */

export interface SystemLayer {
  id: string;
  name: string;
  role: string;
  examples: string[];
  input?: string;
  output?: string;
}

export interface SystemStep {
  step: number;
  from: string;
  to: string;
  label: string;
}

export interface ExplodedSystem {
  id: string;
  title: string;
  subtitle?: string;
  layers: SystemLayer[];
  scenario: SystemStep[];
  sourceQuote?: string;
  detectedAt: number;
}

/* ============ Visualize This (Feature #7) ============ */

export type DiagramShape =
  | "sequence"
  | "cycle"
  | "hierarchy"
  | "comparison"
  | "layers";

export interface DiagramNode {
  id: string;
  label: string;
  detail?: string;
  icon?: string;
  group?: string;
}

export interface DiagramRelation {
  from: string;
  to: string;
  type: "next" | "part_of" | "opposite" | "contains";
  label?: string;
}

export interface GeneratedDiagram {
  id: string;
  shape: DiagramShape;
  title: string;
  subtitle?: string;
  nodes: DiagramNode[];
  relations: DiagramRelation[];
  emphasis: string[];
  sourceQuote?: string;
  detectedAt: number;
}

/* ============ Causal Loop Explorer (Feature #8) ============ */

export interface CausalNode {
  id: string;
  label: string;
  detail?: string;
  category?: "driver" | "process" | "outcome" | "feedback";
}

export interface CausalEdge {
  from: string;
  to: string;
  sign: "positive" | "negative";
  evidence: "lecture" | "inferred";
  label?: string;
  quote?: string;
}

export interface CausalLoop {
  id: string;
  title: string;
  subtitle?: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
  loops: Array<{
    id: string;
    type: "reinforcing" | "balancing";
    nodeIds: string[];
    label?: string;
  }>;
  sourceQuote?: string;
  detectedAt: number;
}

/* ============ Argument Map (Feature #9) ============ */

export type ArgumentNodeType =
  | "thesis"
  | "claim"
  | "evidence"
  | "counterargument"
  | "rebuttal"
  | "conclusion";

export interface ArgumentNode {
  id: string;
  type: ArgumentNodeType;
  text: string;
  strength?: "strong" | "medium" | "weak";
  quote?: string;
}

export interface ArgumentLink {
  from: string;
  to: string;
  relation: "supports" | "attacks" | "refutes";
}

export interface ArgumentMap {
  id: string;
  title: string;
  thesis: string;
  nodes: ArgumentNode[];
  links: ArgumentLink[];
  hasEmptyClaims: boolean;
  emptyClaimIds: string[];
  sourceQuote?: string;
  detectedAt: number;
}
