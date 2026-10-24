import { PageHeader } from "@/components/layout/page-header";
import { IssueRuleForm } from "@/components/forms/issue-rule-form";
import { saveIssueRuleAction } from "@/lib/actions/audits";
import { requireAdmin } from "@/lib/auth";

export default async function NewIssueRulePage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New issue rule" />
      <IssueRuleForm
        action={saveIssueRuleAction}
        initial={{ issue_name: "", category: "technical", default_severity: "medium", task_title_template: null, ignore_by_default: false }}
        cancelHref="/audits/rules"
        submitLabel="Create rule"
      />
    </>
  );
}
