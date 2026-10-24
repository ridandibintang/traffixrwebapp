import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Plain form POST so it works without client JavaScript.
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
        <LogOut />
        Sign out
      </Button>
    </form>
  );
}
