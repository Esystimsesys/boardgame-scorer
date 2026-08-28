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
  quickValues: [-5, -1, 1, 5],
  aggregation: 'sum',
  direction: 'highest',
}

export const presets: Preset[] = [
  {
    id: 'points',
    label: '汎用ポイント',
    note: '合計が多い人が勝ち。いちばん普通の得点計算。',
    rule: { ...base },
  },
  {
    id: 'points-minus',
    label: 'マイナスあり点数',
    note: '減点のあるゲーム向け。ワンタップに負の値を並べてある。',
    rule: { ...base, quickValues: [-10, -5, 5, 10] },
  },
  {
    id: 'penalty',
    label: '失点式（ゴルフ・UNO）',
    note: '合計が少ない人が勝ち。',
    rule: { ...base, direction: 'lowest', quickValues: [1, 5, 10, 20] },
  },
  {
    id: 'money',
    label: '金額',
    note: '¥ と3桁区切りで表示する。100円単位。',
    rule: {
      ...base,
      unitLabel: '',
      prefix: '¥',
      step: 100,
      quickValues: [-1000, -500, 500, 1000],
    },
  },
  {
    id: 'wins',
    label: '勝利数',
    note: '1回＝1ゲームとして勝った数を数える。',
    rule: { ...base, unitLabel: '勝', quickValues: [-1, 1] },
  },
  {
    id: 'mahjong',
    label: '麻雀（素点）',
    note: 'プラスとマイナスが前提。100点単位。',
    rule: {
      ...base,
      step: 100,
      quickValues: [-8000, -1000, 1000, 8000],
    },
  },
]

export const defaultPreset = presets[0]
