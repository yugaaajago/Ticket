export const STATUSES = [
  { value: 'baru', label: 'Baru' },
  { value: 'dicek', label: 'Sedang dicek' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'selesai', label: 'Selesai' },
]

export const PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'rendah', label: 'Rendah' },
]

export const WAITING = ['Pelanggan', 'Teknisi', 'Internal']

export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v

// Tanggal lokal (bukan UTC) dalam format YYYY-MM-DD
export const todayStr = () => new Date().toLocaleDateString('en-CA')

export function dueState(t) {
  if (t.status === 'selesai' || !t.follow_up) return 'none'
  const today = todayStr()
  if (t.follow_up < today) return 'overdue'
  if (t.follow_up === today) return 'today'
  return 'later'
}

const PRIORITY_RANK = { urgent: 0, normal: 1, rendah: 2 }
// Kelompok: 0 = lewat jadwal, 1 = follow-up hari ini, 2 = lainnya
const BUCKET = { overdue: 0, today: 1, later: 2, none: 2 }

// Urutan: lewat jadwal -> hari ini -> sisanya; di tiap kelompok urgent dulu,
// lalu follow-up terdekat (yang tanpa tanggal di bawah), lalu yang terbaru
export function sortTickets(list) {
  return [...list].sort((a, b) => {
    const doneA = a.status === 'selesai'
    const doneB = b.status === 'selesai'
    if (doneA !== doneB) return doneA ? 1 : -1
    const ba = BUCKET[dueState(a)]
    const bb = BUCKET[dueState(b)]
    if (ba !== bb) return ba - bb
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority])
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (a.follow_up && b.follow_up && a.follow_up !== b.follow_up)
      return a.follow_up < b.follow_up ? -1 : 1
    if (a.follow_up && !b.follow_up) return -1
    if (!a.follow_up && b.follow_up) return 1
    return a.created_at < b.created_at ? 1 : -1
  })
}

export function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
