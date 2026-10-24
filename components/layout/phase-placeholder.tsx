import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "./page-header";

// Shown for modules whose build phase has not started yet.
export function PhasePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: number;
  description: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Coming in Phase {phase}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
