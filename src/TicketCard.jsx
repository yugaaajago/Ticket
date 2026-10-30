import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import RfoModal from './RfoModal.jsx'
import {
  HANDLERS,
  PRIORITIES,
  STATUSES,
  dueState,
  fmtDate,
  fmtDateTime,
  fmtDuration,
  fromLocalInput,
  statusLabel,
  toLocalInput,
} from './lib.js'

export default function TicketCard({ ticket: t, history, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [rfo, setRfo] = useState(false)
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

  const text = (field) => ({
    defaultValue: t[field],
    onBlur: (e) => e.target.value.trim() !== t[field] && onUpdate(t.id, { [field]: e.target.value.trim() }),
  })

  const handled = t.waiting_on
    ? `${t.waiting_on}${t.waiting_name ? ` (${t.waiting_name})` : ''}`
    : ''
  const duration = t.status === 'selesai' ? fmtDuration(t.incident_at, t.closed_at) : ''

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
          {handled && <span>Ditangani {handled}</span>}
          <span>{fmtDateTime(t.incident_at)}</span>
          {history && t.closed_at && (
            <span className="ok-text">
              Pulih {fmtDateTime(t.closed_at)}
              {duration && ` · ${duration}`}
            </span>
          )}
          {!history && t.follow_up && (
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
              Ditangani oleh
              <select value={t.waiting_on} onChange={(e) => onUpdate(t.id, { waiting_on: e.target.value })}>
                <option value="">—</option>
                {HANDLERS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </label>
            <label>
              Nama (opsional)
              <input
                key={`wn-${t.waiting_name}`}
                defaultValue={t.waiting_name}
                disabled={!t.waiting_on}
                placeholder="mis. Pak Budi"
                onBlur={(e) => e.target.value.trim() !== t.waiting_name && onUpdate(t.id, { waiting_name: e.target.value.trim() })}
              />
            </label>
            <label>
              Waktu kejadian
              <input
                type="datetime-local"
                value={toLocalInput(t.incident_at)}
                onChange={(e) => e.target.value && onUpdate(t.id, { incident_at: fromLocalInput(e.target.value) })}
              />
            </label>
            {t.status === 'selesai' ? (
              <label>
                Waktu pulih
                <input
                  type="datetime-local"
                  value={toLocalInput(t.closed_at)}
                  onChange={(e) => e.target.value && onUpdate(t.id, { closed_at: fromLocalInput(e.target.value) })}
                />
              </label>
            ) : (
              <label>
                Follow-up
                <input
                  type="date"
                  value={t.follow_up ?? ''}
                  onChange={(e) => onUpdate(t.id, { follow_up: e.target.value || null })}
                />
              </label>
            )}
          </div>

          <div className="grid two">
            <label>
              Penyebab
              <input key={`cause-${t.cause}`} {...text('cause')} placeholder="mis. kabel FO putus" />
            </label>
            <label>
              Tindakan
              <input key={`action-${t.action}`} {...text('action')} placeholder="mis. penyambungan ulang kabel" />
            </label>
          </div>

          <button className="ghost rfo-btn" onClick={() => setRfo(true)}>
            📋 Buat RFO WhatsApp
          </button>

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

      {rfo && <RfoModal ticket={t} onClose={() => setRfo(false)} />}
    </li>
  )
}
