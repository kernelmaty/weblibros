import type { Book } from "@/lib/books/types";
import type {
  PlanProgress,
  ReadingPlan,
  ReadingPlanDay,
} from "@/lib/reading-plans/types";
import type { ReadingSession } from "@/lib/reading-sessions/types";

const dayInMs = 24 * 60 * 60 * 1000;

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getInclusiveDayCount(startDate: string, targetDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) {
    return 0;
  }

  return Math.floor((target.getTime() - start.getTime()) / dayInMs) + 1;
}

export function getPendingPages(book: Book) {
  return Math.max(book.total_pages - book.current_page, 0);
}

export function calculatePlanTotals(books: Book[], startDate: string, targetDate: string) {
  const totalPendingPages = books.reduce(
    (total, book) => total + getPendingPages(book),
    0,
  );
  const dayCount = getInclusiveDayCount(startDate, targetDate);
  const pagesPerDay =
    dayCount > 0 && totalPendingPages > 0
      ? Math.ceil(totalPendingPages / dayCount)
      : 0;

  return {
    dayCount,
    pagesPerDay,
    totalPendingPages,
  };
}

export function generatePlanDays(
  planId: string,
  startDate: string,
  targetDate: string,
  totalPages: number,
) {
  const dayCount = getInclusiveDayCount(startDate, targetDate);
  const days: Array<{
    plan_id: string;
    day_date: string;
    target_pages: number;
    cumulative_target_pages: number;
  }> = [];

  if (dayCount <= 0) {
    return days;
  }

  const basePages = Math.floor(totalPages / dayCount);
  const remainder = totalPages % dayCount;
  let cumulative = 0;

  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(`${startDate}T00:00:00`);
    date.setDate(date.getDate() + index);

    const targetPages = basePages + (index < remainder ? 1 : 0);
    cumulative += targetPages;

    days.push({
      plan_id: planId,
      day_date: date.toISOString().slice(0, 10),
      target_pages: targetPages,
      cumulative_target_pages: cumulative,
    });
  }

  return days;
}

export function getPlanProgress(
  plan: ReadingPlan,
  days: ReadingPlanDay[],
  sessions: ReadingSession[],
): PlanProgress {
  const today = getTodayIsoDate();
  const comparisonDate = today < plan.start_date
    ? plan.start_date
    : today > plan.target_date
      ? plan.target_date
      : today;
  const expectedPages = days
    .filter((day) => day.day_date <= comparisonDate)
    .reduce((total, day) => total + day.target_pages, 0);
  const actualPages = sessions
    .filter(
      (session) =>
        session.session_date >= plan.start_date &&
        session.session_date <= comparisonDate,
    )
    .reduce((total, session) => total + session.pages_read, 0);
  const difference = actualPages - expectedPages;

  if (today < plan.start_date) {
    return {
      actualPages,
      difference: 0,
      expectedPages: 0,
      message: "El plan todavía no empezó. El cronograma ya está listo.",
      tone: "neutral",
    };
  }

  if (difference > 0) {
    return {
      actualPages,
      difference,
      expectedPages,
      message: `Vas adelantado por ${difference} páginas. Buen ritmo.`,
      tone: "success",
    };
  }

  if (difference < 0) {
    return {
      actualPages,
      difference,
      expectedPages,
      message: `Vas atrasado por ${Math.abs(difference)} páginas. Recalculá el cronograma si necesitás acomodarlo.`,
      tone: "warning",
    };
  }

  return {
    actualPages,
    difference,
    expectedPages,
    message: "Vas justo con el plan. El ritmo está alineado con el objetivo.",
    tone: "neutral",
  };
}

export function formatDateForDisplay(date: string) {
  return new Intl.DateTimeFormat("es").format(new Date(`${date}T00:00:00`));
}
