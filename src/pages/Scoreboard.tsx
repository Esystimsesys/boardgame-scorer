import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApp, useGameRounds } from '../store/useApp'
import {
  aggregate,
  formatCell,
  formatValue,
  roundBalance,
  roundLabel,
  roundPoints,
  standings,
} from '../lib/score'
import type { ScoreRule } from '../types'
import { formatLocalDate } from '../lib/date'
import ScoreInputSheet from '../components/ScoreInputSheet'
import page from './Placeholder.module.css'
import styles from './Scoreboard.module.css'

const AGGREGATION_LABEL: Record<ScoreRule['aggregation'], string> = {
  sum: '合計で競う',
  average: '平均で競う',
  max: '最大値で競う',
  last: '最後の値で競う',
}

const DIRECTION_LABEL: Record<ScoreRule['direction'], string> = {
  highest: '高い方が勝ち',
  lowest: '低い方が勝ち',
}

type SheetTarget = {
  roundId: string
  playerId: string
}

export default function Scoreboard() {
  const { gameId } = useParams()
  const { state, actions } = useApp()
  const rounds = useGameRounds(gameId)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  // 人数が少ないときは表が画面に収まるので、横スクロールの案内を出さない
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const update = () => setScrollable(el.scrollWidth > el.clientWidth + 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  })

  const game = state.games.find((g) => g.id === gameId)

  const players = useMemo(
    () =>
      (game?.playerIds ?? [])
        .map((id) => state.players.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined),
    [game, state.players],
  )

  const rankings = useMemo(
    () => (game ? standings(rounds, game.playerIds, game.rule) : []),
    [game, rounds],
  )

  if (!game) {
    return (
      <section className={page.page}>
        <h1 className={styles.notFoundTitle}>ゲームが見つかりません</h1>
        <p className={styles.notFoundText}>
          指定されたゲームは存在しないか、削除された可能性があります。
        </p>
        <Link to="/" className={styles.notFoundLink}>
          ホームへ戻る
        </Link>
      </section>
    )
  }

  const rule = game.rule
  // 収支のように増減で見るゲームでは、プラスにも符号を付けたほうが読みやすい
  const showPlus = rule.mahjong !== null || rule.roundSum === 0
  const finished = game.finishedAt !== null
  const unitText = rule.unitLabel || rule.prefix || 'なし'

  function openCell(roundId: string, playerId: string) {
    if (finished) return
    setSheetTarget({ roundId, playerId })
  }

  // 回ごとの合計が決まっているゲームで、合計が合っていない回
  const offRounds = rounds.filter((round) => {
    const balance = roundBalance(round, game.playerIds, rule)
    return balance !== null && balance.complete && balance.diff !== 0
  })

  /** 回を足しただけでは「—」の行が増えるだけなので、そのまま入力に入る */
  const handleAddRound = () => {
    const roundId = actions.addRound(game.id)
    const firstPlayerId = game.playerIds[0]
    if (firstPlayerId) setSheetTarget({ roundId, playerId: firstPlayerId })
  }

  const handleDeleteRound = (roundId: string, label: string) => {
    if (window.confirm(`${label}を削除しますか？この回に入れた得点も消えます。`)) {
      actions.deleteRound(roundId)
    }
  }

  const handleFinish = () => {
    if (window.confirm('ゲームを終えますか？')) {
      actions.finishGame(game.id)
    }
  }

  const activeRound = sheetTarget
    ? rounds.find((r) => r.id === sheetTarget.roundId)
    : undefined

  return (
    <section className={page.page}>
      <header className={styles.header}>
        <div className={styles.top}>
          <h1 className={styles.title}>
            {game.name}
            {finished && <span className={styles.badge}>終了</span>}
          </h1>
          <span className={styles.date}>{formatLocalDate(game.createdAt)}</span>
        </div>
        <ul className={styles.meta}>
          <li>{AGGREGATION_LABEL[rule.aggregation]}</li>
          <li>{DIRECTION_LABEL[rule.direction]}</li>
          <li>単位：{unitText}</li>
          {rule.aggregation === 'sum' && (rule.initialScore ?? 0) !== 0 && (
            <li>持ち点：{formatValue(rule.initialScore, rule)}から</li>
          )}
          {rule.mahjong && (
            <li>
              {rule.mahjong.startScore.toLocaleString('ja-JP')}点持ち
              {rule.mahjong.returnScore.toLocaleString('ja-JP')}点返し・ウマ{' '}
              {rule.mahjong.uma
                .map((v) => (v > 0 ? `+${v}` : String(v).replace('-', '−')))
                .join('／')}
            </li>
          )}
        </ul>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>途中経過</h2>
        <ol className={styles.ranks}>
          {rankings.map((entry) => {
            const player = state.players.find((p) => p.id === entry.playerId)
            const lead = entry.rank === 1
            return (
              <li
                key={entry.playerId}
                className={`${styles.rank} ${lead ? styles.lead : ''}`}
              >
                <span className={styles.pos}>{entry.rank}位</span>
                <i
                  className={styles.swatch}
                  style={{
                    background: player ? `var(--${player.colorKey})` : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className={styles.name}>{player?.name ?? '(不明)'}</span>
                <span className={styles.value}>
                  {formatValue(entry.total, rule)}
                  <small>{rule.unitLabel}</small>
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <section>
        <div className={styles.sectionHeadRow}>
          <h2 className={styles.sectionTitle}>スコアシート</h2>
          {rounds.length > 0 && scrollable && (
            <span className={styles.hint}>← 横にスクロール</span>
          )}
        </div>

        {rounds.length === 0 ? (
          <p className={styles.emptyState}>
            第1回を追加して記録を始めましょう
          </p>
        ) : (
          <div className={styles.tableWrap} ref={tableWrapRef}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.rowhead}>回</th>
                  {players.map((player) => (
                    <th key={player.id}>
                      <i
                        className={styles.colDot}
                        style={{ background: `var(--${player.colorKey})` }}
                        aria-hidden="true"
                      />
                      {player.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => (
                  <tr key={round.id}>
                    <th className={styles.rowhead}>
                      {finished ? (
                        roundLabel(round)
                      ) : (
                        <button
                          type="button"
                          className={`${styles.roundButton} ${
                            offRounds.includes(round) ? styles.roundOff : ''
                          }`}
                          onClick={() => handleDeleteRound(round.id, roundLabel(round))}
                        >
                          {roundLabel(round)}
                        </button>
                      )}
                    </th>
                    {game.playerIds.map((playerId) => {
                      // 麻雀では、入れた点（ウマ・オカ前）をカッコで添えて、
                      // ウマ・オカを足した最終ポイントを主に見せる
                      const entered = round.scores[playerId] ?? null
                      const value = rule.mahjong
                        ? (roundPoints(round, game.playerIds, rule)[playerId] ??
                          null)
                        : entered
                      const text = formatCell(value, rule, { plus: showPlus })
                      const cls =
                        value === null
                          ? styles.empty
                          : value < 0
                            ? styles.minus
                            : undefined
                      const body = (
                        <>
                          {text}
                          {rule.mahjong && entered !== null && (
                            <span className={styles.subValue}>
                              （{formatValue(entered, rule, { plus: true })}）
                            </span>
                          )}
                        </>
                      )
                      return (
                        <td key={playerId} className={cls}>
                          {finished ? (
                            <span className={styles.cellInner}>{body}</span>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.cellInner} ${styles.cellButton}`}
                              onClick={() => openCell(round.id, playerId)}
                            >
                              {body}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className={styles.total}>
                  <th className={styles.rowhead}>合計</th>
                  {game.playerIds.map((playerId) => {
                    const total = aggregate(rounds, playerId, rule, game.playerIds)
                    return (
                      <td
                        key={playerId}
                        className={total < 0 ? styles.minus : undefined}
                      >
                        <span className={styles.cellInner}>
                          {formatValue(total, rule, { plus: showPlus })}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {offRounds.length > 0 && (
        <p className={styles.balanceWarning}>
          {offRounds
            .map((round) => {
              const balance = roundBalance(round, game.playerIds, rule)
              return `${roundLabel(round)}の${
                rule.mahjong ? '素点' : ''
              }合計が ${(balance?.sum ?? 0).toLocaleString('ja-JP')}`
            })
            .join('、')}
          です（
          {(
            roundBalance(rounds[0], game.playerIds, rule)?.target ?? 0
          ).toLocaleString('ja-JP')}
          になるはずです）。
        </p>
      )}

      {rounds.length > 0 && !finished && (
        <p className={styles.tableHint}>
          {rule.mahjong &&
            'カッコの中はウマ・オカを足す前の点です。大きい数字が最終ポイントです。'}
          回の名前（第1回など）をタップすると、その回を削除できます。
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.add}
          onClick={handleAddRound}
        >
          ＋ 第{rounds.length + 1}回を追加
        </button>
      </div>
      <div className={styles.foot}>
        {finished ? (
          <button type="button" onClick={() => actions.reopenGame(game.id)}>
            記録を再開する
          </button>
        ) : (
          <button type="button" onClick={handleFinish}>
            ゲームを終える
          </button>
        )}
      </div>

      {sheetTarget && activeRound && (
        <ScoreInputSheet
          round={activeRound}
          players={players}
          startPlayerId={sheetTarget.playerId}
          rule={rule}
          onClose={() => setSheetTarget(null)}
        />
      )}
    </section>
  )
}
