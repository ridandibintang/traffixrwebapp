import Link from "next/link";
import { Button } from "@/components/ui/button";

// Button styling on a Next.js <Link>. Base UI buttons take a `render` prop
// instead of `asChild`.
export function LinkButton({
  href,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "render"> & { href: string }) {
  return (
    <Button render={<Link href={href} />} nativeButton={false} {...props}>
      {children}
    </Button>
  );
}
