import { createContext } from 'react'
import type { AppState, ScoreRule, ThemeName } from '../types'

export type CreateGameInput = {
  name: string
  rule: ScoreRule
  playerIds: string[]
}

export type Actions = {
  addPlayer: (name: string) => void
  renamePlayer: (id: string, name: string) => void
  archivePlayer: (id: string) => void
  restorePlayer: (id: string) => void
  movePlayer: (id: string, dir: -1 | 1) => void
  /** 作成したゲームの id を返す（遷移に使う） */
  createGame: (input: CreateGameInput) => string
  finishGame: (id: string) => void
  reopenGame: (id: string) => void
  deleteGame: (id: string) => void
  setGameMemo: (id: string, memo: string) => void
  /** 麻雀の入力方法（素点 / ウマ・オカ前のポイント）を切り替える。入力済みの値も変換する */
  setMahjongInput: (gameId: string, input: 'points' | 'raw') => void
  /** 追加した回の id を返す（そのまま入力シートを開くため） */
  addRound: (gameId: string) => string
  deleteRound: (id: string) => void
  setScore: (roundId: string, playerId: string, value: number | null) => void
  setRoundLabel: (roundId: string, label: string) => void
  setTheme: (theme: ThemeName) => void
  importState: (state: AppState) => void
  resetAll: () => void
  undo: () => void
}

export type ContextValue = {
  state: AppState
  canUndo: boolean
  actions: Actions
}

export const AppContext = createContext<ContextValue | null>(null)
