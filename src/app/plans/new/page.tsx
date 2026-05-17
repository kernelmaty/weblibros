import { AppShell } from "@/components/layout/app-shell";
import { PlanForm } from "@/features/plans/plan-form";

export default function NewPlanPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Planificación
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Nuevo plan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Elegí libros, fechas y dejá que la bitácora genere el cronograma diario.
          </p>
        </div>
        <PlanForm />
      </div>
    </AppShell>
  );
}
