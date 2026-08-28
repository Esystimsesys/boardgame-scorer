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
    note: '半荘ごとのポイントを入れる。回の合計が0になるか確かめる。',
    rule: {
      ...base,
      unitLabel: 'pt',
      decimals: 0,
      quickValues: [-10, -5, -1, 1, 5, 10],
      // 精算後のポイントなので、その回の合計は 0 になる
      roundSum: 0,
      // 素点から自動で計算したいときは、作成画面の詳細で切り替える
      mahjong: null,
    },
  },
]

export const defaultPreset = presets[0]

/**
 * ウマ（順位点）のよくある設定。
 * 数字は千点単位のポイント（+10,000点 = +10pt）。
 * 参考: https://shop.taiyo-chemicals.co.jp/blog/?p=2032
 */
export const umaOptions = [
  { id: 'none', label: 'なし', uma: [0, 0, 0, 0] },
  { id: '5-10', label: 'ゴットー（5-10）', uma: [10, 5, -5, -10] },
  { id: '10-20', label: 'ワンツー（10-20）', uma: [20, 10, -10, -20] },
  { id: '10-30', label: 'ワンスリー（10-30）', uma: [30, 10, -10, -30] },
  { id: '20-30', label: 'ツースリー（20-30）', uma: [30, 20, -20, -30] },
]

/** 素点から計算するモードの、ワンタップ値と回ごとの合計。 */
export const mahjongRawDefaults = {
  quickValues: [-10000, -5000, -1000, 1000, 5000, 10000],
  step: 100,
}

/** ポイントを直接入れるモードの、ワンタップ値と回ごとの合計。 */
export const mahjongPointDefaults = {
  quickValues: [-10, -5, -1, 1, 5, 10],
  step: 1,
  roundSum: 0,
}
