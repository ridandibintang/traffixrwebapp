import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { formatShortDate, todayIso } from "@/lib/dates";
import { getMyArticles } from "@/lib/queries/articles";
import { cn } from "@/lib/utils";

const NEXT_STEP: Record<string, string> = {
  draft: "Waiting for the admin",
  assigned: "Add your draft link",
  writing: "Submit when the draft is ready",
  submitted: "Waiting for review",
  in_review: "Being reviewed",
  revision: "Revise and resubmit",
  approved: "Paste the published URL",
  published: "Done",
};

export default async function MyArticlesPage() {
  const user = await getCurrentUser();
  const articles = await getMyArticles(user.id);
  const today = todayIso();
  const active = articles.filter((a) => a.status !== "published");
  const published = articles.filter((a) => a.status === "published");

  return (
    <>
      <PageHeader
        title="My Articles"
        description={`Hi ${user.profile.full_name || user.email}. Everything assigned to you, with the next step for each.`}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>In progress</CardTitle>
            <CardDescription>Open the article to read its brief, save your draft link, and submit for review.</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <EmptyState title="No articles assigned yet" description="When the admin assigns a brief to you, it appears here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((a) => {
                    const overdue = a.due_date && a.due_date < today && a.status !== "approved";
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <Link href={`/my-articles/${a.id}`} className="hover:underline">{a.title}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.client?.name}</TableCell>
                        <TableCell className={cn("text-muted-foreground", overdue && "font-medium text-destructive")}>
                          {formatShortDate(a.due_date)}
                        </TableCell>
                        <TableCell><ArticleStatusBadge status={a.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{NEXT_STEP[a.status]}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {published.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Published</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {published.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <Link href={`/my-articles/${a.id}`} className="hover:underline">{a.title}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.client?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.published_url ? (
                          <a href={a.published_url} target="_blank" rel="noreferrer" className="hover:underline">
                            {formatShortDate(a.published_at?.slice(0, 10))}
                          </a>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
