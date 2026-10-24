import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Writer home. Articles arrive in Phase 2; for now it proves that a writer can
// sign in and read client profiles (and nothing else).
export default async function MyArticlesPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, website_url, cms, industry")
    .eq("status", "active")
    .order("name");

  return (
    <>
      <PageHeader
        title="My Articles"
        description={`Hi ${user.profile.full_name || user.email}. Articles assigned to you will show up here.`}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>No articles assigned yet</CardTitle>
            <CardDescription>
              When your admin assigns a brief to you, it appears here with its
              content brief, draft link, and review status.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>The clients you may write for.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>CMS</TableHead>
                  <TableHead>Industry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(clients ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No active clients.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients!.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.website_url}
                      </TableCell>
                      <TableCell>{client.cms ?? "—"}</TableCell>
                      <TableCell>{client.industry ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
