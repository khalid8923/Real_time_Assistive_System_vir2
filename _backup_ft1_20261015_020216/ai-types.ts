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
/* ============ Visualizations ============ */

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

export interface ComparisonTable {
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
  table?: ComparisonTable;
  timeline?: TimelineEvent[];
  rawText?: string;
}

export interface InfographicSection {
  id: string;
  title: string;
  type: VisualizationType;
  visualization: Visualization;
}
