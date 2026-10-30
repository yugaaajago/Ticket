import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { HANDLERS, PRIORITIES, dueState, fromLocalInput, sortTickets, toLocalInput } from './lib.js'
import TicketCard from './TicketCard.jsx'

const IconUsers = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.2c1.8.7 3 2.3 3 4.8" />
  </svg>
)
const IconLogout = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </svg>
)

const emptyDetail = { handler: '', handlerName: '', priority: 'normal', followUp: '', incidentAt: '' }

export default function Dashboard({ profile, onOpenAdmin }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('aktif')

  const [title, setTitle] = useState('')
  const [site, setSite] = useState('')
  const [detail, setDetail] = useState(emptyDetail)
  const [showDetail, setShowDetail] = useState(false)
  const [adding, setAdding] = useState(false)

  const [fSite, setFSite] = useState('')
  const [fHandler, setFHandler] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      setError('')
      setTickets(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setD = (k) => (e) => setDetail((d) => ({ ...d, [k]: e.target.value }))

  async function addTicket(e) {
    e.preventDefault()
    if (!title.trim() || !site.trim()) return
    setAdding(true)
    const row = {
      title: title.trim(),
      site: site.trim(),
      priority: detail.priority,
      waiting_on: detail.handler,
      waiting_name: detail.handler ? detail.handlerName.trim() : '',
      follow_up: detail.followUp || null,
      incident_at: fromLocalInput(detail.incidentAt) ?? new Date().toISOString(),
    }
    const { data, error } = await supabase.from('tickets').insert(row).select().single()
    setAdding(false)
    if (error) return setError(error.message)
    setTickets((t) => [data, ...t])
    setTitle('')
    setDetail(emptyDetail)
    setShowDetail(false)
    setTab('aktif')
  }

  async function updateTicket(id, patch) {
    const body = { ...patch }
    if ('status' in patch) body.closed_at = patch.status === 'selesai' ? new Date().toISOString() : null
    if ('waiting_on' in patch && !patch.waiting_on) body.waiting_name = ''
    const { data, error } = await supabase.from('tickets').update(body).eq('id', id).select().single()
    if (error) return setError(error.message)
    setTickets((t) => t.map((x) => (x.id === id ? data : x)))
  }

  async function deleteTicket(id) {
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) return setError(error.message)
    setTickets((t) => t.filter((x) => x.id !== id))
  }

  const sites = useMemo(
    () => [...new Set(tickets.map((t) => t.site))].sort((a, b) => a.localeCompare(b)),
    [tickets]
  )

  const open = tickets.filter((t) => t.status !== 'selesai')
  const doneCount = tickets.length - open.length
  const overdue = open.filter((t) => dueState(t) === 'overdue').length
  const today = open.filter((t) => dueState(t) === 'today').length

  const history = tab === 'riwayat'

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = tickets.filter((t) => {
      if (history !== (t.status === 'selesai')) return false
      if (fSite && t.site !== fSite) return false
      if (fHandler && t.waiting_on !== fHandler) return false
      if (needle && !`${t.title} ${t.site} ${t.waiting_name} ${t.cause} ${t.action}`.toLowerCase().includes(needle)) return false
      return true
    })
    if (history) return list.sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? ''))
    return sortTickets(list)
  }, [tickets, fSite, fHandler, q, history])

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>NOC Desk</h1>
          <span className="muted">
            {open.length} tiket belum tuntas · masuk sebagai {profile.username}
          </span>
        </div>
        <div className="top-actions">
          {profile.role === 'superadmin' && (
            <button className="icon-btn" onClick={onOpenAdmin} aria-label="Kelola user" title="Kelola user">
              <IconUsers />
            </button>
          )}
          <button className="icon-btn" onClick={() => supabase.auth.signOut()} aria-label="Keluar" title="Keluar">
            <IconLogout />
          </button>
        </div>
      </header>

      {(overdue > 0 || today > 0) && (
        <div className={`banner ${overdue > 0 ? 'danger' : 'warn'}`}>
          {overdue > 0 && <strong>{overdue} tiket lewat jadwal follow-up</strong>}
          {overdue > 0 && today > 0 && ' · '}
          {today > 0 && <span>{today} tiket follow-up hari ini</span>}
        </div>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={!history} className={!history ? 'on' : ''} onClick={() => setTab('aktif')}>
          Aktif <span className="count">{open.length}</span>
        </button>
        <button role="tab" aria-selected={history} className={history ? 'on' : ''} onClick={() => setTab('riwayat')}>
          Riwayat <span className="count">{doneCount}</span>
        </button>
      </div>

      {!history && (
        <form className="card new-ticket" onSubmit={addTicket}>
          <div className="quick">
            <input
              placeholder="Case / trouble apa?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input placeholder="Site" list="site-list" value={site} onChange={(e) => setSite(e.target.value)} required />
            <button className="primary" disabled={adding}>
              Tambah
            </button>
          </div>
          <datalist id="site-list">
            {sites.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <button type="button" className="link more" onClick={() => setShowDetail(!showDetail)} aria-expanded={showDetail}>
            {showDetail ? '▾ Sembunyikan detail' : '▸ Atur waktu, penanganan, prioritas'}
          </button>

          {showDetail && (
            <div className="grid">
              <label>
                Tanggal &amp; jam kejadian
                <input
                  type="datetime-local"
                  value={detail.incidentAt || toLocalInput()}
                  onChange={setD('incidentAt')}
                />
              </label>
              <label>
                Ditangani oleh
                <select value={detail.handler} onChange={setD('handler')}>
                  <option value="">—</option>
                  {HANDLERS.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
              <label>
                Nama (opsional)
                <input
                  placeholder="mis. Kevin"
                  value={detail.handlerName}
                  onChange={setD('handlerName')}
                  disabled={!detail.handler}
                />
              </label>
              <label>
                Prioritas
                <select value={detail.priority} onChange={setD('priority')}>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Follow-up
                <input type="date" value={detail.followUp} onChange={setD('followUp')} />
              </label>
            </div>
          )}
        </form>
      )}

      <div className="filters">
        <input placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fSite} onChange={(e) => setFSite(e.target.value)} aria-label="Filter site">
          <option value="">Semua site</option>
          {sites.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={fHandler} onChange={(e) => setFHandler(e.target.value)} aria-label="Filter penanganan">
          <option value="">Penanganan</option>
          {HANDLERS.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Memuat…</p>
      ) : visible.length === 0 ? (
        <p className="muted empty">
          {history
            ? doneCount === 0
              ? 'Belum ada tiket yang selesai.'
              : 'Tidak ada tiket yang cocok.'
            : tickets.length === 0
              ? 'Belum ada tiket. Tambahkan trouble pertamamu di atas.'
              : 'Tidak ada tiket yang cocok.'}
        </p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <TicketCard key={t.id} ticket={t} history={history} onUpdate={updateTicket} onDelete={deleteTicket} />
          ))}
        </ul>
      )}
    </div>
  )
}
