import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { requireAdmin } from "@/lib/auth";

export default async function ReportsPage() {
  await requireAdmin();
  return (
    <PhasePlaceholder
      title="Reports"
      phase={4}
      description="Two-week reports assembled from cycle tasks, off-page work, and GSC/GA4 metrics."
    />
  );
}
