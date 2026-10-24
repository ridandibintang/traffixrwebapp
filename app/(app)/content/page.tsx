import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { requireAdmin } from "@/lib/auth";

export default async function ContentPage() {
  await requireAdmin();
  return (
    <PhasePlaceholder
      title="Content"
      phase={2}
      description="Keywords and clusters, content briefs, article pipeline, and reviews."
    />
  );
}
