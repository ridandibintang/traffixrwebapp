import { PhasePlaceholder } from "@/components/layout/phase-placeholder";
import { requireAdmin } from "@/lib/auth";

export default async function OffPagePage() {
  await requireAdmin();
  return (
    <PhasePlaceholder
      title="Off-page"
      phase={1}
      description="Monthly backlink log and weekly Google Business Profile post schedule."
    />
  );
}
