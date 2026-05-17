import type { Book, BookFormValues, BookPriority, BookStatus } from "@/lib/books/types";
import { BOOK_PRIORITY_OPTIONS, BOOK_STATUS_OPTIONS } from "@/lib/books/types";

export function calculateReadingProgress(currentPage: number, totalPages: number) {
  const safeTotal = Math.max(0, totalPages);
  const safeCurrent = Math.min(Math.max(0, currentPage), safeTotal);
  const percentage =
    safeTotal > 0 ? Math.min(100, Math.round((safeCurrent / safeTotal) * 100)) : 0;

  return {
    currentPage: safeCurrent,
    totalPages: safeTotal,
    percentage,
    pagesRemaining: Math.max(safeTotal - safeCurrent, 0),
  };
}

export function getStatusLabel(status: BookStatus) {
  return BOOK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function getPriorityLabel(priority: BookPriority) {
  return (
    BOOK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority
  );
}

export function bookToFormValues(book: Book): BookFormValues {
  return {
    title: book.title,
    author: book.author,
    genre: book.genre,
    status: book.status,
    priority: book.priority,
    total_pages: book.total_pages,
    current_page: book.current_page,
    started_at: book.started_at ?? "",
    finished_at: book.finished_at ?? "",
    notes: book.notes,
  };
}

export function normalizeBookPayload(values: BookFormValues) {
  const progress = calculateReadingProgress(values.current_page, values.total_pages);

  return {
    title: values.title.trim(),
    author: values.author.trim(),
    genre: values.genre.trim(),
    status: values.status,
    priority: values.priority,
    total_pages: progress.totalPages,
    current_page: progress.currentPage,
    started_at: values.started_at || null,
    finished_at: values.finished_at || null,
    notes: values.notes.trim(),
  };
}

export function filterBooks(books: Book[], filters: {
  search: string;
  status: string;
  genre: string;
  priority: string;
}) {
  const search = filters.search.trim().toLowerCase();

  return books.filter((book) => {
    const matchesSearch =
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search);
    const matchesStatus = filters.status === "todos" || book.status === filters.status;
    const matchesGenre = filters.genre === "todos" || book.genre === filters.genre;
    const matchesPriority =
      filters.priority === "todas" || book.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesGenre && matchesPriority;
  });
}
