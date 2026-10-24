import { notFound } from "next/navigation";
import { TaskForm } from "@/components/forms/task-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import { getTeam } from "@/lib/queries/clients";
import { getClientCycles } from "@/lib/queries/cycles";
import { createClient } from "@/lib/supabase/server";

export default async function EditTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; taskId: string }>;
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { clientId, taskId } = await params;
  const { return_to } = await searchParams;
  const supabase = await createClient();

  const [{ data: task }, cycles, team] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", taskId).eq("client_id", clientId).maybeSingle(),
    getClientCycles(clientId),
    getTeam(),
  ]);
  if (!task) notFound();

  const returnTo = return_to?.startsWith("/") ? return_to : `/clients/${clientId}`;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit task</h2>
        <DeleteButton
          action={deleteTaskAction.bind(null, task.id, returnTo)}
          confirmText="Delete this task? Audit findings linked to it will be unlinked."
        />
      </div>
      <TaskForm
        action={updateTaskAction.bind(null, task.id)}
        initial={task}
        cycles={cycles}
        team={team}
        returnTo={returnTo}
      />
    </>
  );
}
