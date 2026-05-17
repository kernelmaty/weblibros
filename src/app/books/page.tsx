import { AppShell } from "@/components/layout/app-shell";
import { BooksList } from "@/features/books/books-list";

export default function BooksPage() {
  return (
    <AppShell>
      <BooksList />
    </AppShell>
  );
}
