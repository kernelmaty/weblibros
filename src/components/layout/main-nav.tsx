import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Panel" },
  { href: "/books", label: "Libros" },
  { href: "/plans", label: "Planes" },
  { href: "/login", label: "Ingresar" },
];

export function MainNav() {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
              B
            </span>
            <span>
              <span className="block text-lg font-semibold leading-tight">
                Bitácora de Lectura
              </span>
              <span className="block text-sm text-muted-foreground">
                Seguimiento simple para tus lecturas
              </span>
            </span>
          </Link>

          <nav aria-label="Navegación principal" className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
