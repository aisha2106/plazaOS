import { useEffect, useState } from 'react'

/**
 * Runs an async fetcher whenever `deps` changes, tracking a loading flag and
 * keeping the previous result on screen while the next one loads (avoids a
 * flash-to-empty on every filter/sort/page change). Ignores results from a
 * fetch that's no longer current (e.g. the user changed filters again before
 * it resolved).
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[], initial: T): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        // List/detail pages render an empty/not-found state on error; the
        // underlying api client already surfaces auth errors (401 redirect).
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading }
}
