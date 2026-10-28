import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import {
  PRIORITIES,
  STATUSES,
  WAITING,
  dueState,
  fmtDate,
  fmtDateTime,
  statusLabel,
} from './lib.js'

export default function TicketCard({ ticket: t, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const due = dueState(t)

  useEffect(() => {
    if (!open) return
    supabase
      .from('ticket_notes')
      .select('*')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErr(error.message)
        else setNotes(data)
      })
  }, [open, t.id])

  async function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    const { data, error } = await supabase
      .from('ticket_notes')
      .insert({ ticket_id: t.id, body: note.trim() })
      .select()
      .single()
    if (error) return setErr(error.message)
    setNotes((n) => [data, ...n])
    setNote('')
  }

  async function removeNote(id) {
    const { error } = await supabase.from('ticket_notes').delete().eq('id', id)
    if (error) return setErr(error.message)
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  function confirmDelete() {
    if (window.confirm(`Hapus tiket "${t.title}"? Catatannya ikut terhapus.`)) onDelete(t.id)
  }

  const waiting = t.waiting_on
    ? `Menunggu ${t.waiting_on}${t.waiting_name ? ` (${t.waiting_name})` : ''}`
    : ''

  return (
    <li className={`ticket p-${t.priority} ${t.status === 'selesai' ? 'done' : ''} due-${due}`}>
      <button className="head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="line1">
          <span className="site">{t.site}</span>
          <span className={`pill s-${t.status}`}>{statusLabel(t.status)}</span>
          {t.priority === 'urgent' && <span className="pill urgent">Urgent</span>}
        </div>
        <div className="title">{t.title}</div>
        <div className="meta">
          {waiting && <span>{waiting}</span>}
          {t.follow_up && t.status !== 'selesai' && (
            <span className={`due ${due}`}>
              {due === 'overdue' ? 'Lewat · ' : due === 'today' ? 'Hari ini · ' : 'Follow-up '}
              {fmtDate(t.follow_up)}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="detail">
          <div className="grid">
            <label>
              Status
              <select value={t.status} onChange={(e) => onUpdate(t.id, { status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prioritas
              <select value={t.priority} onChange={(e) => onUpdate(t.id, { priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Menunggu siapa
              <select value={t.waiting_on} onChange={(e) => onUpdate(t.id, { waiting_on: e.target.value })}>
                <option value="">—</option>
                {WAITING.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <label>
              Nama (opsional)
              <input
                key={t.waiting_name}
                defaultValue={t.waiting_name}
                disabled={!t.waiting_on}
                placeholder="mis. Pak Budi"
                onBlur={(e) => e.target.value !== t.waiting_name && onUpdate(t.id, { waiting_name: e.target.value.trim() })}
              />
            </label>
            <label>
              Follow-up
              <input
                type="date"
                value={t.follow_up ?? ''}
                onChange={(e) => onUpdate(t.id, { follow_up: e.target.value || null })}
              />
            </label>
          </div>

          <form className="note-form" onSubmit={addNote}>
            <input placeholder="Tambah catatan…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="primary">Simpan</button>
          </form>
          {err && <p className="error">{err}</p>}

          <ul className="notes">
            {notes.map((n) => (
              <li key={n.id}>
                <span className="muted">{fmtDateTime(n.created_at)}</span>
                <span className="body">{n.body}</span>
                <button className="link small" onClick={() => removeNote(n.id)} aria-label="Hapus catatan">
                  ×
                </button>
              </li>
            ))}
            {notes.length === 0 && <li className="muted">Belum ada catatan.</li>}
          </ul>

          <div className="foot">
            <span className="muted">Dibuat {fmtDateTime(t.created_at)}</span>
            <button className="link danger" onClick={confirmDelete}>
              Hapus tiket
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
