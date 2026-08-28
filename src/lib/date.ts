/** 端末のタイムゾーンでの YYYY-MM-DD。ISO 文字列の UTC 日付とはズレる。 */
export function todayLocal(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 保存済みの ISO 文字列を、端末のタイムゾーンの日付で表示する。 */
export function formatLocalDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  return todayLocal(date)
}
