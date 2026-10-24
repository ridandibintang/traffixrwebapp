import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Traffixr" };

const REASON_MESSAGES: Record<string, string> = {
  inactive: "Your account is inactive. Ask your admin to reactivate it.",
  signed_out: "You have been signed out.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const notice = reason ? REASON_MESSAGES[reason] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Traffixr
          </p>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Internal workspace for the Traffixr team.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {notice ? (
            <p className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              {notice}
            </p>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
