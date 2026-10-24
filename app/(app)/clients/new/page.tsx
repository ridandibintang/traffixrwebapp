import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/forms/client-form";
import { createClientAction } from "@/lib/actions/clients";
import { requireAdmin } from "@/lib/auth";

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New client" />
      <ClientForm action={createClientAction} cancelHref="/clients" />
    </>
  );
}
