import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateForm } from "@/components/forms/template-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteTemplateAction, updateTemplateAction } from "@/lib/actions/templates";
import { requireAdmin } from "@/lib/auth";
import { getTeam } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await requireAdmin();
  const { templateId } = await params;
  const supabase = await createClient();
  const [{ data: template }, { data: clients }, team] = await Promise.all([
    supabase.from("task_templates").select("*").eq("id", templateId).maybeSingle(),
    supabase.from("clients").select("id, name").order("name"),
    getTeam(),
  ]);
  if (!template) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Edit task template" />
        <DeleteButton
          action={deleteTemplateAction.bind(null, template.id)}
          confirmText="Delete this template? Tasks it already created are kept."
        />
      </div>
      <TemplateForm
        action={updateTemplateAction.bind(null, template.id)}
        initial={template}
        clients={clients ?? []}
        team={team}
      />
    </>
  );
}
