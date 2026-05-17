import { AppShell } from "@/components/layout/app-shell";
import { PlanDetail } from "@/features/plans/plan-detail";

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <PlanDetail planId={id} />
    </AppShell>
  );
}
