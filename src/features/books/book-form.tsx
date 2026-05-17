"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  BOOK_PRIORITY_OPTIONS,
  BOOK_STATUS_OPTIONS,
  emptyBookFormValues,
  type BookFormValues,
} from "@/lib/books/types";
import { createBook, getBook, getCurrentUserId, updateBook } from "@/lib/books/api";
import { bookToFormValues, calculateReadingProgress } from "@/lib/books/utils";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

type BookFormProps = {
  mode: "create" | "edit";
  bookId?: string;
};

export function BookForm({ mode, bookId }: BookFormProps) {
  const router = useRouter();
  const isConfigured = hasSupabaseConfig();
  const [values, setValues] = useState<BookFormValues>(emptyBookFormValues);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = calculateReadingProgress(values.current_page, values.total_pages);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const loadInitialState = async () => {
      try {
        await Promise.resolve();
        const supabase = getSupabaseBrowserClient();
        const userId = await getCurrentUserId(supabase);
        setIsAuthenticated(Boolean(userId));

        if (mode === "edit" && bookId && userId) {
          const book = await getBook(supabase, bookId);
          setValues(bookToFormValues(book));
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar la información del libro.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInitialState();
  }, [bookId, isConfigured, mode]);

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para guardar libros" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando libro...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para administrar tu biblioteca" />;
  }

  const updateField = <Key extends keyof BookFormValues>(
    field: Key,
    value: BookFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!values.title.trim() || !values.author.trim()) {
      setError("Completá título y autor para guardar el libro.");
      return;
    }

    if (values.current_page > values.total_pages) {
      setError("La página actual no puede superar el total de páginas.");
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "create") {
        const created = await createBook(supabase, values);
        router.push(`/books/${created.id}`);
      } else if (bookId) {
        await updateBook(supabase, bookId, values);
        router.push(`/books/${bookId}`);
      }

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo guardar el libro.",
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
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Título
          <input
            required
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Ej. Rayuela"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Autor
          <input
            required
            value={values.author}
            onChange={(event) => updateField("author", event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Ej. Julio Cortázar"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Género
          <input
            value={values.genre}
            onChange={(event) => updateField("genre", event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Novela, ensayo, poesía..."
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Estado
          <select
            value={values.status}
            onChange={(event) =>
              updateField("status", event.target.value as BookFormValues["status"])
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          >
            {BOOK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Prioridad
          <select
            value={values.priority}
            onChange={(event) =>
              updateField(
                "priority",
                event.target.value as BookFormValues["priority"],
              )
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          >
            {BOOK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Total de páginas
            <input
              min={0}
              type="number"
              value={values.total_pages}
              onChange={(event) =>
                updateField("total_pages", Number(event.target.value))
              }
              className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Página actual
            <input
              min={0}
              type="number"
              value={values.current_page}
              onChange={(event) =>
                updateField("current_page", Number(event.target.value))
              }
              className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Fecha de inicio
          <input
            type="date"
            value={values.started_at}
            onChange={(event) => updateField("started_at", event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Fecha de finalización
          <input
            type="date"
            value={values.finished_at}
            onChange={(event) => updateField("finished_at", event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Notas
        <textarea
          value={values.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={5}
          className="resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Ideas, citas pendientes o comentarios de lectura."
        />
      </label>

      <section className="rounded-md border border-border bg-background p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Porcentaje leído</p>
            <p className="mt-1 text-2xl font-semibold">{progress.percentage}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Páginas restantes</p>
            <p className="mt-1 text-2xl font-semibold">
              {progress.pagesRemaining}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avance</p>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-accent bg-background p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/books"
          className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold transition hover:border-primary hover:bg-muted"
        >
          Cancelar
        </Link>
        <button
          disabled={saving}
          type="submit"
          className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar libro"}
        </button>
      </div>
    </form>
  );
}
