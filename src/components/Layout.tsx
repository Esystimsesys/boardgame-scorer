import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import styles from './Layout.module.css'

const APP_TITLE = 'ボードゲーム得点記録'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <div className="app">
      <header className={styles.header}>
        {isHome ? (
          <span className={styles.spacer} aria-hidden="true" />
        ) : (
          <button
            type="button"
            className={styles.back}
            onClick={() => navigate(-1)}
          >
            ← 戻る
          </button>
        )}
        <Link to="/" className={styles.title}>
          {APP_TITLE}
        </Link>
        <span className={styles.spacer} aria-hidden="true" />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
