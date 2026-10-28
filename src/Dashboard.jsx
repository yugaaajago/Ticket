import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { WAITING, dueState, sortTickets } from './lib.js'
import TicketCard from './TicketCard.jsx'

export default function Dashboard({ user }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [site, setSite] = useState('')
  const [adding, setAdding] = useState(false)

  const [fSite, setFSite] = useState('')
  const [fWaiting, setFWaiting] = useState('')
  const [q, setQ] = useState('')
  const [showDone, setShowDone] = useState(false)

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

  async function addTicket(e) {
    e.preventDefault()
    if (!title.trim() || !site.trim()) return
    setAdding(true)
    const { data, error } = await supabase
      .from('tickets')
      .insert({ title: title.trim(), site: site.trim() })
      .select()
      .single()
    setAdding(false)
    if (error) return setError(error.message)
    setTickets((t) => [data, ...t])
    setTitle('')
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
  const overdue = open.filter((t) => dueState(t) === 'overdue').length
  const today = open.filter((t) => dueState(t) === 'today').length

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = tickets.filter((t) => {
      if (!showDone && t.status === 'selesai') return false
      if (fSite && t.site !== fSite) return false
      if (fWaiting && t.waiting_on !== fWaiting) return false
      if (needle && !`${t.title} ${t.site} ${t.waiting_name}`.toLowerCase().includes(needle)) return false
      return true
    })
    return sortTickets(list)
  }, [tickets, fSite, fWaiting, q, showDone])

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>NOC Desk</h1>
          <span className="muted">{open.length} tiket belum tuntas</span>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()} title={user.email}>
          Keluar
        </button>
      </header>

      {(overdue > 0 || today > 0) && (
        <div className={`banner ${overdue > 0 ? 'danger' : 'warn'}`}>
          {overdue > 0 && <strong>{overdue} tiket lewat jadwal follow-up</strong>}
          {overdue > 0 && today > 0 && ' · '}
          {today > 0 && <span>{today} tiket follow-up hari ini</span>}
        </div>
      )}

      <form className="quick" onSubmit={addTicket}>
        <input
          placeholder="Trouble apa? (judul singkat)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Site"
          list="site-list"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          required
        />
        <datalist id="site-list">
          {sites.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button className="primary" disabled={adding}>
          Tambah
        </button>
      </form>

      <div className="filters">
        <input placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={fSite} onChange={(e) => setFSite(e.target.value)}>
          <option value="">Semua site</option>
          {sites.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={fWaiting} onChange={(e) => setFWaiting(e.target.value)}>
          <option value="">Menunggu: semua</option>
          {WAITING.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Tampilkan selesai
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Memuat…</p>
      ) : visible.length === 0 ? (
        <p className="muted empty">
          {tickets.length === 0 ? 'Belum ada tiket. Tambahkan trouble pertamamu di atas.' : 'Tidak ada tiket yang cocok.'}
        </p>
      ) : (
        <ul className="list">
          {visible.map((t) => (
            <TicketCard key={t.id} ticket={t} onUpdate={updateTicket} onDelete={deleteTicket} />
          ))}
        </ul>
      )}
    </div>
  )
}
