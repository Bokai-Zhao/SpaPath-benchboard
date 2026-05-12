export function rankDescending<T>(rows: T[], value: (row: T) => number | null | undefined): Array<T & { rank: number | null }> {
  const valid = rows
    .map((row, index) => ({ row, index, score: value(row) }))
    .filter((item): item is { row: T; index: number; score: number } => typeof item.score === "number" && Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score);
  const ranks = new Map<number, number>();
  valid.forEach((item, position) => ranks.set(item.index, position + 1));
  return rows.map((row, index) => ({ ...row, rank: ranks.get(index) ?? null }));
}
