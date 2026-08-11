export function rotateRadarTopics<T>(topics: T[], dateKey: string): T[] {
  if (topics.length < 2) return [...topics];
  const parsed = Date.parse(`${dateKey}T00:00:00Z`);
  const dayNumber = Number.isFinite(parsed) ? Math.floor(parsed / 86_400_000) : 0;
  const offset = ((dayNumber % topics.length) + topics.length) % topics.length;
  return [...topics.slice(offset), ...topics.slice(0, offset)];
}
