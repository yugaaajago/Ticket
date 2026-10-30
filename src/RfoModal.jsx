import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { RFO_TYPES, buildRfo } from './rfo.js'

export default function RfoModal({ ticket, onClose }) {
  const [type, setType] = useState('pelanggan')
  const [text, setText] = useState(() => buildRfo('pelanggan', ticket))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setText(buildRfo(type, ticket))
    setCopied(false)
  }, [type, ticket])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.getElementById('rfo-text')
      ta?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Template RFO">
        <div className="modal-head">
          <h2>RFO WhatsApp</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup" title="Tutup">
            ✕
          </button>
        </div>
        <p className="muted">
          {ticket.site} · {ticket.title}
        </p>

        <div className="seg" role="tablist" aria-label="Jenis RFO">
          {RFO_TYPES.map((r) => (
            <button
              key={r.value}
              role="tab"
              aria-selected={type === r.value}
              className={type === r.value ? 'on' : ''}
              onClick={() => setType(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea id="rfo-text" value={text} onChange={(e) => setText(e.target.value)} rows={16} spellCheck={false} />
        <p className="muted small">Teks bisa diedit dulu sebelum disalin. Bagian dalam kurung perlu kamu isi di tiket.</p>

        <div className="modal-actions">
          <button className="primary" onClick={copy}>
            {copied ? 'Tersalin ✓' : 'Salin'}
          </button>
          <button className="ghost" onClick={openWhatsApp}>
            Buka WhatsApp
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
