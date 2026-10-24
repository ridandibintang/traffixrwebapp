// PostgREST caps a single select at 1000 rows. Audit findings easily exceed
// that (one crawl can produce thousands), so reads that need every row page
// through with .range(). The caller supplies a query factory that applies
// filters and a stable order; this helper adds the range.
type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function fetchAll<T>(
  page: (from: number, to: number) => PageResult<T>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return all;
}
