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
  quickValues: [-10, -5, 5, 10],
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
    label: '汎用ポイント',
    note: '合計が多い人が勝ち。プラスもマイナスも入れられる。',
    rule: { ...base },
  },
  {
    id: 'penalty',
    label: '失点式（ゴルフ・UNO）',
    note: '合計が少ない人が勝ち。',
    rule: { ...base, direction: 'lowest', quickValues: [1, 5, 10, 20] },
  },
]

export const defaultPreset = presets[0]
