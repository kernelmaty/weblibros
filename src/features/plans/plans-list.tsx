"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCurrentUserId } from "@/lib/books/api";
import { listReadingPlans } from "@/lib/reading-plans/api";
import type { ReadingPlan } from "@/lib/reading-plans/types";
import { formatDateForDisplay } from "@/lib/reading-plans/utils";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

export function PlansList() {
  const isConfigured = hasSupabaseConfig();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
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
        setPlans([]);
        return;
      }

      setPlans(await listReadingPlans(supabase));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudieron cargar los planes.",
      );
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPlans]);

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para ver tus planes" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando planes...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para ver tus planes" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Planificación
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Planes de lectura</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organizá objetivos con cronogramas diarios automáticos.
          </p>
        </div>
        <Link
          href="/plans/new"
          className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Nuevo plan
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-accent bg-card p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      {plans.length === 0 ? (
        <section className="rounded-md border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold">Todavía no hay planes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Creá un plan, elegí varios libros y la app calculará el ritmo diario.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="rounded-md border border-border bg-card p-5 shadow-sm transition hover:border-primary"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDateForDisplay(plan.start_date)} a{" "}
                    {formatDateForDisplay(plan.target_date)}
                  </p>
                </div>
                <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                  {plan.status}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {plan.total_pending_pages}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Páginas por día</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {plan.pages_per_day}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
