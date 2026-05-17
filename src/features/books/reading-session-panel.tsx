"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Book } from "@/lib/books/types";
import { createReadingSession } from "@/lib/reading-sessions/api";
import {
  getDefaultSessionDate,
  type ReadingSession,
  type ReadingSessionFormValues,
} from "@/lib/reading-sessions/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ReadingSessionPanelProps = {
  book: Book;
  sessions: ReadingSession[];
  onSessionCreated: () => Promise<void>;
};

export function ReadingSessionPanel({
  book,
  sessions,
  onSessionCreated,
}: ReadingSessionPanelProps) {
  const [values, setValues] = useState<ReadingSessionFormValues>({
    session_date: getDefaultSessionDate(),
    start_page: book.current_page,
    end_page: book.current_page,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pagesRead = Math.max(values.end_page - values.start_page, 0);

  const updateField = <Key extends keyof ReadingSessionFormValues>(
    field: Key,
    value: ReadingSessionFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (book.total_pages <= 0) {
      return "Cargá el total de páginas del libro antes de registrar sesiones.";
    }

    if (!values.session_date) {
      return "Elegí una fecha para la sesión.";
    }

    if (values.start_page < 0 || values.end_page < 0) {
      return "Las páginas no pueden ser negativas.";
    }

    if (values.end_page < values.start_page) {
      return "La página final no puede ser menor que la inicial.";
    }

    if (values.end_page > book.total_pages) {
      return "La página final no puede superar el total de páginas del libro.";
    }

    if (values.end_page === values.start_page) {
      return "Registrá al menos una página leída.";
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
      await createReadingSession(supabase, book.id, values);
      await onSessionCreated();
      setValues({
        session_date: getDefaultSessionDate(),
        start_page: values.end_page,
        end_page: values.end_page,
        notes: "",
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar la sesión de lectura.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-md border border-border bg-card p-5 shadow-sm"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Registro diario
          </p>
          <h2 className="mt-2 text-xl font-semibold">Nueva sesión</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Fecha
            <input
              type="date"
              value={values.session_date}
              onChange={(event) =>
                updateField("session_date", event.target.value)
              }
              className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Página inicial
              <input
                min={0}
                max={book.total_pages || undefined}
                type="number"
                value={values.start_page}
                onChange={(event) =>
                  updateField("start_page", Number(event.target.value))
                }
                className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Página final
              <input
                min={0}
                max={book.total_pages || undefined}
                type="number"
                value={values.end_page}
                onChange={(event) =>
                  updateField("end_page", Number(event.target.value))
                }
                className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Notas de la sesión
            <textarea
              rows={4}
              value={values.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="resize-y rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
              placeholder="Qué avanzaste, ideas o citas para recordar."
            />
          </label>
        </div>

        <div className="mt-5 rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Páginas de esta sesión</p>
          <p className="mt-1 text-2xl font-semibold">{pagesRead}</p>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-accent bg-background p-3 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <button
          disabled={saving}
          type="submit"
          className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Registrar sesión"}
        </button>
      </form>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Historial
            </p>
            <h2 className="mt-2 text-xl font-semibold">Sesiones registradas</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {sessions.length} sesiones
          </p>
        </div>

        {sessions.length === 0 ? (
          <p className="mt-5 rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            Todavía no hay sesiones para este libro.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {new Intl.DateTimeFormat("es").format(
                        new Date(`${session.session_date}T00:00:00`),
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Páginas {session.start_page} a {session.end_page}
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                    {session.pages_read} páginas
                  </span>
                </div>
                {session.notes ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {session.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
