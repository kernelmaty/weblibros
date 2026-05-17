"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUserId, listBooks } from "@/lib/books/api";
import {
  getReadingPlanDetail,
  recalculateReadingPlan,
} from "@/lib/reading-plans/api";
import type { ReadingPlanDetail as ReadingPlanDetailType } from "@/lib/reading-plans/types";
import {
  formatDateForDisplay,
  getPlanProgress,
  getTodayIsoDate,
} from "@/lib/reading-plans/utils";
import { listReadingSessionsForBooksBetween } from "@/lib/reading-sessions/api";
import type { ReadingSession } from "@/lib/reading-sessions/types";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

type PlanDetailProps = {
  planId: string;
};

export function PlanDetail({ planId }: PlanDetailProps) {
  const isConfigured = hasSupabaseConfig();
  const [detail, setDetail] = useState<ReadingPlanDetailType | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
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
        setDetail(null);
        setSessions([]);
        return;
      }

      const books = await listBooks(supabase);
      const loadedDetail = await getReadingPlanDetail(supabase, planId, books);
      const bookIds = loadedDetail.books.map((planBook) => planBook.book_id);
      const comparisonEndDate =
        getTodayIsoDate() > loadedDetail.plan.target_date
          ? loadedDetail.plan.target_date
          : getTodayIsoDate();
      const loadedSessions = await listReadingSessionsForBooksBetween(
        supabase,
        bookIds,
        loadedDetail.plan.start_date,
        comparisonEndDate,
      );

      setDetail(loadedDetail);
      setSessions(loadedSessions);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo cargar el plan.",
      );
    } finally {
      setLoading(false);
    }
  }, [isConfigured, planId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPlan();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPlan]);

  const progress = useMemo(() => {
    if (!detail) {
      return null;
    }

    return getPlanProgress(detail.plan, detail.days, sessions);
  }, [detail, sessions]);

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para ver planes" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando plan...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para ver este plan" />;
  }

  if (error || !detail || !progress) {
    return (
      <section className="rounded-md border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">No se pudo abrir el plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "El plan no existe o no pertenece a tu usuario."}
        </p>
        <Link
          href="/plans"
          className="mt-5 inline-flex rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Volver a planes
        </Link>
      </section>
    );
  }

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      await recalculateReadingPlan(supabase, detail);
      await loadPlan();
      setMessage("Cronograma recalculado con las páginas pendientes actuales.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo recalcular el cronograma.",
      );
    } finally {
      setRecalculating(false);
    }
  };

  const progressClass =
    progress.tone === "success"
      ? "border-primary text-primary"
      : progress.tone === "warning"
        ? "border-accent text-accent"
        : "border-border text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Plan de lectura
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{detail.plan.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDateForDisplay(detail.plan.start_date)} a{" "}
            {formatDateForDisplay(detail.plan.target_date)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/plans"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:bg-muted"
          >
            Volver
          </Link>
          <button
            type="button"
            disabled={recalculating}
            onClick={() => void handleRecalculate()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recalculating ? "Recalculando..." : "Recalcular cronograma"}
          </button>
        </div>
      </div>

      <section className={`rounded-md border bg-card p-5 shadow-sm ${progressClass}`}>
        <h2 className="text-xl font-semibold">Estado del plan</h2>
        <p className="mt-2 text-sm leading-6">{progress.message}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Esperado hasta hoy</p>
            <p className="mt-1 text-2xl font-semibold">{progress.expectedPages}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Leído en el plan</p>
            <p className="mt-1 text-2xl font-semibold">{progress.actualPages}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diferencia</p>
            <p className="mt-1 text-2xl font-semibold">{progress.difference}</p>
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-md border border-primary bg-card p-3 text-sm text-primary">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-accent bg-card p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Páginas pendientes" value={detail.plan.total_pending_pages} />
        <SummaryCard label="Páginas por día" value={detail.plan.pages_per_day} />
        <SummaryCard label="Días generados" value={detail.days.length} />
      </section>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Libros incluidos</h2>
        <div className="mt-5 grid gap-3">
          {detail.books.map((planBook) => (
            <article
              key={planBook.id}
              className="grid gap-2 rounded-md border border-border bg-background p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <h3 className="font-semibold">
                  {planBook.book?.title ?? "Libro no disponible"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {planBook.book?.author ?? "No se pudo leer el autor"}
                </p>
              </div>
              <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                {planBook.pending_pages_at_start} páginas al planificar
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cronograma diario</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada fila muestra el objetivo de páginas para ese día y el acumulado.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {detail.days.map((day) => {
            const isPastOrToday = day.day_date <= getTodayIsoDate();

            return (
              <article
                key={day.id}
                className="grid gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold">{formatDateForDisplay(day.day_date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPastOrToday ? "Día ya evaluable" : "Día futuro"}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {day.target_pages} páginas
                </span>
                <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                  Acumulado {day.cumulative_target_pages}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
