import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { CategoryBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { TEMPLATE_FREQUENCY } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export default async function TemplatesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("task_templates")
    .select("*, client:clients(name), assignee:profiles!task_templates_default_assignee_id_fkey(full_name)")
    .order("frequency")
    .order("title");

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Task templates"
          description="Recurring tasks that are added to cycles automatically."
        />
        <LinkButton href="/templates/new">
          <Plus />
          New template
        </LinkButton>
      </div>

      {(templates ?? []).length === 0 ? (
        <EmptyState
          title="No templates yet"
          description='Typical ones: "Crawl site in Screaming Frog" every cycle, "Post to GBP" weekly, "Buy backlinks" monthly.'
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Default assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates!.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link href={`/templates/${t.id}/edit`} className="hover:underline">
                    {t.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.client?.name ?? "All clients"}</TableCell>
                <TableCell>{TEMPLATE_FREQUENCY[t.frequency]}</TableCell>
                <TableCell><CategoryBadge category={t.category} /></TableCell>
                <TableCell className="text-muted-foreground">{t.assignee?.full_name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
