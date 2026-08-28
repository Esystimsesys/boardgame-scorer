import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import styles from './Layout.module.css'

const APP_TITLE = 'ボードゲーム得点記録'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  /** 直接この画面を開いた（PWA を再起動した・URL を共有された）ときは
      履歴を戻れないので、ホームへ帰す。 */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="app">
      <header className={styles.header}>
        {isHome ? (
          <span className={styles.spacer} aria-hidden="true" />
        ) : (
          <button
            type="button"
            className={styles.back}
            onClick={goBack}
          >
            ← 戻る
          </button>
        )}
        <Link to="/" className={styles.title}>
          {APP_TITLE}
        </Link>
        {isHome ? (
          <span className={styles.spacer} aria-hidden="true" />
        ) : (
          <Link to="/" className={styles.home}>
            ホーム
          </Link>
        )}
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
