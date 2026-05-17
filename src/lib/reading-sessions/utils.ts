import type { ReadingSession } from "@/lib/reading-sessions/types";

export function getLast30Days() {
  const days: string[] = [];
  const today = new Date();

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

export function getPagesReadByDay(sessions: ReadingSession[]) {
  const totals = new Map<string, number>();

  for (const day of getLast30Days()) {
    totals.set(day, 0);
  }

  for (const session of sessions) {
    totals.set(
      session.session_date,
      (totals.get(session.session_date) ?? 0) + session.pages_read,
    );
  }

  return Array.from(totals.entries()).map(([date, pages]) => ({
    date,
    label: date.slice(5),
    pages,
  }));
}
