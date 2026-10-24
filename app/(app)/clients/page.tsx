import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { requireAdmin } from "@/lib/auth";

export default async function ClientsPage() {
  await requireAdmin();
  return (
    <PhasePlaceholder
      title="Clients"
      phase={1}
      description="Client profiles, content context, two-week cycles, and task boards."
    />
  );
}
