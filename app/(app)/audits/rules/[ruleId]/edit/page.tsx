import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { IssueRuleForm } from "@/components/forms/issue-rule-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteIssueRuleAction, updateIssueRuleAction } from "@/lib/actions/audits";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditIssueRulePage({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  await requireAdmin();
  const { ruleId } = await params;
  const supabase = await createClient();
  const { data: rule } = await supabase.from("issue_rules").select("*").eq("id", ruleId).maybeSingle();
  if (!rule) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Edit issue rule" />
        <DeleteButton action={deleteIssueRuleAction.bind(null, rule.id)} confirmText="Delete this rule? Future crawls will show the issue as unclassified again." />
      </div>
      <IssueRuleForm action={updateIssueRuleAction.bind(null, rule.id)} initial={rule} cancelHref="/audits/rules" />
    </>
  );
}
