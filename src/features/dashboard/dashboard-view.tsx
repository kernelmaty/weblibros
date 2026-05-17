"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCurrentUserId, listBooks } from "@/lib/books/api";
import type { Book } from "@/lib/books/types";
import { BOOK_STATUS_OPTIONS } from "@/lib/books/types";
import { getStatusLabel } from "@/lib/books/utils";
import { listReadingSessionsSince } from "@/lib/reading-sessions/api";
import type { ReadingSession } from "@/lib/reading-sessions/types";
import {
  getLast30Days,
  getPagesReadByDay,
} from "@/lib/reading-sessions/utils";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

const chartColors = ["#1f6f68", "#a8522f", "#d59b3d", "#5d7f52", "#6f6255"];

type DashboardData = {
  books: Book[];
  sessions: ReadingSession[];
};

export function DashboardView() {
  const isConfigured = hasSupabaseConfig();
  const [data, setData] = useState<DashboardData>({ books: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!isConfigured) {
      return;
    }

    await Promise.resolve();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const userId = await getCurrentUserId(supabase);
      setIsAuthenticated(Boolean(userId));

      if (!userId) {
        setData({ books: [], sessions: [] });
        return;
      }

      const sinceDate = getLast30Days()[0];
      const [books, sessions] = await Promise.all([
        listBooks(supabase),
        listReadingSessionsSince(supabase, sinceDate),
      ]);

      setData({ books, sessions });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo cargar el dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const chartData = useMemo(() => {
    const pagesByDay = getPagesReadByDay(data.sessions);
    const totalPages = data.sessions.reduce(
      (total, session) => total + session.pages_read,
      0,
    );
    const completedBooks = data.books.filter(
      (book) => book.status === "terminado",
    ).length;
    const activeBooks = data.books.filter((book) => book.status === "leyendo").length;

    const booksByStatus = BOOK_STATUS_OPTIONS.map((option) => ({
      name: getStatusLabel(option.value),
      value: data.books.filter((book) => book.status === option.value).length,
    })).filter((item) => item.value > 0);

    const genreCounts = new Map<string, number>();

    for (const book of data.books) {
      const genre = book.genre || "Sin género";
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }

    const booksByGenre = Array.from(genreCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      activeBooks,
      booksByGenre,
      booksByStatus,
      completedBooks,
      pagesByDay,
      totalPages,
    };
  }, [data]);

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para ver estadísticas reales" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para ver tu dashboard" />;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Panel principal
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Tu ritmo de lectura, puesto en números.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Revisá libros activos, sesiones recientes y distribución de tu
            biblioteca a partir de datos reales de Supabase.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/books"
              className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            >
              Ver libros
            </Link>
            <Link
              href="/books/new"
              className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold transition hover:border-primary hover:bg-muted"
            >
              Nuevo libro
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard label="Libros totales" value={data.books.length} />
          <StatCard label="Libros activos" value={chartData.activeBooks} />
          <StatCard label="Libros leídos" value={chartData.completedBooks} />
          <StatCard
            label="Páginas en 30 días"
            value={chartData.totalPages}
          />
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-accent bg-card p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Páginas leídas últimos 30 días">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.pagesByDay}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="pages"
                name="Páginas"
                stroke="#1f6f68"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Libros por estado">
          {chartData.booksByStatus.length === 0 ? (
            <EmptyChartText />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.booksByStatus}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Libros" radius={[4, 4, 0, 0]}>
                  {chartData.booksByStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <ChartCard title="Libros por género">
        {chartData.booksByGenre.length === 0 ? (
          <EmptyChartText />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.booksByGenre}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={2}
              >
                {chartData.booksByGenre.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-5 h-80 min-h-80">{children}</div>
    </section>
  );
}

function EmptyChartText() {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-border bg-background p-4 text-center text-sm text-muted-foreground">
      Todavía no hay datos suficientes para este gráfico.
    </div>
  );
}
