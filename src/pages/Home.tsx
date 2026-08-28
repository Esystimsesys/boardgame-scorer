import { Link } from 'react-router'
import { useApp } from '../store/useApp'
import { formatValue, standings } from '../lib/score'
import page from './Placeholder.module.css'
import styles from './Home.module.css'

export default function Home() {
  const { state } = useApp()
  const { players, games, rounds } = state

  // ゲームに呼べるのは退避していない人だけなので、判断もその人数で行う
  const activePlayers = players.filter((p) => !p.archived)
  const ongoing = games.filter((g) => g.finishedAt === null)
  const finished = games
    .filter((g) => g.finishedAt !== null)
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
    .slice(0, 3)

  return (
    <section className={page.page}>
      <h1>ホーム</h1>

      {activePlayers.length === 0 && (
        <Link to="/players" className={styles.primaryCta}>
          {players.length === 0
            ? 'まずはプレイヤーを登録する'
            : 'プレイヤーが全員退避中です。名簿から戻す'}
        </Link>
      )}

      {ongoing.length > 0 ? (
        <div className={styles.ongoingList}>
          {ongoing.map((game) => {
            const gameRounds = rounds.filter((r) => r.gameId === game.id)
            const gameStandings = standings(
              gameRounds,
              game.playerIds,
              game.rule,
            )
            const leader = gameStandings[0]
            const leaderPlayer = leader
              ? players.find((p) => p.id === leader.playerId)
              : undefined

            return (
              <Link
                key={game.id}
                to={`/games/${game.id}`}
                className={styles.ongoing}
              >
                <div className={styles.ongoingName}>{game.name}</div>
                <div className={styles.ongoingMeta}>
                  <span>参加{game.playerIds.length}人</span>
                  <span>記録{gameRounds.length}回</span>
                </div>
                {leader && leaderPlayer && gameRounds.length > 0 && (
                  <div className={styles.ongoingLeader}>
                    <span className={styles.leaderLabel}>現在の首位</span>
                    <span className={styles.leaderName}>
                      {leaderPlayer.name}
                    </span>
                    <span className={styles.leaderScore}>
                      {formatValue(leader.total, game.rule)}
                      {game.rule.unitLabel}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        activePlayers.length > 0 && (
          <Link to="/games/new" className={styles.primaryCta}>
            新しいゲームを始める
          </Link>
        )
      )}

      {finished.length > 0 && (
        <div className={styles.recentBlock}>
          <div className={styles.sectionTitle}>最近終わったゲーム</div>
          <ul className={styles.recentList}>
            {finished.map((game) => {
              const gameRounds = rounds.filter((r) => r.gameId === game.id)
              const winner = standings(
                gameRounds,
                game.playerIds,
                game.rule,
              )[0]
              const winnerPlayer = winner
                ? players.find((p) => p.id === winner.playerId)
                : undefined

              return (
                <li key={game.id}>
                  <Link to={`/games/${game.id}`} className={styles.recentRow}>
                    <span className={styles.recentName}>{game.name}</span>
                    {winner && winnerPlayer && (
                      <span className={styles.recentScore}>
                        {winnerPlayer.name}{' '}
                        {formatValue(winner.total, game.rule)}
                        {game.rule.unitLabel}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <nav className={styles.links}>
        <Link to="/games/new">新しいゲームを作る</Link>
        <Link to="/players">プレイヤー名簿</Link>
        <Link to="/history">履歴</Link>
        <Link to="/settings">設定</Link>
      </nav>
    </section>
  )
}
