import { useContext, useMemo } from 'react'
import type { Round } from '../types'
import { AppContext, type ContextValue } from './context'

export function useApp(): ContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('AppProvider の外で useApp が呼ばれました')
  return value
}

/** ゲームに属するラウンドを回番号順で取り出す。 */
export function useGameRounds(gameId: string | undefined): Round[] {
  const { state } = useApp()
  return useMemo(
    () =>
      state.rounds
        .filter((r) => r.gameId === gameId)
        .sort((a, b) => a.index - b.index),
    [state.rounds, gameId],
  )
}
