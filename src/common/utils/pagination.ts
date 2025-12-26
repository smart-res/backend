export function parsePaging(q: any) {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}