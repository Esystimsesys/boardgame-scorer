import type { Round, ScoreRule } from '../types'

/** 表示用のマイナス記号。ハイフンより見分けやすいので U+2212 を使う。 */
const MINUS = '−'

/**
 * そのプレイヤーの、ラウンドをまたいだ総合点。未入力（null）は集計から外す。
 * 持ち点は「合計」のときだけ足す（平均や最大に足すと意味が変わってしまうため）。
 */
export function aggregate(
  rounds: Round[],
  playerId: string,
  rule: ScoreRule,
): number {
  // 古い記録には持ち点が無いので、その場合は 0 とみなす
  const initial = rule.initialScore ?? 0
  const values = rounds
    .map((r) => r.scores[playerId])
    .filter((v): v is number => typeof v === 'number')

  if (values.length === 0) return rule.aggregation === 'sum' ? initial : 0

  switch (rule.aggregation) {
    case 'sum':
      return initial + values.reduce((a, b) => a + b, 0)
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'max':
      return Math.max(...values)
    case 'last':
      return values[values.length - 1]
  }
}

export type Standing = {
  playerId: string
  total: number
  /** 同点は同順位。次の順位は人数分飛ばす（1, 2, 2, 4）。 */
  rank: number
}

export function standings(
  rounds: Round[],
  playerIds: string[],
  rule: ScoreRule,
): Standing[] {
  const totals = playerIds.map((playerId) => ({
    playerId,
    total: aggregate(rounds, playerId, rule),
  }))

  const sorted = [...totals].sort((a, b) =>
    rule.direction === 'highest' ? b.total - a.total : a.total - b.total,
  )

  const result: Standing[] = []
  sorted.forEach((entry, i) => {
    const prev = result[i - 1]
    const rank = prev && prev.total === entry.total ? prev.rank : i + 1
    result.push({ ...entry, rank })
  })
  return result
}

/** 数値を表示用の文字列にする（符号・小数桁・3桁区切り・接頭記号）。 */
export function formatValue(value: number, rule: ScoreRule): string {
  const abs = Math.abs(value).toLocaleString('ja-JP', {
    minimumFractionDigits: rule.decimals,
    maximumFractionDigits: rule.decimals,
  })
  const sign = value < 0 ? MINUS : ''
  return `${sign}${rule.prefix}${abs}`
}

/** 表のセル用。未入力は 0 と区別して「—」で見せる。 */
export function formatCell(
  value: number | null | undefined,
  rule: ScoreRule,
): string {
  if (value === null || value === undefined) return '—'
  return formatValue(value, rule)
}

export type RoundBalance = {
  /** その回に入っている点の合計 */
  sum: number
  /** そろうべき合計 */
  target: number
  /** あといくつ足りないか（target - sum） */
  diff: number
  /** 全員ぶん入っているか */
  complete: boolean
}

/**
 * 回ごとの合計の確認。確認しない設定のときは null を返す。
 * 麻雀の収支のように「その回の合計が決まっている」ゲームで、
 * 入れまちがいに気づけるようにするためのもの。
 */
export function roundBalance(
  round: Round,
  playerIds: string[],
  rule: ScoreRule,
): RoundBalance | null {
  const target = rule.roundSum
  if (target === null || target === undefined) return null

  let sum = 0
  let entered = 0
  for (const id of playerIds) {
    const v = round.scores[id]
    if (typeof v === 'number') {
      sum += v
      entered += 1
    }
  }
  return {
    sum,
    target,
    diff: target - sum,
    complete: entered === playerIds.length,
  }
}

export function roundLabel(round: Round): string {
  return round.label.trim() || `第${round.index}回`
}
