import type { AppState } from '../types'

const KEY = 'bgs:v1'

export const emptyState: AppState = {
  version: 1,
  players: [],
  games: [],
  rounds: [],
  settings: { theme: 'paper' },
}

/** 壊れた JSON や localStorage が使えない環境でもアプリが起動できるようにする。 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (parsed.version !== 1) return emptyState
    return {
      version: 1,
      players: parsed.players ?? [],
      games: parsed.games ?? [],
      rounds: parsed.rounds ?? [],
      settings: { theme: parsed.settings?.theme ?? 'paper' },
    }
  } catch {
    return emptyState
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 容量超過やプライベートブラウジングでは保存しない（画面は動き続ける）
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 何もしない
  }
}
