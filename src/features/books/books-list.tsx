"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteBook, getCurrentUserId, listBooks } from "@/lib/books/api";
import {
  BOOK_PRIORITY_OPTIONS,
  BOOK_STATUS_OPTIONS,
  type Book,
  type BookFilters,
} from "@/lib/books/types";
import {
  filterBooks,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/books/utils";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase/client";
import { SupabaseNotice } from "@/features/books/supabase-notice";

const initialFilters: BookFilters = {
  search: "",
  status: "todos",
  genre: "todos",
  priority: "todas",
};

export function BooksList() {
  const isConfigured = hasSupabaseConfig();
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<BookFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const genres = useMemo(
    () =>
      Array.from(
        new Set(books.map((book) => book.genre).filter((genre) => genre.length > 0)),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [books],
  );

  const filteredBooks = useMemo(
    () => filterBooks(books, filters),
    [books, filters],
  );

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
        cause instanceof Error ? cause.message : "No se pudo cargar la biblioteca.",
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

  if (!isConfigured) {
    return <SupabaseNotice title="Conectá Supabase para listar tu biblioteca" />;
  }

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
      </section>
    );
  }

  if (isAuthenticated === false) {
    return <SupabaseNotice title="Iniciá sesión para ver tu biblioteca" />;
  }

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(`¿Eliminar "${book.title}" de tu biblioteca?`);

    if (!confirmed) {
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      await deleteBook(supabase, book.id);
      setBooks((current) => current.filter((item) => item.id !== book.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo eliminar el libro.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Biblioteca
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Mis libros</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filteredBooks.length} de {books.length} libros visibles
          </p>
        </div>
        <Link
          href="/books/new"
          className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Nuevo libro
        </Link>
      </div>

      <section className="grid gap-3 rounded-md border border-border bg-card p-4 shadow-sm lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <label className="grid gap-2 text-sm font-medium">
          Buscar
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Título o autor"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Estado
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as BookFilters["status"],
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          >
            <option value="todos">Todos</option>
            {BOOK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Género
          <select
            value={filters.genre}
            onChange={(event) =>
              setFilters((current) => ({ ...current, genre: event.target.value }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          >
            <option value="todos">Todos</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Prioridad
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value as BookFilters["priority"],
              }))
            }
            className="rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
          >
            <option value="todas">Todas</option>
            {BOOK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <p className="rounded-md border border-accent bg-card p-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      {filteredBooks.length === 0 ? (
        <section className="rounded-md border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold">No hay libros para mostrar</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Probá limpiar filtros o creá tu primer registro de lectura.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {filteredBooks.map((book) => (
            <article
              key={book.id}
              className="rounded-md border border-border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {getStatusLabel(book.status)}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Prioridad {getPriorityLabel(book.priority).toLowerCase()}
                    </span>
                    {book.genre ? (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {book.genre}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{book.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/books/${book.id}`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:bg-muted"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/books/${book.id}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:bg-muted"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(book)}
                    className="rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-background"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${book.percentage_read}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {book.percentage_read}% leído · {book.pages_remaining} páginas
                  restantes
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
