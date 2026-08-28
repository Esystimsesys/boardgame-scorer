import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import type { ScoreRule } from '../types'
import { useApp } from '../store/useApp'
import { defaultPreset, presets, umaOptions } from '../lib/presets'
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

  // プリセット名は「合計が多い人が勝ち」のようなルールの説明なので、
  // ゲーム名の既定には使わない
  // いま入っているウマが、どの選択肢にあたるか
  const umaId =
    umaOptions.find(
      (o) => o.uma.join(',') === (rule.mahjong?.uma ?? []).join(','),
    )?.id ?? 'none'

  const defaultName = `ゲーム ${todayLocal()}`
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
      .slice(0, 6)
    updateRule('quickValues', values)
  }

  function togglePlayer(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    )
  }

  // 麻雀のポイント計算は4人打ちの前提（ウマもオカも4人ぶんで決まる）
  const needsFour = rule.mahjong !== null
  const canCreate = needsFour
    ? selectedIds.length === 4
    : selectedIds.length >= 2
  let reason = ''
  if (activePlayers.length === 0) {
    reason = '名簿にプレイヤーがいません。先に登録してください。'
  } else if (needsFour && selectedIds.length !== 4) {
    reason = `麻雀は4人で記録します（いま${selectedIds.length}人）。`
  } else if (!needsFour && selectedIds.length < 2) {
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

          {!rule.mahjong && (
          <div className={styles.field}>
            <label htmlFor="initialScore">開始時の持ち点</label>
            <input
              id="initialScore"
              type="number"
              value={rule.initialScore}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!Number.isNaN(v)) updateRule('initialScore', v)
              }}
            />
            <p className={styles.hint}>
              0 以外にすると、その点から始まります。たとえば 100 にして
              マイナスの点を入れていけば、持ち点を減らしていく遊び方
              （減点式）になります。合計で競うときだけ効きます。
            </p>
          </div>
          )}

          <div className={styles.field}>
            <label htmlFor="mahjongOn">麻雀のポイント計算</label>
            <label className={styles.checkRow}>
              <input
                id="mahjongOn"
                type="checkbox"
                checked={rule.mahjong !== null}
                onChange={(e) =>
                  updateRule(
                    'mahjong',
                    e.target.checked
                      ? { startScore: 25000, returnScore: 30000, uma: [20, 10, -10, -20] }
                      : null,
                  )
                }
              />
              素点を入れて、ウマ・オカ込みのポイントに換算する
            </label>
          </div>

          {rule.mahjong && (
            <>
              <div className={styles.field}>
                <label htmlFor="startScore">配給原点（持ち点）</label>
                <input
                  id="startScore"
                  type="number"
                  value={rule.mahjong.startScore}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v) && rule.mahjong)
                      updateRule('mahjong', { ...rule.mahjong, startScore: v })
                  }}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="returnScore">返し点</label>
                <input
                  id="returnScore"
                  type="number"
                  value={rule.mahjong.returnScore}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v) && rule.mahjong)
                      updateRule('mahjong', { ...rule.mahjong, returnScore: v })
                  }}
                />
                <p className={styles.hint}>
                  オカ＝（返し点 − 配給原点）× 人数 ÷ 1,000 を1位に足します。
                  25,000点持ち30,000点返しなら、1位に +20pt。素点の合計が
                  「配給原点 × 4人」になっているかも確かめます。
                </p>
              </div>

              <div className={styles.field}>
                <label htmlFor="uma">ウマ（順位点）</label>
                <select
                  id="uma"
                  value={umaId}
                  onChange={(e) => {
                    const opt = umaOptions.find((o) => o.id === e.target.value)
                    if (opt && rule.mahjong)
                      updateRule('mahjong', { ...rule.mahjong, uma: opt.uma })
                  }}
                >
                  {umaOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className={styles.hint}>
                  1位から順に{' '}
                  {rule.mahjong.uma
                    .map((v) => (v > 0 ? `+${v}` : String(v).replace('-', '−')))
                    .join('／')}
                  pt。同点のときは、その順位ぶんのウマとオカを山分けします。
                </p>
              </div>
            </>
          )}

          {!rule.mahjong && (
          <div className={styles.field}>
            <label htmlFor="roundSum">回ごとの合計</label>
            <input
              id="roundSum"
              type="text"
              inputMode="numeric"
              value={rule.roundSum === null ? '' : String(rule.roundSum)}
              onChange={(e) => {
                const t = e.target.value.trim()
                if (t === '') {
                  updateRule('roundSum', null)
                  return
                }
                const v = Number(t)
                if (!Number.isNaN(v)) updateRule('roundSum', v)
              }}
            />
            <p className={styles.hint}>
              1回ぶんの合計が決まっているゲームで使います。空欄なら確認
              しません。入力中は残りがいくつかを表示し、合わない回には
              スコアシートで印を付けます。
            </p>
          </div>
          )}

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
            <label htmlFor="quickValues">ワンタップ値（カンマ区切り・最大6つ）</label>
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
              <option value="lowest">低い方が勝ち</option>
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
