import { PageHeader } from "@/components/layout/page-header";
import { TemplateForm } from "@/components/forms/template-form";
import { createTemplateAction } from "@/lib/actions/templates";
import { requireAdmin } from "@/lib/auth";
import { getTeam } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

export default async function NewTemplatePage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: clients }, team] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    getTeam(),
  ]);

  return (
    <>
      <PageHeader title="New task template" />
      <TemplateForm action={createTemplateAction} clients={clients ?? []} team={team} />
    </>
  );
}
