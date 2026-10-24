import { redirect } from "next/navigation";
import { getCurrentUser, homePathFor } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(homePathFor(user.profile.role));
}
