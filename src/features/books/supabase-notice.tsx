import Link from "next/link";

type SupabaseNoticeProps = {
  title?: string;
};

export function SupabaseNotice({
  title = "Configuración pendiente",
}: SupabaseNoticeProps) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Supabase
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Para usar la biblioteca necesitás crear `.env.local` con
        `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, aplicar el
        SQL de la carpeta `supabase/sql` en orden e iniciar sesión.
      </p>
      <Link
        href="/login"
        className="mt-5 inline-flex rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
      >
        Ir a ingresar
      </Link>
    </section>
  );
}
