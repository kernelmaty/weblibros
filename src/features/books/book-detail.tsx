"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteBook, getBook, getCurrentUserId } from "@/lib/books/api";
import type { Book } from "@/lib/books/types";
import { getPriorityLabel, getStatusLabel } from "@/lib/books/utils";
import { listReadingSessionsByBook } from "@/lib/reading-sessions/api";
import type { ReadingSession } from "@/lib/reading-sessions/types";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { ReadingSessionPanel } from "@/features/books/reading-session-panel";
import { SupabaseNotice } from "@/features/books/supabase-notice";

type BookDetailProps = {
  bookId: string;
};

export function BookDetail({ bookId }: BookDetailProps) {
  const router = useRouter();
  const isConfigured = hasSupabaseConfig();
  const [book, setBook] = useState<Book | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const loadBook = async () => {
      try {
        await Promise.resolve();
        const supabase = getSupabaseBrowserClient();
        const userId = await getCurrentUserId(supabase);
        setIsAuthenticated(Boolean(userId));

        if (userId) {
          const [loadedBook, loadedSessions] = await Promise.all([
            getBook(supabase, bookId),
            listReadingSessionsByBook(supabase, bookId),
          ]);

          setBook(loadedBook);
          setSessions(loadedSessions);
        }
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "No se pudo cargar el libro.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadBook();
  }, [bookId, isConfigured]);

  const refreshBookAndSessions = async () => {
    const supabase = getSupabaseBrowserClient();
    const [loadedBook, loadedSessions] = await Promise.all([
      getBook(supabase, bookId),
      listReadingSessionsByBook(supabase, bookId),
    ]);

    setBook(loadedBook);
    setSessions(loadedSessions);
  };

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para ver libros" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando libro...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para ver este libro" />;
  }

  if (error || !book) {
    return (
      <section className="rounded-md border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">No se pudo abrir el libro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "El registro no existe o no pertenece a tu usuario."}
        </p>
        <Link
          href="/books"
          className="mt-5 inline-flex rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Volver a libros
        </Link>
      </section>
    );
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar "${book.title}" de tu biblioteca?`);

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      await deleteBook(supabase, book.id);
      router.push("/books");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo eliminar el libro.",
      );
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Detalle del libro
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{book.title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{book.author}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/books"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:bg-muted"
          >
            Volver
          </Link>
          <Link
            href={`/books/${book.id}/edit`}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          >
            Editar
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-accent bg-card p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="mt-1 font-semibold">{getStatusLabel(book.status)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Género</p>
            <p className="mt-1 font-semibold">{book.genre || "Sin género"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prioridad</p>
            <p className="mt-1 font-semibold">{getPriorityLabel(book.priority)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avance</p>
            <p className="mt-1 font-semibold">{book.percentage_read}% leído</p>
          </div>
        </div>

        <div className="mt-6 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${book.percentage_read}%` }}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Página actual</p>
            <p className="mt-1 text-2xl font-semibold">{book.current_page}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de páginas</p>
            <p className="mt-1 text-2xl font-semibold">{book.total_pages}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Restantes</p>
            <p className="mt-1 text-2xl font-semibold">{book.pages_remaining}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actualizado</p>
            <p className="mt-1 text-sm font-semibold">
              {new Intl.DateTimeFormat("es").format(new Date(book.updated_at))}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Notas</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {book.notes || "Todavía no hay notas para este libro."}
        </p>
      </section>

      <ReadingSessionPanel
        book={book}
        sessions={sessions}
        onSessionCreated={refreshBookAndSessions}
      />
    </div>
  );
}
