import { Button } from "@/components/ui/button";

// Button styling on a plain <a download>, for route handlers that return a
// file. A Next.js <Link> would try a client-side navigation first.
export function DownloadButton({
  href,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "render"> & { href: string }) {
  return (
    <Button render={<a href={href} download />} nativeButton={false} {...props}>
      {children}
    </Button>
  );
}
