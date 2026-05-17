import { AppShell } from "@/components/layout/app-shell";
import { BookDetail } from "@/features/books/book-detail";

type BookPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <BookDetail bookId={id} />
    </AppShell>
  );
}
