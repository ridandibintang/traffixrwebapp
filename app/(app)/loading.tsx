// Shown instantly while a page in the signed-in area renders on the server,
// so navigation gives feedback before the data arrives.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="h-4 w-80 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/40" />
        ))}
      </div>
      <div className="h-64 rounded-lg border bg-muted/40" />
    </div>
  );
}
