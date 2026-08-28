import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useApp } from '../store/useApp'
import { formatRaw, formatValue, roundBalance, roundPoints } from '../lib/score'
import type { Player, Round, ScoreRule } from '../types'
import styles from './ScoreInputSheet.module.css'

type ScoreInputSheetProps = {
  /** 入力対象のラウンド。 */
  round: Round
  /** ゲームの参加プレイヤー（表示順）。 */
  players: Player[]
  /** シートを開いたときに最初に選ばれているプレイヤー。 */
  startPlayerId: string
  rule: ScoreRule
  /** 保存の有無に関わらず、閉じるときに呼ばれる。 */
  onClose: () => void
}

/** 閉じるアニメーション（CSS の transition と合わせる）の長さ。 */
const CLOSE_DELAY_MS = 200

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/** 入力バッファに実際の数字が含まれているか。符号や小数点だけでは「未入力」扱い。 */
function hasDigit(text: string): boolean {
  return /\d/.test(text)
}

/** 入力バッファを表示用の数値にする（未入力中は 0 として見せる）。 */
function parseDraft(text: string): number {
  if (!hasDigit(text)) return 0
  const n = Number.parseFloat(text)
  return Number.isNaN(n) ? 0 : n
}

/** 保存済みの値を、テンキーで続きから編集できる文字列に戻す。 */
function scoreToDraft(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export default function ScoreInputSheet({
  round,
  players,
  startPlayerId,
  rule,
  onClose,
}: ScoreInputSheetProps) {
  const { actions } = useApp()
  const [index, setIndex] = useState(() => {
    const i = players.findIndex((p) => p.id === startPlayerId)
    return i < 0 ? 0 : i
  })
  const [draft, setDraft] = useState(() =>
    scoreToDraft(round.scores[startPlayerId]),
  )
  const [entered, setEntered] = useState(false)

  // マウント直後に .on を付けて、スライドインのトランジションを効かせる。
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const player = players[index]

  // 回ごとの合計が決まっているゲーム（麻雀など）では、残りいくつかを見せる
  const balance = roundBalance(
    round,
    players.map((p) => p.id),
    rule,
  )

  const displayText = useMemo(
    () => formatRaw(parseDraft(draft), rule),
    [draft, rule],
  )

  function requestClose() {
    setEntered(false)
    window.setTimeout(onClose, CLOSE_DELAY_MS)
  }

  function appendDigit(d: string) {
    setDraft((t) => {
      if (rule.decimals > 0) {
        const dot = t.indexOf('.')
        if (dot >= 0 && t.length - dot - 1 >= rule.decimals) return t
      }
      return t + d
    })
  }

  function appendDecimal() {
    setDraft((t) => {
      if (t.includes('.')) return t
      if (t === '') return '0.'
      if (t === '-') return '-0.'
      return `${t}.`
    })
  }

  function toggleSign() {
    setDraft((t) => (t.startsWith('-') ? t.slice(1) : `-${t}`))
  }

  function backspace() {
    setDraft((t) => t.slice(0, -1))
  }

  /** 回ごとの合計が決まっているとき、残りぶんを今の人に入れる。 */
  function fillRemaining() {
    if (!balance) return
    const saved = round.scores[player.id]
    const others = balance.sum - (typeof saved === 'number' ? saved : 0)
    setDraft((balance.target - others).toFixed(rule.decimals))
  }

  function applyQuick(v: number) {
    const next = parseDraft(draft) + v
    setDraft(next.toFixed(rule.decimals))
  }

  /** 今の値を保存してから、指定した人へ移る。最後の人の次なら閉じる。 */
  function commitAndGo(target: number) {
    const value = hasDigit(draft) ? parseDraft(draft) : null
    actions.setScore(round.id, player.id, value)
    if (target < 0 || target === index) return
    if (target >= players.length) {
      requestClose()
      return
    }
    setIndex(target)
    setDraft(scoreToDraft(round.scores[players[target].id]))
  }

  function commitAndMove(step: 1 | -1) {
    commitAndGo(index + step)
  }

  function commitAndAdvance() {
    commitAndMove(1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        requestClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        commitAndAdvance()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      } else if (e.key >= '0' && e.key <= '9') {
        appendDigit(e.key)
      } else if (e.key === '-') {
        toggleSign()
      } else if (e.key === '.' && rule.decimals > 0) {
        appendDecimal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <>
      <div
        className={`${styles.scrim} ${entered ? styles.on : ''}`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`${styles.sheet} ${entered ? styles.on : ''}`}
        role="dialog"
        aria-label="得点を入力"
      >
        <div className={styles.head}>
          <span className={styles.who}>
            <i
              className={styles.dot}
              style={{ background: `var(--${player.colorKey})` }}
              aria-hidden="true"
            />
            {player.name}
          </span>
          <span className={styles.rnd}>
            第{round.index}回 ・ {index + 1}/{players.length}人目
          </span>
        </div>

        <ul className={styles.roster}>
          {players.map((p, i) => {
            const isCurrent = i === index
            const saved = round.scores[p.id]
            // 入力中の人は打っている値をそのまま見せる。まだ何も打って
            // いなければ、他の人と同じく未入力（—）として見せる。
            const text = isCurrent
              ? hasDigit(draft)
                ? displayText
                : '—'
              : saved === null || saved === undefined
                ? '—'
                : formatRaw(saved, rule)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${styles.rosterItem} ${isCurrent ? styles.rosterCurrent : ''}`}
                  onClick={() => commitAndGo(i)}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <span className={styles.rosterName}>{p.name}</span>
                  <span className={styles.rosterValue}>{text}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {rule.mahjong && balance?.complete && (
          <p className={styles.converted}>
            いまの素点だと{' '}
            {players
              .map((p) => {
                const pt = roundPoints(round, players.map((x) => x.id), rule)[
                  p.id
                ]
                return `${p.name} ${
                  pt === null ? '—' : formatValue(pt, rule, { plus: true })
                }`
              })
              .join('　')}
          </p>
        )}

        {balance && (
          <div className={styles.balance}>
            <span>
              この回の{rule.mahjong ? '素点' : ''}合計{' '}
              {formatRaw(balance.sum, rule)}
              {rule.mahjong ? '点' : rule.unitLabel}（
              {formatRaw(balance.target, rule)}
              {rule.mahjong ? '点' : rule.unitLabel}になるはず）
            </span>
            {balance.diff !== 0 && (
              <button
                type="button"
                className={styles.fill}
                onClick={fillRemaining}
              >
                残り {formatRaw(balance.diff, rule)} を入れる
              </button>
            )}
          </div>
        )}

        <div className={styles.display}>
          <span
            className={`${styles.value} ${hasDigit(draft) ? '' : styles.valueEmpty}`}
          >
            {displayText}
          </span>
          {/* 麻雀では素点を打つので、入力欄の単位は「点」にする */}
          {(rule.mahjong ? '点' : rule.unitLabel) && (
            <span className={styles.unit}>
              {rule.mahjong ? '点' : rule.unitLabel}
            </span>
          )}
        </div>

        {rule.quickValues.length > 0 && (
          <div
            className={styles.quick}
            style={
              {
                '--quick-cols':
                  rule.quickValues.length <= 4 ? rule.quickValues.length : 3,
              } as CSSProperties
            }
          >
            {rule.quickValues.map((v) => (
              <button key={v} type="button" onClick={() => applyQuick(v)}>
                {v >= 0 ? `+${formatRaw(v, rule)}` : formatRaw(v, rule)}
              </button>
            ))}
          </div>
        )}

        <div className={styles.pad}>
          {DIGIT_KEYS.map((d) => (
            <button key={d} type="button" onClick={() => appendDigit(d)}>
              {d}
            </button>
          ))}
        </div>
        <div className={styles.utility}>
          <button
            type="button"
            className={styles.sign}
            onClick={toggleSign}
            aria-label="符号を反転"
          >
            ＋/−
          </button>
          <button type="button" onClick={() => appendDigit('0')}>
            0
          </button>
          {/* 麻雀は素点（整数）を打つので小数点キーは出さない */}
          {rule.decimals > 0 && !rule.mahjong && (
            <button type="button" onClick={appendDecimal} aria-label="小数点">
              ．
            </button>
          )}
          <button
            type="button"
            className={styles.del}
            onClick={backspace}
            aria-label="1文字消す"
          >
            けす
          </button>
        </div>

        <div className={styles.foot}>
          <button
            type="button"
            className={styles.prev}
            onClick={() => commitAndMove(-1)}
            disabled={index === 0}
          >
            ← 前の人へ
          </button>
          <button type="button" className={styles.ok} onClick={commitAndAdvance}>
            次の人へ →
          </button>
        </div>
        <button type="button" className={styles.cancel} onClick={requestClose}>
          やめる
        </button>
      </div>
    </>
  )
}
