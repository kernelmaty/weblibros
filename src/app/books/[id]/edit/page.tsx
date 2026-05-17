import { AppShell } from "@/components/layout/app-shell";
import { BookForm } from "@/features/books/book-form";

type EditBookPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Biblioteca
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Editar libro</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Actualizá el estado, avance o notas de este registro.
          </p>
        </div>
        <BookForm mode="edit" bookId={id} />
      </div>
    </AppShell>
  );
}
