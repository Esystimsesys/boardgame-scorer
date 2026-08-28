import { useState } from 'react'
import { Link } from 'react-router'
import type { Player } from '../types'
import { useApp } from '../store/useApp'
import page from './Placeholder.module.css'
import styles from './Players.module.css'

export default function Players() {
  const { state, actions } = useApp()
  const [newName, setNewName] = useState('')

  const active = state.players.filter((p) => !p.archived)
  const archived = state.players.filter((p) => p.archived)

  /** 同じ名前が他にいるか（表の見出しで見分けられなくなるため止める） */
  function isTaken(name: string, exceptId?: string): boolean {
    return state.players.some((p) => p.id !== exceptId && p.name === name)
  }

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (isTaken(trimmed)) {
      window.alert(
        `「${trimmed}」はすでに登録されています。表では名前で見分けるので、別の名前にしてください。`,
      )
      return
    }
    actions.addPlayer(trimmed)
    setNewName('')
  }

  function handleRename(player: Player) {
    const next = window.prompt('新しい名前', player.name)
    if (next === null) return
    const trimmed = next.trim()
    if (!trimmed) {
      window.alert('名前を入れてください。空のままなので変えていません。')
      return
    }
    if (isTaken(trimmed, player.id)) {
      window.alert(
        `「${trimmed}」はすでに登録されています。表では名前で見分けるので、別の名前にしてください。`,
      )
      return
    }
    actions.renamePlayer(player.id, trimmed)
  }

  return (
    <section className={page.page}>
      <h1>プレイヤー名簿</h1>
      <p>
        プレイヤーの追加・改名・並べ替え・退避をここで行います。ゲーム作成時はこの名簿から参加者を選びます。
      </p>

      <form
        className={styles.addRow}
        onSubmit={(e) => {
          e.preventDefault()
          handleAdd()
        }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="名前を入力"
          aria-label="プレイヤー名"
        />
        <button type="submit">追加</button>
      </form>

      {active.length === 0 ? (
        <p className={styles.empty}>まだプレイヤーがいません。</p>
      ) : (
        <ul className={styles.list}>
          {active.map((player, i) => (
            <li key={player.id} className={styles.row}>
              <i
                className={styles.dot}
                style={{ background: `var(--${player.colorKey})` }}
                aria-hidden="true"
              />
              <span className={styles.name}>{player.name}</span>
              <span className={styles.ops}>
                <button
                  type="button"
                  onClick={() => actions.movePlayer(player.id, -1)}
                  disabled={i === 0}
                  aria-label="上へ"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => actions.movePlayer(player.id, 1)}
                  disabled={i === active.length - 1}
                  aria-label="下へ"
                >
                  ↓
                </button>
                <button type="button" onClick={() => handleRename(player)}>
                  改名
                </button>
                <button
                  type="button"
                  onClick={() => actions.archivePlayer(player.id)}
                >
                  退避
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className={styles.archivedBlock}>
          <div className={styles.sectionTitle}>退避中</div>
          <p className={styles.archiveNote}>
            退避したプレイヤーは参加者の選択肢から外れますが、過去のゲーム記録はそのまま残ります。削除ではなく退避にしているのは、記録を壊さないためです。
          </p>
          <ul className={styles.list}>
            {archived.map((player) => (
              <li key={player.id} className={`${styles.row} ${styles.archivedRow}`}>
                <i
                  className={styles.dot}
                  style={{ background: `var(--${player.colorKey})` }}
                  aria-hidden="true"
                />
                <span className={styles.name}>{player.name}</span>
                <span className={styles.ops}>
                  <button
                    type="button"
                    onClick={() => actions.restorePlayer(player.id)}
                  >
                    戻す
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.players.length === 0 ? (
        <p className={styles.empty}>
          プレイヤーを登録したら、<Link to="/games/new">ゲームを作成</Link>
          できます。
        </p>
      ) : (
        <div className={styles.next}>
          {active.length >= 2 ? (
            // 名簿を整えた直後にそのままゲームを始められるようにする
            <Link to="/games/new" className={styles.nextCta}>
              このメンバーでゲームを作る
            </Link>
          ) : (
            <p className={styles.nextHint}>
              ゲームを作るには、あと{2 - active.length}人ぶん登録してください。
            </p>
          )}
        </div>
      )}
    </section>
  )
}
