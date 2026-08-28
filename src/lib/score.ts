import type { Round, ScoreRule } from '../types'

/** 表示用のマイナス記号。ハイフンより見分けやすいので U+2212 を使う。 */
const MINUS = '−'

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * 五捨六入。麻雀のポイント計算で使う丸め方で、
 * 0.5 までは切り捨て、0.6 からは切り上げる（マイナスは絶対値で同じ扱い）。
 */
function goshaRokunyu(value: number): number {
  const sign = value < 0 ? -1 : 1
  return sign * Math.floor(Math.abs(value) + 0.4 + 1e-9)
}

/**
 * 1回ぶんの、プレイヤーごとの点。
 *
 * ふつうは入れた値をそのまま返す。麻雀の設定があるときは、入れた素点を
 * ポイントに換算して返す（返し点との差 ÷ 1000 ＋ ウマ ＋ オカ）。
 * 入っていない人は null。
 */
export function roundPoints(
  round: Round,
  playerIds: string[],
  rule: ScoreRule,
): Record<string, number | null> {
  const raw: Record<string, number | null> = {}
  for (const id of playerIds) {
    const v = round.scores[id]
    raw[id] = typeof v === 'number' ? v : null
  }

  const mahjong = rule.mahjong
  if (!mahjong) return raw

  const entered = playerIds.filter((id) => raw[id] !== null)
  if (entered.length === 0) return raw

  // 素点の高い順に並べる。同点は同じ順位とし、その順位ぶんのウマを山分けする
  const sorted = [...entered].sort((a, b) => (raw[b] as number) - (raw[a] as number))
  const oka =
    ((mahjong.returnScore - mahjong.startScore) * entered.length) / 1000

  const points: Record<string, number | null> = { ...raw }
  let i = 0
  while (i < sorted.length) {
    // 同点のかたまりを取り出す
    let j = i
    while (j + 1 < sorted.length && raw[sorted[j + 1]] === raw[sorted[i]]) j += 1
    const size = j - i + 1

    // かたまりが占める順位ぶんのウマを平均する
    let umaSum = 0
    for (let k = i; k <= j; k += 1) umaSum += mahjong.uma[k] ?? 0
    const uma = umaSum / size
    // オカは1位のかたまりで山分けする
    const okaShare = i === 0 ? oka / size : 0

    for (let k = i; k <= j; k += 1) {
      const id = sorted[k]
      const score = raw[id] as number
      // 素点と返し点の差を千点単位にして五捨六入し、そこにウマとオカを足す
      const fromScore = goshaRokunyu((score - mahjong.returnScore) / 1000)
      points[id] = roundTo(fromScore + uma + okaShare, 2)
    }
    i = j + 1
  }

  // 五捨六入の端数で合計が 0 からずれることがある。全員ぶんそろっている
  // ときは、そのずれを1位（同点なら山分け）に寄せて、回の合計を 0 にする。
  if (entered.length === playerIds.length) {
    const total = entered.reduce((a, id) => a + (points[id] as number), 0)
    if (total !== 0) {
      let topSize = 1
      while (
        topSize < sorted.length &&
        raw[sorted[topSize]] === raw[sorted[0]]
      ) {
        topSize += 1
      }
      for (let k = 0; k < topSize; k += 1) {
        const id = sorted[k]
        points[id] = roundTo((points[id] as number) - total / topSize, 2)
      }
    }
  }
  return points
}

/**
 * そのプレイヤーの、ラウンドをまたいだ総合点。未入力（null）は集計から外す。
 * 麻雀の設定があるときは、換算後のポイントを積み上げる。
 */
export function aggregate(
  rounds: Round[],
  playerId: string,
  rule: ScoreRule,
  playerIds: string[] = [playerId],
): number {
  // 古い記録には持ち点が無いので、その場合は 0 とみなす
  const initial = rule.initialScore ?? 0
  const values = rounds
    .map((r) => roundPoints(r, playerIds, rule)[playerId])
    .filter((v): v is number => typeof v === 'number')

  if (values.length === 0) return rule.aggregation === 'sum' ? initial : 0

  switch (rule.aggregation) {
    case 'sum':
      return roundTo(initial + values.reduce((a, b) => a + b, 0), 2)
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
    total: aggregate(rounds, playerId, rule, playerIds),
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
export function formatValue(
  value: number,
  rule: ScoreRule,
  options?: { plus?: boolean },
): string {
  const abs = Math.abs(value).toLocaleString('ja-JP', {
    minimumFractionDigits: rule.decimals,
    maximumFractionDigits: rule.decimals,
  })
  const sign = value < 0 ? MINUS : options?.plus && value > 0 ? '+' : ''
  return `${sign}${rule.prefix}${abs}`
}

/**
 * 入力した値そのもの（麻雀なら素点）の表示。
 * ポイントは小数を使うが、素点は整数なので桁を分けて扱う。
 */
export function formatRaw(value: number, rule: ScoreRule): string {
  if (!rule.mahjong) return formatValue(value, rule)
  const abs = Math.abs(Math.round(value)).toLocaleString('ja-JP')
  return `${value < 0 ? MINUS : ''}${abs}`
}

/** 表のセル用。未入力は 0 と区別して「—」で見せる。 */
export function formatCell(
  value: number | null | undefined,
  rule: ScoreRule,
  options?: { plus?: boolean },
): string {
  if (value === null || value === undefined) return '—'
  return formatValue(value, rule, options)
}

export type RoundBalance = {
  /** その回に入っている点の合計（入れたままの値。麻雀なら素点） */
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
 * 麻雀では素点の合計が「配給原点 × 人数」になるはずなので、そこから作る。
 */
export function roundBalance(
  round: Round,
  playerIds: string[],
  rule: ScoreRule,
): RoundBalance | null {
  const target = rule.mahjong
    ? rule.mahjong.startScore * playerIds.length
    : (rule.roundSum ?? null)
  if (target === null) return null

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
