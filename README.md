# Bitácora de Lectura

Base de proyecto para una app de seguimiento de lecturas hecha con Next.js,
TypeScript, Tailwind CSS y Supabase.

## Comandos

```bash
npm run dev
npm run build
npm run lint
```

El servidor local queda disponible en `http://localhost:3000`.

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá las credenciales públicas de
Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_publica
```

## Estructura principal

```text
src/
  app/
    books/
    dashboard/
    login/
    plans/
    globals.css
    layout.tsx
    page.tsx
  components/
    layout/
    ui/
  lib/
    supabase/
```

## Rutas incluidas

- `/dashboard`: panel inicial.
- `/books`: biblioteca con listado, filtros, búsqueda y eliminación.
- `/books/new`: alta de libros.
- `/books/[id]`: detalle de un libro.
- `/books/[id]/edit`: edición de un libro.
- `/plans`: planes de lectura.
- `/login`: pantalla preparada para autenticación.

## Supabase

El SQL completo para la tabla `books`, Row Level Security, políticas por
`user_id`, índices, trigger de `updated_at` y campos calculados está en:

```text
supabase/sql/001_create_books.sql
```

El SQL para sesiones diarias de lectura, validaciones de páginas, RLS, políticas
por `user_id` y actualización automática del avance del libro está en:

```text
supabase/sql/002_create_reading_sessions.sql
```

El SQL para planes de lectura, libros incluidos, días del cronograma, RLS y
políticas por `user_id` está en:

```text
supabase/sql/003_create_reading_plans.sql
```

La biblioteca usa la sesión del navegador de Supabase. Cuando conectes la
autenticación, las operaciones de crear, editar, eliminar y listar quedarán
limitadas por RLS al usuario autenticado.
