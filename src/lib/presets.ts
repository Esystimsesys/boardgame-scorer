import type { ScoreRule } from '../types'

export type Preset = {
  id: string
  label: string
  note: string
  rule: ScoreRule
}

const base: ScoreRule = {
  unitLabel: '点',
  prefix: '',
  decimals: 0,
  step: 1,
  initialScore: 0,
  quickValues: [-3, -2, -1, 1, 2, 3],
  aggregation: 'sum',
  direction: 'highest',
}

/**
 * プリセットは「よくある2通り」だけに絞ってある。
 * これ以外のゲーム（金額を数える、勝った回数を数える、など）は
 * 作成画面の「詳細を編集」で単位や集計方法を変えれば作れる。
 */
export const presets: Preset[] = [
  {
    id: 'points',
    label: '合計が多い人が勝ち',
    note: 'ふつうの得点計算。マイナスの点も入れられる。',
    rule: { ...base },
  },
  {
    id: 'penalty',
    label: '合計が少ない人が勝ち',
    note: '失点や打数など、少ないほうがよいゲーム向け。',
    rule: { ...base, direction: 'lowest' },
  },
]

export const defaultPreset = presets[0]
