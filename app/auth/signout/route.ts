import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST from the sign-out button; GET when the app itself has to end a session
// (for example when a profile is deactivated while the user is signed in).
async function signOut(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const reason = request.nextUrl.searchParams.get("reason");
  url.searchParams.set("reason", reason ?? "signed_out");

  return NextResponse.redirect(url, { status: 303 });
}

export const GET = signOut;
export const POST = signOut;
