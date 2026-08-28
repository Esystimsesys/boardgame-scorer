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
  roundSum: null,
  mahjong: null,
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
  {
    id: 'mahjong',
    label: '麻雀',
    note: '半荘ごとの素点を入れると、ウマ・オカを入れたポイントに換算する。',
    rule: {
      ...base,
      unitLabel: 'pt',
      // ポイントは 0.1 きざみで出る（32,400点 → +2.4pt）
      decimals: 1,
      step: 100,
      // ワンタップ値は素点に対して足し引きする
      quickValues: [-10000, -5000, -1000, 1000, 5000, 10000],
      mahjong: {
        startScore: 25000,
        returnScore: 30000,
        // ワンツー（10-20）。ゴットーなら [10, 5, -5, -10]
        uma: [20, 10, -10, -20],
      },
    },
  },
]

export const defaultPreset = presets[0]
