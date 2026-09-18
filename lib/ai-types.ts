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