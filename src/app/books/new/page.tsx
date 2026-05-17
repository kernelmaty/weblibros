import { AppShell } from "@/components/layout/app-shell";
import { BookForm } from "@/features/books/book-form";

export default function NewBookPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Biblioteca
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Nuevo libro</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registrá los datos principales y el avance de lectura.
          </p>
        </div>
        <BookForm mode="create" />
      </div>
    </AppShell>
  );
}
