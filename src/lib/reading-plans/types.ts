import type { Book } from "@/lib/books/types";

export type ReadingPlanStatus = "activo" | "completado" | "pausado";

export type ReadingPlan = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  target_date: string;
  total_pending_pages: number;
  pages_per_day: number;
  status: ReadingPlanStatus;
  created_at: string;
  updated_at: string;
};

export type ReadingPlanBook = {
  id: string;
  plan_id: string;
  user_id: string;
  book_id: string;
  pending_pages_at_start: number;
  sort_order: number;
  created_at: string;
};

export type ReadingPlanDay = {
  id: string;
  plan_id: string;
  user_id: string;
  day_date: string;
  target_pages: number;
  cumulative_target_pages: number;
  created_at: string;
};

export type ReadingPlanBookWithBook = ReadingPlanBook & {
  book: Book | null;
};

export type ReadingPlanDetail = {
  plan: ReadingPlan;
  books: ReadingPlanBookWithBook[];
  days: ReadingPlanDay[];
};

export type ReadingPlanFormValues = {
  name: string;
  start_date: string;
  target_date: string;
  book_ids: string[];
};

export type PlanProgress = {
  actualPages: number;
  expectedPages: number;
  difference: number;
  message: string;
  tone: "neutral" | "success" | "warning";
};
