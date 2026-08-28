import { Link } from 'react-router'
import { useApp } from '../store/useApp'
import { formatValue, standings } from '../lib/score'
import page from './Placeholder.module.css'
import { formatLocalDate } from '../lib/date'
import styles from './History.module.css'

export default function History() {
  const { state, actions } = useApp()
  const { players, games, rounds } = state

  const sorted = [...games].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )

  function handleDelete(gameId: string, name: string) {
    if (window.confirm(`「${name}」を削除しますか？記録もすべて削除されます。`)) {
      actions.deleteGame(gameId)
    }
  }

  return (
    <section className={page.page}>
      <h1>履歴一覧</h1>
      <p>終了したゲームの一覧を表示し、過去の結果を見返せるようにします。</p>

      {sorted.length === 0 ? (
        <p className={styles.empty}>
          まだゲームがありません。<Link to="/games/new">ゲームを作成</Link>
          してみましょう。
        </p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((game) => {
            const gameRounds = rounds.filter((r) => r.gameId === game.id)
            const participantNames = game.playerIds
              .map((id) => players.find((p) => p.id === id)?.name ?? '?')
              .join('、')
            const isFinished = game.finishedAt !== null
            const winner = isFinished
              ? standings(gameRounds, game.playerIds, game.rule)[0]
              : undefined
            const winnerPlayer = winner
              ? players.find((p) => p.id === winner.playerId)
              : undefined

            return (
              <li key={game.id} className={styles.row}>
                <Link to={`/games/${game.id}`} className={styles.rowLink}>
                  <div className={styles.rowTop}>
                    <span
                      className={
                        isFinished ? styles.badge : styles.badgeOngoing
                      }
                    >
                      {isFinished ? '終了' : '進行中'}
                    </span>
                    <span className={styles.name}>{game.name}</span>
                  </div>
                  <div className={styles.meta}>
                    {formatLocalDate(game.createdAt)} ・ {participantNames}
                  </div>
                  {isFinished && winner && winnerPlayer && (
                    <div className={styles.winner}>
                      勝者 {winnerPlayer.name}{' '}
                      {formatValue(winner.total, game.rule)}
                      {game.rule.unitLabel}
                    </div>
                  )}
                </Link>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(game.id, game.name)}
                >
                  削除
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
