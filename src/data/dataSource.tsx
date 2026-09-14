import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Contractor, DataMode } from '../types'
import { SAMPLE_CONTRACTORS } from './sampleData'
import { fetchLiveContractors } from './ctApi'

const MODE_KEY = 'ctsparks.datamode.v1'

type Status = 'ready' | 'loading' | 'error'

interface Ctx {
  mode: DataMode
  setMode: (m: DataMode) => void
  contractors: Contractor[]
  status: Status
  error?: string
  /** True when live mode failed and we're showing sample data instead. */
  usingFallback: boolean
  scanned?: number
  lastUpdated?: number
  refresh: () => void
}

const DataCtx = createContext<Ctx | null>(null)

function loadMode(): DataMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'live' ? 'live' : 'sample'
  } catch {
    return 'sample'
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>(loadMode)
  const [contractors, setContractors] = useState<Contractor[]>(
    SAMPLE_CONTRACTORS,
  )
  const [status, setStatus] = useState<Status>('ready')
  const [error, setError] = useState<string | undefined>()
  const [usingFallback, setUsingFallback] = useState(false)
  const [scanned, setScanned] = useState<number | undefined>()
  const [lastUpdated, setLastUpdated] = useState<number | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const runLive = useCallback(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStatus('loading')
    setError(undefined)
    fetchLiveContractors(ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return
        if (!res.contractors.length) {
          setContractors(SAMPLE_CONTRACTORS)
          setUsingFallback(true)
          setError(
            'No E-1 electrical companies were returned from the live dataset. Showing sample data.',
          )
          setStatus('error')
          return
        }
        setContractors(res.contractors)
        setScanned(res.scanned)
        setUsingFallback(false)
        setLastUpdated(Date.now())
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        setContractors(SAMPLE_CONTRACTORS)
        setUsingFallback(true)
        setError(
          err instanceof Error
            ? err.message
            : 'Could not reach the CT open-data service.',
        )
        setStatus('error')
      })
  }, [])

  const setMode = useCallback(
    (m: DataMode) => {
      setModeState(m)
      try {
        localStorage.setItem(MODE_KEY, m)
      } catch {
        /* ignore */
      }
      if (m === 'sample') {
        abortRef.current?.abort()
        setContractors(SAMPLE_CONTRACTORS)
        setStatus('ready')
        setError(undefined)
        setUsingFallback(false)
        setScanned(undefined)
      } else {
        runLive()
      }
    },
    [runLive],
  )

  const refresh = useCallback(() => {
    if (mode === 'live') runLive()
  }, [mode, runLive])

  // Kick off a live fetch on mount if the persisted mode is 'live'.
  useEffect(() => {
    if (mode === 'live') runLive()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      mode,
      setMode,
      contractors,
      status,
      error,
      usingFallback,
      scanned,
      lastUpdated,
      refresh,
    }),
    [
      mode,
      setMode,
      contractors,
      status,
      error,
      usingFallback,
      scanned,
      lastUpdated,
      refresh,
    ],
  )

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useData(): Ctx {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
