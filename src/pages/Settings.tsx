import { useRef, useState, type ChangeEvent } from 'react'
import { useApp } from '../store/useApp'
import type { AppState, ThemeName } from '../types'
import { todayLocal } from '../lib/date'
import styles from './Settings.module.css'

const THEMES: { id: ThemeName; name: string; note: string; colors: string[] }[] = [
  {
    id: 'paper',
    name: '紙',
    note: '生成りの紙地に細い罫線。数字を等幅で揃える。',
    colors: ['#f5efe1', '#2c2823', '#b6392b'],
  },
  {
    id: 'retro',
    name: 'レトロ',
    note: '太い罫と角ゼロ。朱・紺・黄の3色。',
    colors: ['#f3e8d2', '#1b2a55', '#efb42d'],
  },
  {
    id: 'swiss',
    name: 'ミニマル',
    note: '白黒に朱を1色。装飾をすべて省く。',
    colors: ['#ffffff', '#111111', '#e5372a'],
  },
]

/** 取り込んだ JSON が保存形式として妥当かを確かめる。 */
function isAppState(value: unknown): value is AppState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Partial<AppState>
  return (
    v.version === 1 &&
    Array.isArray(v.players) &&
    Array.isArray(v.games) &&
    Array.isArray(v.rounds)
  )
}

export default function Settings() {
  const { state, actions } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const exportJson = () => {
    const json = JSON.stringify(state, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boardgame-scorer-${todayLocal()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('書き出しました。')
  }

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    file
      .text()
      .then((text) => {
        const parsed: unknown = JSON.parse(text)
        if (!isAppState(parsed)) {
          setMessage('このファイルは読み込めません（保存形式が違います）。')
          return
        }
        const ok = window.confirm(
          `今の記録をすべて置き換えます。よろしいですか？\n（プレイヤー ${parsed.players.length}人 / ゲーム ${parsed.games.length}件）`,
        )
        if (!ok) return
        actions.importState({ ...parsed, settings: state.settings })
        setMessage('読み込みました。')
      })
      .catch(() => setMessage('このファイルは読み込めません（JSON として壊れています）。'))
  }

  const resetAll = () => {
    if (!window.confirm('すべての記録を消します。取り消せません。よろしいですか？')) return
    if (!window.confirm('本当に消してよいですか？（書き出しは済んでいますか）')) return
    actions.resetAll()
    setMessage('すべての記録を消しました。')
  }

  return (
    <section className={styles.page}>
      <h1>設定</h1>

      <div className={styles.section}>
        <h2>デザイン</h2>
        <div className={styles.themes}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={styles.theme}
              aria-pressed={state.settings.theme === theme.id}
              onClick={() => actions.setTheme(theme.id)}
            >
              <span>
                <span className={styles.themeName}>{theme.name}</span>
                <span className={styles.themeNote}>{theme.note}</span>
              </span>
              <span className={styles.swatches} aria-hidden="true">
                {theme.colors.map((color) => (
                  <span
                    key={color}
                    className={styles.swatch}
                    style={{ background: color }}
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2>データ</h2>
        <p className={styles.lead}>
          記録はこの端末の中だけに保存されます。ブラウザのデータを消すと一緒に消えるので、
          残しておきたいときは書き出しておいてください。
        </p>
        <p className={styles.stat}>
          プレイヤー {state.players.length}人 ／ ゲーム {state.games.length}件 ／ 記録した回{' '}
          {state.rounds.length}件
        </p>
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={exportJson}>
            JSON に書き出す
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => fileRef.current?.click()}
          >
            JSON から読み込む（今の記録を置き換え）
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={importJson}
          />
          <button
            type="button"
            className={`${styles.button} ${styles.danger}`}
            onClick={resetAll}
          >
            すべての記録を消す
          </button>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </section>
  )
}
