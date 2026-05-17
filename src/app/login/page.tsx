import { AppShell } from "@/components/layout/app-shell";

export default function LoginPage() {
  return (
    <AppShell>
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Acceso
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Ingresá a tu bitácora personal.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            La pantalla queda preparada para conectar autenticación con Supabase
            en la próxima etapa.
          </p>
        </div>

        <form className="rounded-md border border-border bg-card p-5 shadow-sm">
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            >
              Ingresar
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
