import { Badge } from "@/components/ui/badge";
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
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CLIENT_STATUS_LABEL = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
} as const;

export default async function DashboardPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const [{ data: clients }, { data: team }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("profiles").select("*").order("role").order("full_name"),
  ]);

  const activeClients = (clients ?? []).filter((c) => c.status === "active");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.profile.full_name || user.email}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active clients</CardDescription>
            <CardTitle className="text-3xl">{activeClients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Team members</CardDescription>
            <CardTitle className="text-3xl">{team?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Client profiles and context live here from Phase 1.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>CMS</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(clients ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No clients yet. Run the seed script to add Jatis Mobile.
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
                      <TableCell>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {CLIENT_STATUS_LABEL[client.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>Everyone who can sign in to this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(team ?? []).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.role === "admin" ? "Admin" : "Writer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.is_active ? "Active" : "Inactive"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
