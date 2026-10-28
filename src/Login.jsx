import { useState } from 'react'
import { supabase } from './supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('masuk')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    const fn =
      mode === 'masuk'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })
    const { data, error } = await fn
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'daftar' && !data.session)
      setMsg('Akun dibuat. Cek email untuk konfirmasi, lalu masuk.')
  }

  return (
    <div className="center">
      <form className="card narrow" onSubmit={submit}>
        <h1>NOC Desk</h1>
        <p className="muted">Tiket pribadi untuk trouble di semua site.</p>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {msg && <p className="error">{msg}</p>}
        <button className="primary" disabled={busy}>
          {busy ? 'Tunggu…' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === 'masuk' ? 'daftar' : 'masuk')}
        >
          {mode === 'masuk' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
        </button>
      </form>
    </div>
  )
}
