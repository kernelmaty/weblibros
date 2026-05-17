export const BOOK_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "leyendo", label: "Leyendo" },
  { value: "terminado", label: "Terminado" },
  { value: "pausado", label: "Pausado" },
  { value: "abandonado", label: "Abandonado" },
] as const;

export const BOOK_PRIORITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
] as const;

export type BookStatus = (typeof BOOK_STATUS_OPTIONS)[number]["value"];
export type BookPriority = (typeof BOOK_PRIORITY_OPTIONS)[number]["value"];

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: string;
  status: BookStatus;
  priority: BookPriority;
  total_pages: number;
  current_page: number;
  started_at: string | null;
  finished_at: string | null;
  notes: string;
  percentage_read: number;
  pages_remaining: number;
  created_at: string;
  updated_at: string;
};

export type BookFormValues = {
  title: string;
  author: string;
  genre: string;
  status: BookStatus;
  priority: BookPriority;
  total_pages: number;
  current_page: number;
  started_at: string;
  finished_at: string;
  notes: string;
};

export type BookFilters = {
  search: string;
  status: "todos" | BookStatus;
  genre: "todos" | string;
  priority: "todas" | BookPriority;
};

export const emptyBookFormValues: BookFormValues = {
  title: "",
  author: "",
  genre: "",
  status: "pendiente",
  priority: "media",
  total_pages: 0,
  current_page: 0,
  started_at: "",
  finished_at: "",
  notes: "",
};
