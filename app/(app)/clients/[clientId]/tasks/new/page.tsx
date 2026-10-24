import { TaskForm } from "@/components/forms/task-form";
import { createTaskAction } from "@/lib/actions/tasks";
import { getClientOr404, getTeam } from "@/lib/queries/clients";
import { getClientCycles } from "@/lib/queries/cycles";

export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ cycle?: string; return_to?: string }>;
}) {
  const { clientId } = await params;
  const { cycle, return_to } = await searchParams;
  await getClientOr404(clientId);
  const [cycles, team] = await Promise.all([getClientCycles(clientId), getTeam()]);

  const returnTo = return_to?.startsWith("/") ? return_to : `/clients/${clientId}`;

  return (
    <>
      <h2 className="text-lg font-semibold">New task</h2>
      <TaskForm
        action={createTaskAction.bind(null, clientId)}
        defaultCycleId={cycle ?? null}
        cycles={cycles}
        team={team}
        returnTo={returnTo}
      />
    </>
  );
}
