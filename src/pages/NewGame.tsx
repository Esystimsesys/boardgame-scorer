import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import type { ScoreRule } from '../types'
import { useApp } from '../store/useApp'
import { defaultPreset, presets } from '../lib/presets'
import { formatValue } from '../lib/score'
import { todayLocal } from '../lib/date'
import page from './Placeholder.module.css'
import styles from './NewGame.module.css'

export default function NewGame() {
  const { state, actions } = useApp()
  const navigate = useNavigate()

  const activePlayers = useMemo(
    () => state.players.filter((p) => !p.archived),
    [state.players],
  )

  const [presetId, setPresetId] = useState(defaultPreset.id)
  const [name, setName] = useState('')
  const [rule, setRule] = useState<ScoreRule>({ ...defaultPreset.rule })
  const [quickValuesText, setQuickValuesText] = useState(
    defaultPreset.rule.quickValues.join(', '),
  )
  // 参加者は既定で全員。外す人だけ外す方が、毎回ぜんぶ選ぶより速い
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    activePlayers.map((p) => p.id),
  )

  const currentPreset =
    presets.find((p) => p.id === presetId) ?? defaultPreset
  const defaultName = `${currentPreset.label} ${todayLocal()}`
  const finalName = name.trim() || defaultName

  function handlePresetChange(id: string) {
    const preset = presets.find((p) => p.id === id) ?? defaultPreset
    setPresetId(preset.id)
    setRule({ ...preset.rule })
    setQuickValuesText(preset.rule.quickValues.join(', '))
  }

  function updateRule<K extends keyof ScoreRule>(key: K, value: ScoreRule[K]) {
    setRule((r) => ({ ...r, [key]: value }))
  }

  function handleQuickValuesChange(text: string) {
    setQuickValuesText(text)
    const values = text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => !Number.isNaN(n))
      .slice(0, 4)
    updateRule('quickValues', values)
  }

  function togglePlayer(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    )
  }

  const canCreate = selectedIds.length >= 2
  let reason = ''
  if (activePlayers.length === 0) {
    reason = '名簿にプレイヤーがいません。先に登録してください。'
  } else if (selectedIds.length < 2) {
    reason = `あと${2 - selectedIds.length}人選んでください（2人以上必要です）。`
  }

  function handleCreate() {
    if (!canCreate) return
    const id = actions.createGame({
      name: finalName,
      rule,
      playerIds: selectedIds,
    })
    // 作成画面は履歴に残さない（スコアボードで戻ったときに作成画面へ帰らないように）
    navigate('/games/' + id, { replace: true })
  }

  return (
    <section className={page.page}>
      <h1>ゲーム作成</h1>

      <div className={styles.step}>
        <h2 className={styles.stepTitle}>1. ゲーム名</h2>
        <input
          type="text"
          className={styles.textInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultName}
          aria-label="ゲーム名"
        />
        <p className={styles.hint}>
          未入力の場合は「{defaultName}」を使います。
        </p>
      </div>

      <div className={styles.step}>
        <h2 className={styles.stepTitle}>2. 得点のルール</h2>
        <ul className={styles.presetList}>
          {presets.map((preset) => (
            <li key={preset.id}>
              <button
                type="button"
                className={styles.presetBtn}
                data-active={preset.id === presetId}
                aria-pressed={preset.id === presetId}
                onClick={() => handlePresetChange(preset.id)}
              >
                <span className={styles.presetLabel}>{preset.label}</span>
                <span className={styles.presetNote}>{preset.note}</span>
              </button>
            </li>
          ))}
        </ul>

        <details className={styles.details}>
          <summary className={styles.detailsSummary}>詳細を編集</summary>

          <div className={styles.field}>
            <label htmlFor="unitLabel">単位ラベル</label>
            <input
              id="unitLabel"
              type="text"
              value={rule.unitLabel}
              onChange={(e) => updateRule('unitLabel', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="prefix">接頭記号</label>
            <input
              id="prefix"
              type="text"
              value={rule.prefix}
              onChange={(e) => updateRule('prefix', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="decimals">小数桁</label>
            <select
              id="decimals"
              value={rule.decimals}
              onChange={(e) =>
                updateRule('decimals', Number(e.target.value) as 0 | 1 | 2)
              }
            >
              <option value={0}>0桁</option>
              <option value={1}>1桁</option>
              <option value={2}>2桁</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="step">増減単位</label>
            <input
              id="step"
              type="number"
              value={rule.step}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!Number.isNaN(v)) updateRule('step', v)
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="quickValues">ワンタップ値（カンマ区切り・最大4つ）</label>
            <input
              id="quickValues"
              type="text"
              value={quickValuesText}
              onChange={(e) => handleQuickValuesChange(e.target.value)}
              placeholder="例: -10, -5, 5, 10"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="aggregation">集計方法</label>
            <select
              id="aggregation"
              value={rule.aggregation}
              onChange={(e) =>
                updateRule(
                  'aggregation',
                  e.target.value as ScoreRule['aggregation'],
                )
              }
            >
              <option value="sum">合計</option>
              <option value="average">平均</option>
              <option value="max">最大</option>
              <option value="last">最後の値</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="direction">勝敗の向き</label>
            <select
              id="direction"
              value={rule.direction}
              onChange={(e) =>
                updateRule(
                  'direction',
                  e.target.value as ScoreRule['direction'],
                )
              }
            >
              <option value="highest">高い方が勝ち</option>
              <option value="lowest">低い方が勝ち（ゴルフ式）</option>
            </select>
          </div>

          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>表示例（−1234）</span>
            <span className={styles.preview}>
              {formatValue(-1234, rule)}
              {rule.unitLabel}
            </span>
          </div>
        </details>
      </div>

      <div className={styles.step}>
        <h2 className={styles.stepTitle}>3. 参加者</h2>
        {activePlayers.length === 0 ? (
          <p className={styles.hint}>
            名簿にプレイヤーがいません。<Link to="/players">プレイヤー名簿</Link>
            から登録してください。
          </p>
        ) : (
          <ul className={styles.playerList}>
            {activePlayers.map((player) => (
              <li key={player.id}>
                <label className={styles.playerRow}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                  />
                  <i
                    className={styles.dot}
                    style={{ background: `var(--${player.colorKey})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.playerName}>{player.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.createBtn}
        disabled={!canCreate}
        onClick={handleCreate}
      >
        このゲームを始める
      </button>
      {reason && <p className={styles.reason}>{reason}</p>}
    </section>
  )
}
