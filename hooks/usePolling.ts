import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  /** Hàm fetch; trả về payload để xử lý. Throw error để skip poll kế tiếp. */
  fetcher: () => Promise<T>;
  /** Bật/tắt polling */
  enabled: boolean;
  /** Khoảng cách polling tối thiểu (ms). Mặc định 4000 */
  intervalMs?: number;
  /** Khoảng cách polling tối đa (ms). Mặc định 12000 */
  maxIntervalMs?: number;
  /** Dừng polling khi fetcher trả về giá trị thoả mãn. */
  stopWhen?: (result: T) => boolean;
  /** Báo lỗi nhưng vẫn tiếp tục polling */
  onError?: (error: unknown) => void;
}

interface UsePollingResult<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  stop: () => void;
  resume: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook polling tổng quát dùng cho:
 * - booking status (chờ staff xác nhận, chờ PayOS...)
 * - notification unread count
 *
 * Tự động dừng khi `stopWhen(data)` true, khi component unmount, hoặc khi `enabled = false`.
 */
export function usePolling<T>({
  fetcher,
  enabled,
  intervalMs = 4000,
  maxIntervalMs = 12000,
  stopWhen,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const stoppedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    stoppedRef.current = false;
  }, []);

  const runOnce = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (stoppedRef.current) return;
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      if (!stoppedRef.current) {
        setError(err);
        onError?.(err);
      }
      throw err;
    } finally {
      if (!stoppedRef.current) setLoading(false);
    }
  }, [onError]);

  const refresh = useCallback(async () => {
    stoppedRef.current = false;
    await runOnce();
  }, [runOnce]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    stoppedRef.current = false;
    let currentInterval = intervalMs;

    const tick = async () => {
      if (stoppedRef.current) return;
      try {
        const result = await runOnce();
        if (stoppedRef.current) return;
        if (stopWhen && result && stopWhen(result)) {
          stop();
          return;
        }
      } catch {
        // Swallow error to keep polling alive; error already saved to state
      }
      if (stoppedRef.current) return;
      // Exponential backoff capped at maxIntervalMs
      currentInterval = Math.min(currentInterval * 1.4, maxIntervalMs);
      timeoutRef.current = setTimeout(tick, currentInterval);
    };

    void tick();

    return () => {
      stop();
    };
    // We intentionally only re-run when enabled/interval changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, maxIntervalMs]);

  return { data, error, loading, stop, resume, refresh };
}
