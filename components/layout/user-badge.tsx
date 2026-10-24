import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/auth";

const ROLE_LABEL = { admin: "Admin", writer: "Writer" } as const;

export function UserBadge({ user }: { user: CurrentUser }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium">
          {user.profile.full_name || user.email}
        </span>
        <Badge variant="secondary">{ROLE_LABEL[user.profile.role]}</Badge>
      </div>
      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
    </div>
  );
}
