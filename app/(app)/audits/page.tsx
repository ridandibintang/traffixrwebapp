import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { requireAdmin } from "@/lib/auth";

export default async function AuditsPage() {
  await requireAdmin();
  return (
    <PhasePlaceholder
      title="Audits"
      phase={3}
      description="Screaming Frog imports, issue rules, grouped findings, and conversion to tasks."
    />
  );
}
