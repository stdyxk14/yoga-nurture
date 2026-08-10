type PerformanceLog = {
  operation: string;
  route: string;
  durationMs: number;
  success: boolean;
  count?: number;
};

type PerformanceOperation = Pick<PerformanceLog, "operation" | "route">;

export function sanitizePerformanceRoute(pathname: string) {
  return pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
    "/[id]",
  );
}

function emitPerformanceLog(entry: PerformanceLog) {
  if (process.env.PERF_LOGGING !== "true") return;
  console.info(JSON.stringify(entry));
}

export async function measurePerformance<T>(
  operation: PerformanceOperation,
  task: () => Promise<T>,
  getCount?: (result: T) => number | undefined,
  isSuccess?: (result: T) => boolean,
): Promise<T> {
  const startedAt = performance.now();

  try {
    const result = await task();
    const count = getCount?.(result);
    emitPerformanceLog({
      ...operation,
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
      success: isSuccess?.(result) ?? true,
      ...(count === undefined ? {} : { count }),
    });
    return result;
  } catch (error) {
    emitPerformanceLog({
      ...operation,
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
      success: false,
    });
    throw error;
  }
}
