import { AppShell } from "@/components/layout/app-shell";
import { PlansList } from "@/features/plans/plans-list";

export default function PlansPage() {
  return (
    <AppShell>
      <PlansList />
    </AppShell>
  );
}
