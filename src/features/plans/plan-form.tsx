"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUserId, listBooks } from "@/lib/books/api";
import type { Book } from "@/lib/books/types";
import { createReadingPlan } from "@/lib/reading-plans/api";
import type { ReadingPlanFormValues } from "@/lib/reading-plans/types";
import {
  calculatePlanTotals,
  getPendingPages,
  getTodayIsoDate,
} from "@/lib/reading-plans/utils";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

export function PlanForm() {
  const router = useRouter();
  const isConfigured = hasSupabaseConfig();
  const [books, setBooks] = useState<Book[]>([]);
  const [values, setValues] = useState<ReadingPlanFormValues>({
    name: "",
    start_date: getTodayIsoDate(),
    target_date: getTodayIsoDate(),
    book_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
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
        setBooks([]);
        return;
      }

      setBooks(await listBooks(supabase));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudieron cargar los libros.",
      );
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBooks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadBooks]);

  const selectedBooks = useMemo(
    () => books.filter((book) => values.book_ids.includes(book.id)),
    [books, values.book_ids],
  );
  const totals = useMemo(
    () => calculatePlanTotals(selectedBooks, values.start_date, values.target_date),
    [selectedBooks, values.start_date, values.target_date],
  );

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para crear planes" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando libros...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para crear planes" />;
  }

  const toggleBook = (bookId: string) => {
    setValues((current) => ({
      ...current,
      book_ids: current.book_ids.includes(bookId)
        ? current.book_ids.filter((id) => id !== bookId)
        : [...current.book_ids, bookId],
    }));
  };

  const validate = () => {
    if (!values.name.trim()) {
      return "Poné un nombre claro para el plan.";
    }

    if (!values.start_date || !values.target_date) {
      return "Definí fecha de inicio y fecha objetivo.";
    }

    if (values.target_date < values.start_date) {
      return "La fecha objetivo no puede ser anterior a la fecha de inicio.";
    }

    if (selectedBooks.length === 0) {
      return "Seleccioná al menos un libro.";
    }

    if (totals.totalPendingPages <= 0) {
      return "Los libros seleccionados no tienen páginas pendientes.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const created = await createReadingPlan(supabase, values, selectedBooks);
      router.push(`/plans/${created.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear el plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-md border border-border bg-card p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium md:col-span-3">
          Nombre del plan
          <input
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Ej. Lecturas de invierno"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Fecha de inicio
          <input
            type="date"
            value={values.start_date}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                start_date: event.target.value,
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Fecha objetivo
          <input
            type="date"
            value={values.target_date}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                target_date: event.target.value,
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <section className="rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Ritmo estimado</p>
          <p className="mt-1 text-2xl font-semibold">{totals.pagesPerDay}</p>
          <p className="mt-1 text-xs text-muted-foreground">páginas por día</p>
        </section>
      </div>

      <section className="grid gap-3">
        <div>
          <h2 className="text-xl font-semibold">Seleccioná libros</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Se usarán las páginas pendientes actuales de cada libro.
          </p>
        </div>

        {books.length === 0 ? (
          <p className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            Primero cargá libros en la biblioteca.
          </p>
        ) : (
          <div className="grid gap-3">
            {books.map((book) => {
              const pendingPages = getPendingPages(book);
              const disabled = pendingPages <= 0;

              return (
                <label
                  key={book.id}
                  className="grid cursor-pointer gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <input
                    type="checkbox"
                    checked={values.book_ids.includes(book.id)}
                    disabled={disabled}
                    onChange={() => toggleBook(book.id)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block font-semibold">{book.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {book.author}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {disabled ? "Sin páginas pendientes" : `${pendingPages} pendientes`}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-md border border-border bg-background p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Libros seleccionados</p>
          <p className="mt-1 text-2xl font-semibold">{selectedBooks.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Páginas pendientes</p>
          <p className="mt-1 text-2xl font-semibold">
            {totals.totalPendingPages}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Días del plan</p>
          <p className="mt-1 text-2xl font-semibold">{totals.dayCount}</p>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-accent bg-background p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <button
        disabled={saving}
        type="submit"
        className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Generando cronograma..." : "Crear plan"}
      </button>
    </form>
  );
}
