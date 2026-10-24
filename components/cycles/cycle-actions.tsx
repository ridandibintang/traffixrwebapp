import { CheckCheck, Play, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCycleStatusAction } from "@/lib/actions/cycles";
import type { CycleStatus } from "@/lib/types";

// Forward-only status buttons. Any other change goes through the edit form.
export function CycleActions({ cycleId, status }: { cycleId: string; status: CycleStatus }) {
  if (status === "planning") {
    return (
      <form action={setCycleStatusAction.bind(null, cycleId, "active")}>
        <Button type="submit" size="sm">
          <Play />
          Start cycle
        </Button>
      </form>
    );
  }
  if (status === "active") {
    return (
      <form action={setCycleStatusAction.bind(null, cycleId, "review")}>
        <Button type="submit" size="sm" variant="outline">
          <SearchCheck />
          Move to review
        </Button>
      </form>
    );
  }
  if (status === "review") {
    return (
      <form action={setCycleStatusAction.bind(null, cycleId, "closed")}>
        <Button type="submit" size="sm">
          <CheckCheck />
          Close cycle
        </Button>
      </form>
    );
  }
  return null;
}
