import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { ApplicationStage, UserRecord, UserState } from '../types'

const STORAGE_KEY = 'ctsparks.userstate.v1'

const EMPTY_RECORD: UserRecord = { application: { stage: 'none' } }

type Action =
  | { type: 'toggleFavorite'; id: string }
  | { type: 'markViewed'; id: string }
  | { type: 'setStage'; id: string; stage: ApplicationStage }
  | { type: 'setNote'; id: string; note: string }

function ensure(state: UserState, id: string): UserRecord {
  return state[id] ?? EMPTY_RECORD
}

function reducer(state: UserState, action: Action): UserState {
  const now = Date.now()
  const cur = ensure(state, action.id)
  switch (action.type) {
    case 'toggleFavorite': {
      const favorite = !cur.favorite
      return {
        ...state,
        [action.id]: {
          ...cur,
          favorite,
          favoritedAt: favorite ? now : undefined,
        },
      }
    }
    case 'markViewed': {
      if (cur.viewedAt) return state // only record first view timestamp changes
      return { ...state, [action.id]: { ...cur, viewedAt: now } }
    }
    case 'setStage': {
      const application = {
        ...cur.application,
        stage: action.stage,
        updatedAt: now,
        appliedAt:
          action.stage !== 'none'
            ? cur.application.appliedAt ?? now
            : undefined,
      }
      return { ...state, [action.id]: { ...cur, application } }
    }
    case 'setNote': {
      return {
        ...state,
        [action.id]: {
          ...cur,
          application: { ...cur.application, note: action.note },
        },
      }
    }
    default:
      return state
  }
}

function load(): UserState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as UserState) : {}
  } catch {
    return {}
  }
}

interface Ctx {
  state: UserState
  get: (id: string) => UserRecord
  toggleFavorite: (id: string) => void
  markViewed: (id: string) => void
  setStage: (id: string, stage: ApplicationStage) => void
  setNote: (id: string, note: string) => void
}

const UserCtx = createContext<Ctx | null>(null)

export function UserStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable (private mode / quota) — app still works */
    }
  }, [state])

  const get = useCallback((id: string) => state[id] ?? EMPTY_RECORD, [state])
  const toggleFavorite = useCallback(
    (id: string) => dispatch({ type: 'toggleFavorite', id }),
    [],
  )
  const markViewed = useCallback(
    (id: string) => dispatch({ type: 'markViewed', id }),
    [],
  )
  const setStage = useCallback(
    (id: string, stage: ApplicationStage) =>
      dispatch({ type: 'setStage', id, stage }),
    [],
  )
  const setNote = useCallback(
    (id: string, note: string) => dispatch({ type: 'setNote', id, note }),
    [],
  )

  const value = useMemo<Ctx>(
    () => ({ state, get, toggleFavorite, markViewed, setStage, setNote }),
    [state, get, toggleFavorite, markViewed, setStage, setNote],
  )

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>
}

export function useUserState(): Ctx {
  const ctx = useContext(UserCtx)
  if (!ctx) throw new Error('useUserState must be used within UserStateProvider')
  return ctx
}
