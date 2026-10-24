"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Posts to a bound server action after a browser confirm.
export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this item? This cannot be undone.",
  size = "sm",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  size?: "sm" | "xs" | "default";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size={size}>
        <Trash2 />
        {label}
      </Button>
    </form>
  );
}
