import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AppState, Game, Player, Round, ThemeName } from '../types'
import { AppContext, type Actions, type ContextValue } from './context'
import { clearState, emptyState, loadState, saveState } from './storage'

const COLOR_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

type Action =
  | { type: 'player/add'; name: string }
  | { type: 'player/rename'; id: string; name: string }
  | { type: 'player/archive'; id: string }
  | { type: 'player/restore'; id: string }
  | { type: 'player/move'; id: string; dir: -1 | 1 }
  | { type: 'game/create'; game: Game }
  | { type: 'game/finish'; id: string }
  | { type: 'game/reopen'; id: string }
  | { type: 'game/delete'; id: string }
  | { type: 'game/memo'; id: string; memo: string }
  | { type: 'round/add'; gameId: string; round: Round }
  | { type: 'round/delete'; id: string }
  | { type: 'round/setScore'; roundId: string; playerId: string; value: number | null }
  | { type: 'round/setLabel'; roundId: string; label: string }
  | { type: 'settings/theme'; theme: ThemeName }
  | { type: 'data/import'; state: AppState }
  | { type: 'data/reset' }
  | { type: 'undo' }

/** 「ひとつ戻す」の対象にする操作。取り消して困らないものだけを入れる。 */
const UNDOABLE: Action['type'][] = [
  'player/archive',
  'game/finish',
  'game/delete',
  'round/add',
  'round/delete',
  'round/setScore',
]

type Store = {
  data: AppState
  /** 直前の状態。1段階だけ保持する。 */
  past: AppState | null
}

function reduceData(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'player/add': {
      const player: Player = {
        id: newId(),
        name: action.name.trim(),
        colorKey: COLOR_KEYS[state.players.length % COLOR_KEYS.length],
        createdAt: nowIso(),
        archived: false,
      }
      return { ...state, players: [...state.players, player] }
    }
    case 'player/rename':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, name: action.name.trim() } : p,
        ),
      }
    case 'player/archive':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, archived: true } : p,
        ),
      }
    case 'player/restore':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.id ? { ...p, archived: false } : p,
        ),
      }
    case 'player/move': {
      const players = [...state.players]
      const i = players.findIndex((p) => p.id === action.id)
      const j = i + action.dir
      if (i < 0 || j < 0 || j >= players.length) return state
      ;[players[i], players[j]] = [players[j], players[i]]
      return { ...state, players }
    }
    case 'game/create':
      return { ...state, games: [action.game, ...state.games] }
    case 'game/finish':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.id ? { ...g, finishedAt: nowIso() } : g,
        ),
      }
    case 'game/reopen':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.id ? { ...g, finishedAt: null } : g,
        ),
      }
    case 'game/delete':
      return {
        ...state,
        games: state.games.filter((g) => g.id !== action.id),
        rounds: state.rounds.filter((r) => r.gameId !== action.id),
      }
    case 'game/memo':
      return {
        ...state,
        games: state.games.map((g) =>
          g.id === action.id ? { ...g, memo: action.memo } : g,
        ),
      }
    case 'round/add':
      return { ...state, rounds: [...state.rounds, action.round] }
    case 'round/delete': {
      const target = state.rounds.find((r) => r.id === action.id)
      if (!target) return state
      const rest = state.rounds.filter((r) => r.id !== action.id)
      // 同じゲームの回番号を詰め直す
      let n = 0
      const rounds = rest.map((r) => {
        if (r.gameId !== target.gameId) return r
        n += 1
        return { ...r, index: n }
      })
      return { ...state, rounds }
    }
    case 'round/setScore':
      return {
        ...state,
        rounds: state.rounds.map((r) =>
          r.id === action.roundId
            ? { ...r, scores: { ...r.scores, [action.playerId]: action.value } }
            : r,
        ),
      }
    case 'round/setLabel':
      return {
        ...state,
        rounds: state.rounds.map((r) =>
          r.id === action.roundId ? { ...r, label: action.label } : r,
        ),
      }
    case 'settings/theme':
      return { ...state, settings: { ...state.settings, theme: action.theme } }
    case 'data/import':
      return action.state
    case 'data/reset':
      return { ...emptyState, settings: state.settings }
    default:
      return state
  }
}

function reducer(store: Store, action: Action): Store {
  if (action.type === 'undo') {
    if (!store.past) return store
    return { data: store.past, past: null }
  }
  const data = reduceData(store.data, action)
  if (data === store.data) return store
  const past = UNDOABLE.includes(action.type) ? store.data : store.past
  return { data, past }
}


export function AppProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, null, () => ({
    data: loadState(),
    past: null,
  }))

  useEffect(() => {
    saveState(store.data)
  }, [store.data])

  // テーマは <html data-theme> に反映する（CSS 側はトークンだけで切り替わる）
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = store.data.settings.theme
    // ブラウザの枠やステータスバーの色も、テーマに合わせる。合っていないと
    // 画面の上下に色の境目ができる。画面の上端に接しているのはヘッダなので、
    // ヘッダに色が付いているテーマ（レトロ）ではその色を使う。
    const style = getComputedStyle(root)
    const headBg = style.getPropertyValue('--head-bg').trim()
    const bg = style.getPropertyValue('--bg').trim()
    const color = headBg && headBg !== 'transparent' ? headBg : bg
    const meta = document.querySelector('meta[name="theme-color"]')
    if (color && meta) meta.setAttribute('content', color)
  }, [store.data.settings.theme])

  const value = useMemo<ContextValue>(() => {
    const actions: Actions = {
      addPlayer: (name) => dispatch({ type: 'player/add', name }),
      renamePlayer: (id, name) => dispatch({ type: 'player/rename', id, name }),
      archivePlayer: (id) => dispatch({ type: 'player/archive', id }),
      restorePlayer: (id) => dispatch({ type: 'player/restore', id }),
      movePlayer: (id, dir) => dispatch({ type: 'player/move', id, dir }),
      createGame: ({ name, rule, playerIds }) => {
        const game: Game = {
          id: newId(),
          name,
          rule,
          playerIds,
          createdAt: nowIso(),
          finishedAt: null,
          memo: '',
        }
        dispatch({ type: 'game/create', game })
        return game.id
      },
      finishGame: (id) => dispatch({ type: 'game/finish', id }),
      reopenGame: (id) => dispatch({ type: 'game/reopen', id }),
      deleteGame: (id) => dispatch({ type: 'game/delete', id }),
      setGameMemo: (id, memo) => dispatch({ type: 'game/memo', id, memo }),
      addRound: (gameId) => {
        const index =
          store.data.rounds.filter((r) => r.gameId === gameId).length + 1
        const round: Round = {
          id: newId(),
          gameId,
          index,
          label: '',
          scores: {},
        }
        dispatch({ type: 'round/add', gameId, round })
        return round.id
      },
      deleteRound: (id) => dispatch({ type: 'round/delete', id }),
      setScore: (roundId, playerId, value) =>
        dispatch({ type: 'round/setScore', roundId, playerId, value }),
      setRoundLabel: (roundId, label) =>
        dispatch({ type: 'round/setLabel', roundId, label }),
      setTheme: (theme) => dispatch({ type: 'settings/theme', theme }),
      importState: (state) => dispatch({ type: 'data/import', state }),
      resetAll: () => {
        clearState()
        dispatch({ type: 'data/reset' })
      },
      undo: () => dispatch({ type: 'undo' }),
    }
    return { state: store.data, canUndo: store.past !== null, actions }
  }, [store.data, store.past])

  return <AppContext value={value}>{children}</AppContext>
}
