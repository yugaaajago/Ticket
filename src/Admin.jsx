import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { fmtDateTime } from './lib.js'

async function api(method, body) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/api/admin-users', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = {}
  try {
    json = await res.json()
  } catch {
    /* respons bukan JSON */
  }
  if (!res.ok) throw new Error(json.error || `Gagal (${res.status}). Fitur ini hanya jalan di versi yang sudah di-deploy ke Vercel.`)
  return json
}

export default function Admin({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { users } = await api('GET')
      setUsers(users)
      setError('')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function add(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await api('POST', { username, password })
      setInfo(`User "${username.trim().toLowerCase()}" dibuat. Berikan username dan passwordnya langsung ke orangnya.`)
      setUsername('')
      setPassword('')
      await load()
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  async function resetPassword(u) {
    const pw = window.prompt(`Password baru untuk "${u.username}" (min. 8 karakter):`)
    if (!pw) return
    setError('')
    setInfo('')
    try {
      await api('PATCH', { id: u.id, password: pw })
      setInfo(`Password "${u.username}" diganti.`)
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(u) {
    if (!window.confirm(`Hapus user "${u.username}"? Semua tiket dan catatannya ikut terhapus permanen.`)) return
    setError('')
    setInfo('')
    try {
      await api('DELETE', { id: u.id })
      setInfo(`User "${u.username}" dihapus.`)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Kelola User</h1>
          <span className="muted">Hanya superadmin yang bisa melihat halaman ini</span>
        </div>
        <button className="link" onClick={onBack}>
          ← Kembali
        </button>
      </header>

      <form className="quick admin-form" onSubmit={add}>
        <input
          placeholder="Username baru"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          required
        />
        <input
          type="text"
          placeholder="Password (min. 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="off"
          required
        />
        <button className="primary" disabled={busy}>
          {busy ? 'Tunggu…' : 'Tambah'}
        </button>
      </form>

      {info && <p className="ok">{info}</p>}
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Memuat…</p>
      ) : (
        <ul className="list">
          {users.map((u) => (
            <li key={u.id} className="ticket user-row">
              <div>
                <strong>{u.username}</strong>{' '}
                <span className={`pill ${u.role === 'superadmin' ? 's-dicek' : ''}`}>
                  {u.role === 'superadmin' ? 'Superadmin' : 'User'}
                </span>
                <div className="muted">Dibuat {fmtDateTime(u.created_at)}</div>
              </div>
              <div className="actions">
                <button className="link" onClick={() => resetPassword(u)}>
                  Ganti password
                </button>
                {u.role !== 'superadmin' && (
                  <button className="link danger" onClick={() => remove(u)}>
                    Hapus
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
