// docs/00-plan.md 3章「データモデル」の型定義。
// ここにはロジックを書かない（Step 1 は型のみ）。

export type Player = {
  id: string
  name: string
  colorKey: string // 表の識別色（自動割当・変更可）
  createdAt: string
  archived: boolean // 過去ゲームの整合性を壊さないよう、削除ではなく退避
}

/** 麻雀のポイント計算の設定。 */
export type MahjongRule = {
  /** 配給原点。ふつうは 25000 */
  startScore: number
  /** 返し点。ふつうは 30000。オカ＝（返し点−配給原点）×人数 が1位に付く */
  returnScore: number
  /** 順位ウマ（ポイント単位）。1位から順に並べる。例: [20, 10, -10, -20] */
  uma: number[]
}

export type ScoreRule = {
  unitLabel: string // "点" / "円" / "勝" / "VP" など
  prefix: string // "¥" など（無しも可）
  decimals: 0 | 1 | 2
  step: number // テンキーの増減単位（1 / 10 / 100 / 1000）
  /** 開始時の持ち点。減点式（持ち点から減らしていく遊び方）のために使う。 */
  initialScore: number
  /**
   * 1回ぶんの合計がいくつになるはずか。回ごとの合計が決まっている
   * ゲームで、入れまちがいに気づくために使う。null なら確認しない。
   */
  roundSum: number | null
  /**
   * 麻雀のポイント計算。設定すると、入力は半荘ごとの素点になり、
   * 返し点との差・ウマ・オカからポイントを出して集計する。
   * null なら入れた点をそのまま使う。
   */
  mahjong: MahjongRule | null
  quickValues: number[] // ワンタップ入力用（例: [-10, -5, 5, 10]）
  aggregation: 'sum' | 'average' | 'max' | 'last' // 総合点の出し方
  direction: 'highest' | 'lowest' // 高い方が勝ち / 低い方が勝ち（失点式）
}

export type Game = {
  id: string
  name: string // "カタン 2026-08-28" など
  rule: ScoreRule // 作成時にコピーして埋め込む（プリセット変更の影響を受けない）
  playerIds: string[]
  createdAt: string
  finishedAt: string | null
  memo: string
}

export type ThemeName = 'paper' | 'retro' | 'swiss'

export type Round = {
  id: string
  gameId: string
  index: number // 1始まり
  label: string // 空なら "第N回"
  scores: Record<string, number | null> // key: PlayerId / null = 未入力（0 と区別する）
}

export type Settings = {
  theme: ThemeName
}

/** localStorage に保存する状態の全体。version はスキーマ移行のために持つ。 */
export type AppState = {
  version: 1
  players: Player[]
  games: Game[]
  rounds: Round[]
  settings: Settings
}
