import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * 画面を描いている途中で例外が出たときの受け皿。
 *
 * 記録は端末の中にしか無いので、壊れたデータで真っ白になったまま
 * 何もできない状態がいちばん困る。書き出しと消去だけは必ずできるようにする。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('画面の描画で例外が出ました', error, info)
  }

  private exportRaw = () => {
    try {
      const raw = localStorage.getItem('bgs:v1') ?? ''
      const blob = new Blob([raw], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'boardgame-scorer-backup.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.alert('書き出せませんでした。')
    }
  }

  private resetAll = () => {
    if (!window.confirm('すべての記録を消してやり直します。よろしいですか？')) return
    try {
      localStorage.removeItem('bgs:v1')
    } catch {
      // 消せなくても、せめて再読み込みはする
    }
    location.href = import.meta.env.BASE_URL
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app">
        <div className={styles.wrap}>
          <h1 className={styles.title}>画面を出せませんでした</h1>
          <p className={styles.text}>
            記録の中に、このアプリが読めない形のものが混ざっているようです。
            下から今のデータを書き出して残せます。書き出したあとに消せば、
            はじめからやり直せます。
          </p>
          <button type="button" className={styles.button} onClick={this.exportRaw}>
            今のデータを書き出す
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.danger}`}
            onClick={this.resetAll}
          >
            すべての記録を消してやり直す
          </button>
          <p className={styles.detail}>{this.state.error.message}</p>
        </div>
      </div>
    )
  }
}
