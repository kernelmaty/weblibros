import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-md border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
